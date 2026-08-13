# Whats Awesome Portal MCP 接入契约

> 版本: v0.1
> 状态: 迭代三规划契约，后端迭代二已先行保留 `quest_log.method=mcp_auto` 的领域模型。
> 适用对象: 玩家自己的 Agent、IDE Agent、MCP Client、裁判 Agent、QA Agent。

## 1. 边界定义

Portal MCP 是用户面开发者 Agent 的自动闯关入口，不是管理面 API。

四类入口的分工如下:

| 场景 | 入口 | 调用方 | 能做什么 | 不能做什么 |
|---|---|---|---|---|
| 用户面人用 REST | `/api/portal/*` | 玩家端页面 | 浏览技能、案例、资讯，提交手工点亮，查看个人主页 | 不能审核、不能发布、不能写候选内容 |
| 用户面开发者 Agent MCP | Portal MCP Server | 玩家自己的 Agent | 读取技能 Doc、提交证据、触发判定、为当前玩家申请点亮 | 不能调用管理能力，不能代表其他玩家 |
| 管理面人用 REST | `/api/admin/*` | 管理端页面、管理员 | 审核候选、发布/驳回、审核点亮、查看审计 | 不能被普通用户会话调用成功 |
| 管理面 Agent REST | `/api/admin-agent/*` | 技能 Agent、资讯 Agent、定时采集函数 | 提交技能/案例/资讯候选，写入 `pending_review` | 不能直接发布到用户面，不能审核 |

## 2. 推荐部署形态

目标云能力优先使用华为云:

```text
玩家 Agent / MCP Client
  -> APIG MCP 出口
  -> FunctionGraph Portal MCP Server
  -> FunctionGraph 领域 API / 领域服务
  -> GaussDB(for openGauss) + OBS
```

部署说明:

- MCP Server 建议基于 FunctionGraph MCP Server 模板实现。
- APIG 负责 HTTPS 出口、限流、CORS/Origin 策略和鉴权前置。
- MCP 工具内部复用后端领域服务，最终写入同一张 `quest_log`，不要另建一套点亮记录。
- 证据文件仍走 OBS，MCP 只提交 `file_url`、`artifact_url`、`repository_url`、hash 等元数据。

## 3. 鉴权模型

玩家在 Portal 页面登录 GitCode 后，可以生成或轮换 MCP token。

Token 约束:

- 只绑定一个 `player_id`。
- scope 默认为 `portal:mcp:quest`，可扩展 `portal:mcp:read`。
- 只能访问当前玩家的进度、当前玩家提交的证据和点亮流水。
- 不能调用 `/api/admin/*` 或 `/api/admin-agent/*`。
- 过期时间建议 7-30 天，支持玩家主动撤销。

本地开发阶段可先用临时 header 模拟:

| Header | 说明 |
|---|---|
| `x-player-id` | 当前玩家 ID |
| `x-player-mcp-token` | 本地临时 token，正式版本由服务端签发和校验 |

正式版本必须把 token secret 放在 DEW/CSMS 或运行环境配置中，不写入仓库。

## 4. MCP 工具契约

### `get_skill_doc`

读取一个已发布技能的完整 Doc，方便玩家 Agent 按系统给出的学习提示词完成练习。

输入:

```json
{
  "skill_slug": "mcp"
}
```

输出:

```json
{
  "skill": {
    "slug": "mcp",
    "name": "MCP",
    "difficulty_lv": 24,
    "doc": {
      "summary": "...",
      "official_url": "...",
      "repo_url": "...",
      "hello_world": "...",
      "learning_prompt": "..."
    }
  }
}
```

### `list_available_quests`

列出玩家可以挑战的技能和案例。

输入:

```json
{
  "target_type": "skill",
  "tag": "ai-agent",
  "min_lv": 1,
  "max_lv": 30
}
```

输出:

```json
{
  "total": 1,
  "items": [
    {
      "target_type": "skill",
      "target_slug": "mcp",
      "name": "MCP",
      "difficulty_lv": 24,
      "already_lit": false
    }
  ]
}
```

### `submit_skill_evidence`

提交技能证据并创建 MCP 自动点亮流水。这个工具不直接保证点亮成功，必须经过判定。

输入:

```json
{
  "skill_slug": "mcp",
  "evidence": {
    "description": "我完成了 MCP Hello World，并让本地 Agent 调用了一个工具。",
    "artifact_url": "https://example.com/demo",
    "repository_url": "https://gitcode.com/team/demo",
    "file_url": "obs://whatsawesome-evidence/player_1/mcp-log.txt"
  }
}
```

输出:

```json
{
  "quest": {
    "id": "quest_123",
    "target_type": "skill",
    "target_slug": "mcp",
    "method": "mcp_auto",
    "judge_status": "pending"
  }
}
```

### `verify_quest`

对技能或案例证据做自动判定。判定可以是规则、产物探测、日志解析，也可以引入盘古大模型辅助，但必须返回可审计理由。

输入:

```json
{
  "quest_id": "quest_123",
  "target_type": "skill",
  "target_slug": "mcp",
  "evidence": {
    "description": "完成 MCP Hello World",
    "artifact_url": "https://example.com/demo"
  }
}
```

输出:

```json
{
  "passed": true,
  "score": 0.92,
  "judge_note": "证据包含可复现仓库和工具调用日志。",
  "checks": [
    { "name": "artifact_reachable", "passed": true },
    { "name": "required_keywords", "passed": true }
  ]
}
```

### `light_up_skill`

在自动判定通过后，为当前玩家点亮技能。

输入:

```json
{
  "quest_id": "quest_123",
  "skill_slug": "mcp",
  "verification_result": {
    "passed": true,
    "score": 0.92,
    "judge_note": "证据完整。"
  }
}
```

输出:

```json
{
  "quest": {
    "id": "quest_123",
    "judge_status": "approved",
    "lit_at": "2026-08-13T00:00:00.000Z"
  },
  "granted_badges": []
}
```

### `light_up_case`

与 `light_up_skill` 一致，只是 `target_type=case`，用于案例闯关点亮。

### `get_player_progress`

读取当前玩家的成长、已点亮技能、已点亮案例和勋章。

输入:

```json
{}
```

输出:

```json
{
  "player_id": "player_1",
  "growth": {
    "realm": "筑基期",
    "exp": 120,
    "total_lit": 4
  },
  "lit_skill_slugs": ["mcp"],
  "lit_case_slugs": [],
  "badges": []
}
```

## 5. 状态机

MCP 自动点亮仍然复用 `quest_log`:

```text
submit_skill_evidence
  -> quest_log(method=mcp_auto, judge_status=pending)
  -> verify_quest
  -> light_up_skill / light_up_case
  -> judge_status=approved 或 rejected
  -> badge rule engine
  -> player profile aggregation
```

关键约束:

- 判定失败写 `judge_status=rejected`，并保留 `judge_note`。
- 自动判定低置信度时可以保持 `pending`，交给管理员在 `/api/admin/quests/{id}/review` 兜底。
- 同一玩家、同一技能或案例只允许一个最终 `approved` 记录。
- 所有 MCP 自动点亮都要写审计事件，包含工具名、玩家、目标、判定摘要、模型元数据。

## 6. QA 验收要点

- 玩家 MCP token 无法访问其他玩家进度。
- 玩家 MCP token 无法调用 `/api/admin/*` 和 `/api/admin-agent/*`。
- `get_skill_doc` 只返回 `published` 技能。
- 证据缺少 `description` 或有效产物引用时，`submit_skill_evidence` 返回校验错误。
- `verify_quest` 失败时不会点亮。
- `light_up_skill` 必须检查 `verification_result.passed=true`。
- MCP 自动点亮后，`/api/portal/players/{id}/profile` 能看到新技能和勋章变化。
