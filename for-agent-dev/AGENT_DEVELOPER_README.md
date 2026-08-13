# Whats Awesome Agent Developer README

> 面向后续接入本仓库的 Agent。先读这份，再进入具体任务。
> 工作语言: 中文。任何密钥、Token、AK/SK、OAuth 配置只从本机 `~/.codex/user-config` 或运行环境读取，不写入仓库、不打印明文。

## 0.1 云端联调入口

当前后端已部署到华为云 FunctionGraph，并通过 APIG 暴露一个公网只读入口，供前端和 QA 先看页面效果:

- 云端只读 Base URL: `https://03ce15e6b04e43d088581ceb15d5a4f7.apic.cn-north-4.huaweicloudapis.com/whatsawesome`
- 健康检查: `GET /api/health`
- 技能列表: `GET /api/portal/skills` 或兼容路径 `GET /api/skills`
- 只读限制: 当前 APIG 只发布 `GET /whatsawesome...`，`POST/PUT/PATCH/DELETE` 不对公网开放。
- 管理保护: 公共函数入口默认阻断 `/api/admin/*` 和 `/api/admin-agent/*`，即使通过公网路径访问也返回 `403`。
- 本地完整能力: 需要玩家创建、手工点亮、管理审核、Admin-Agent 候选提交等写接口时，仍先使用本地 `http://localhost:8000`，后续再按明确授权开放云端写入口。
- 当前存储: 云端版本仍是内存 + JSON 种子数据；GaussDB 表设计已在仓库中，但本轮未创建生产数据库实例。

前端 Agent 建议把 API base 配成上面的云端 Base URL，然后继续按 OpenAPI 的 `/api/...` 路径调用。例如完整健康检查地址是:

```text
https://03ce15e6b04e43d088581ceb15d5a4f7.apic.cn-north-4.huaweicloudapis.com/whatsawesome/api/health
```

## 0. 项目一句话

Whats Awesome 是一个团队技能养成游戏化平台: 团队成员在这里看到 AI 时代最新、最值得掌握的技能，阅读技能 Doc，亲手试炼并点亮技能，再通过个人主页获得勋章、Title 和成长境界。

产品世界观叫 **仙穹**:

- 技能 = 功法 / Boss
- 案例 = 多技能组合的试炼副本
- 玩家 = 闯关修行者
- 点亮 = 完成一次可证明的技能体验
- 勋章 = 法印
- 成长 = 炼气期到神魔期

## 1. 当前仓库现状

本仓库已经不是空仓。当前代码处于“迭代一技能对象 + 迭代二后端先行骨架”状态:

| 区域 | 当前内容 | 说明 |
|---|---|---|
| `frontend/` | Vue 3 + Vite + Element Plus | 已有技能大厅和技能详情页 |
| `backend/` | Node Express API | 读取本地 JSON 种子数据，接口契约对齐后续 FunctionGraph |
| `backend/data/` | 技能、案例、勋章、标签、境界种子数据 | 后续迁移到 GaussDB 表 |
| `backend/db/migrations/` | GaussDB 初始化 SQL | 后续创建云上实例后执行 |
| `backend/test/` | Node 内置测试 | 覆盖技能兼容、玩家、案例、点亮、审核、勋章 |
| `for-agent-dev/` | 项目规格、系统设计、任务清单、标签体系 | 所有 Agent 的协作资料区 |
| `for-agent-dev/05-backend-api-openapi.yaml` | 后端 OpenAPI 文档 | 前端 / 裁判 / QA Agent 按此对接 |
| `for-agent-dev/ux/` | 玩家端/管理端高保真原型与设计交付 | UX 最新版本在这里，不在根目录 `ux/` |
| `qa-playwright-capture.sh` | 截图 QA 脚本 | 供后续 UI 验收使用 |

历史设计文档里如果出现“空仓”“待建”等表述，以当前代码为准；文档可以在迭代中持续修正。

## 2. 新 Agent 入场顺序

1. 先读本文件，确认项目边界和自己角色。
2. 需要业务背景时读 `for-agent-dev/01-site-setup.md`。
3. 需要架构和数据模型时读 `for-agent-dev/02-system-design.md`。
4. 需要领任务时读 `for-agent-dev/03-development-tasklist.md`。
5. 需要标签、厂商、领域分类时读 `for-agent-dev/04-tag-taxonomy.md`。
6. 对接后端前读 `for-agent-dev/05-backend-api-openapi.yaml` 和 `for-agent-dev/06-backend-development-plan.md`。
7. 做 UI 前必须读 `for-agent-dev/ux/README.md` 和 `for-agent-dev/ux/设计交付文档.md`，必要时打开 `user.html` / `admin.html` 对照。

## 3. 本地运行

后端:

```bash
cd backend
npm install
npm start
```

默认地址: `http://localhost:8000`

前端:

```bash
cd frontend
npm install
npm run dev
```

默认地址: `http://localhost:5173`

当前 API:

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/portal/skills?tag=&min_lv=&max_lv=&q=` | 技能列表 |
| GET | `/api/portal/skills/:slug` | 技能详情 |
| GET | `/api/portal/meta/stages` | 八境难度映射 |
| GET | `/api/portal/meta/labels` | 标签字典 |
| GET | `/api/portal/cases` | 案例列表 |
| GET | `/api/portal/cases/:slug` | 案例详情 |
| GET | `/api/portal/news` | 已发布资讯 |
| POST | `/api/portal/players` | 创建或更新玩家档案 |
| GET | `/api/portal/players/:id/profile` | 玩家个人主页聚合 |
| GET | `/api/portal/quests?player_id=&status=` | 闯关申请流水 |
| POST | `/api/portal/quests/manual` | 提交手工点亮申请 |
| POST | `/api/admin/quests/:id/review` | 管理员审核点亮申请 |

标准接口文档见 `for-agent-dev/05-backend-api-openapi.yaml`。

## 4. 后端接入方式

后端第一稿已经提供本地可跑的 Node Express API，用于前端 Agent、管理端 Agent、技能 Agent、裁判 Agent、QA Agent 并行开发。当前存储是内存 + JSON 种子数据，接口契约会迁移到华为云 APIG + FunctionGraph + GaussDB。

调用约定:

- 本地基础地址: `http://localhost:8000`
- 前端开发地址: `http://localhost:5173`，Vite 已代理 `/api` 到后端；新 Agent 对接用户面 REST 时使用 `/api/portal`，旧 `/api/*` 仅作为本地兼容路径保留。
- 请求体统一使用 `application/json`。
- 列表响应统一是 `{ total, items }`。
- 错误响应统一是 `{ error, message }`。
- 管理端本地临时用请求头 `x-admin-id: admin-founder` 或 `x-admin-id: admin-secretary`，正式版本会替换为 GitCode OAuth + RBAC。

四类接口面:

| 接口面 | 路径 | 调用方 | 权限原则 |
|---|---|---|---|
| 用户面人用 REST | `/api/portal/*` | 玩家端 Web、移动端、普通浏览器会话 | 只看 `published` 内容；玩家只能操作自己的档案、点亮和主页 |
| 用户面开发者 Agent MCP | Portal MCP 服务，契约见 `for-agent-dev/07-portal-mcp-contract.md` | 玩家把自己的 Agent 连到本系统 MCP Server | 使用玩家 MCP token，只能代表当前玩家读技能 Doc、提交证据、申请点亮 |
| 管理面人用 REST | `/api/admin/*` | 管理端 Web，仅 2 个管理员 | GitCode OAuth + 服务端 RBAC + 审计；用户面知道路径也必须返回 `403` |
| 管理面 Agent REST | `/api/admin-agent/*` | 技能 Agent、资讯爬取 Agent、内容生成函数 | 服务到服务鉴权 + HMAC 签名 + 幂等键；只写候选，不直接发布 |

管理面 Agent 定时提交规则:

- 技能 Agent 不调用 `/api/admin/*`，因为管理面 API 代表人类管理员的审核权。
- 定时爬虫/内容生成函数提交到 `/api/admin-agent/skill-candidates`、`/api/admin-agent/news-candidates`、`/api/admin-agent/case-candidates`。
- Agent 提交的数据默认是 `pending_review` 或 `draft`，玩家端不可见。
- 管理端再从 `/api/admin/*-candidates` 拉取候选，人工 `approve/reject` 后才发布。
- Agent 写接口必须带 `idempotency_key`、`source_url`、`crawl_run_id`、`model_meta`，方便去重和审计。
- 玩家自己的 Agent 不调用 `/api/admin-agent/*`，也不直接调用 `/api/portal/quests/manual` 做自动点亮；自动闯关通过 Portal MCP 工具进入同一条 `quest` 流水。

最小联调用例:

```bash
# 健康检查
curl http://localhost:8000/api/health

# 创建玩家
curl -X POST http://localhost:8000/api/portal/players \
  -H "content-type: application/json" \
  -d "{\"gitcode_id\":\"demo-user\",\"gitcode_username\":\"demo\"}"

# 提交手工点亮
curl -X POST http://localhost:8000/api/portal/quests/manual \
  -H "content-type: application/json" \
  -d "{\"player_id\":\"player_1\",\"target_type\":\"skill\",\"target_slug\":\"mcp\",\"evidence\":{\"description\":\"完成 MCP Hello World\"}}"

# 管理员审核通过
curl -X POST http://localhost:8000/api/admin/quests/quest_1/review \
  -H "content-type: application/json" \
  -H "x-admin-id: admin-founder" \
  -d "{\"decision\":\"approved\",\"judge_note\":\"证据完整\"}"

# 查看个人主页聚合
curl http://localhost:8000/api/portal/players/player_1/profile

# 管理面 Agent 提交技能候选
curl -X POST http://localhost:8000/api/admin-agent/skill-candidates \
  -H "content-type: application/json" \
  -H "x-admin-agent-id: skill-agent" \
  -H "x-admin-agent-signature: local-dev-signature" \
  -H "x-idempotency-key: crawl-20260813-skill-001" \
  -d "{\"name\":\"示例技能\",\"slug\":\"demo-skill\",\"vendor_name\":\"Huawei Cloud\",\"category_tags\":[{\"key\":\"ai-coding\",\"label\":\"AI 编程\"}],\"difficulty_lv\":12,\"importance\":{\"score\":8,\"basis\":\"团队高频使用\"},\"doc\":{\"summary\":\"示例\",\"official_url\":\"https://example.com\",\"repo_url\":\"https://example.com/repo\",\"ecosystem\":\"示例生态\",\"hello_world\":\"运行 Hello World\",\"learning_prompt\":\"请带我学习这个技能\"},\"provenance\":{\"source_url\":\"https://example.com\",\"source_vendor\":\"Huawei Cloud\",\"crawl_run_id\":\"crawl_20260813\"}}"
```

角色接入提示:

- 前端 Agent: 只按 OpenAPI 调接口，不直接读 `backend/data/*.json`。
- 裁判 Agent: 迭代三 MCP 工具内部应复用 `quest` 点亮流水，不另造一套点亮记录；玩家 Agent 只接 Portal MCP。
- 技能 Agent: 生成技能/案例/资讯时只调用 `/api/admin-agent/*` 提交候选，不调用 `/api/admin/*`。
- 管理端 Agent: 只调用 `/api/admin-agent/*` 写候选；真正审核、编辑、发布、驳回由管理端人用 `/api/admin/*` 完成。
- QA Agent: 以 `backend/test/iteration2-api.test.js` 作为后端冒烟基线，新增接口时同步补测试。
- 后端 Agent: 新增/修改接口后，必须同步更新 `05-backend-api-openapi.yaml` 和 `06-backend-development-plan.md`。

## 5. 六类 Agent 分工

| Agent | 主要职责 | 主要产物 | 关键边界 |
|---|---|---|---|
| 项目经理 Agent | 需求澄清、领域模型、接口契约、迭代计划、验收组织 | 规格、设计、OpenAPI、任务拆解、复盘 | 不直接替代前后端实现，但要守住对象边界 |
| 前端 Agent | 玩家端、管理端、个人主页、闯关交互、UX 落地 | Vue 页面、组件、设计 Token、截图验收 | 只通过 API 契约访问领域数据，不绕过后端读写 |
| 后端 Agent | 领域 API、鉴权、数据层、对象存储、勋章规则、点亮流水 | FunctionGraph/API/GaussDB/OBS 代码与迁移 | 不把内容生成逻辑写死在业务 API 内 |
| 技能 Agent | 技能采集、技能 Doc、资讯摘要、重要性评估、案例生成 | 内容流水线、AI 提示词、候选技能/案例 | 产出 draft 候选，露出由管理面审核 |
| 裁判 Agent | 点亮判定、MCP Server、判定规则、证据校验 | MCP 工具、判定函数、点亮接口联调文档 | 判定与点亮写入解耦，必须保留人工兜底 |
| QA Agent | 冒烟、功能、回归、截图、MCP 联调、上线验收 | 测试报告、缺陷清单、截图证据 | 不只测 happy path，要覆盖权限、失败、降级 |

六个 Agent 可以并行，但必须通过清晰契约协作: API 契约、数据字段、事件状态、验收标准。

## 6. 核心对象边界

### Skill 技能

技能是当前第一优先级对象。它描述一个可学习、可挑战、可点亮的技术能力。

稳定字段:

- `name` / `slug`
- `vendor_name` / `vendor_type`
- `logo_url`
- `category_tags`
- `difficulty_lv`
- `importance`
- `doc`
- `status`
- `related_news`

实现规则:

- `slug` 是外部路由和 API 入口，创建后不要随意改。
- Doc 是富内容，后续入 GaussDB 的 JSONB/JSON 列，不要把 Doc 拆到一堆前端硬编码里。
- 标签来自 `label_dict`，不要临时造 UI 专用标签。
- 用户面只展示 `published` 技能；`draft` / `archived` 留给管理面。
- 列表接口返回卡片摘要，详情接口返回完整 Doc。

### Case 案例

案例是多个技能组合成的场景化试炼。

稳定字段建议:

- `name` / `slug`
- `scenario_desc`
- `skill_ids` 或 `skill_slugs`
- `source` = `ai_generated` / `manual`
- `category_tags`
- `difficulty_lv`
- `importance`
- `status`

实现规则:

- 案例弱引用技能，不要强耦合到技能内部结构。
- 案例可以由技能 Agent 生成，但必须进入管理审核。
- 点亮案例和点亮技能共用 `quest_log`，通过 `target_type=case` 区分。

### Player 玩家

玩家来自 GitCode 登录，是所有点亮、勋章、主页的承载对象。

稳定字段建议:

- `gitcode_id`
- `gitcode_username`
- `avatar_url`
- `role` = `player` / `admin`
- `badges`
- `growth`

实现规则:

- 用户面登录使用 GitCode OAuth，scope 最小化。
- 管理面只允许 2 个白名单账号。
- 玩家主页不要直接计算一切，后端应提供可展示的聚合视图。

### Quest / Judge 闯关与判定

`quest_log` 是点亮事件流，不是某个页面的附属表。

稳定字段建议:

- `player_id`
- `target_type` = `skill` / `case`
- `target_id`
- `method` = `manual_upload` / `mcp_auto` / `admin_grant`
- `evidence`
- `judge_status` = `pending` / `approved` / `rejected`
- `judged_by`
- `judge_note`
- `lit_at`

实现规则:

- 手动上传、MCP 自动判定、管理员授予都写同一种点亮流水。
- 判定逻辑可以升级，但点亮事件格式要稳定。
- 证据文件走 OBS 预签名 URL，不落本地、不进数据库大字段。
- AI 判定必须保留理由和时间戳，便于复盘。

### News 资讯

资讯由技能 Agent 每天抓取和摘要，关联技能时在用户面跳技能详情。

实现规则:

- 优先官方源、可信源；不要把未经核验的内容伪装成事实。
- 抓取失败不阻塞主流程，降级为空列表并告警。
- 关联技能使用 `related_skill_id` 或 `related_skill_slug`，不要在资讯里复制整份技能对象。

### Badge / Label / Difficulty 元数据

勋章、标签、境界都是可配置元数据。

实现规则:

- 境界映射固定为 8 段: 炼气、筑基、结晶、具灵、悟道、羽化、登仙、神魔。
- 标签分 `domain` 和 `vendor` 两类。一个技能建议 2-4 个领域标签 + 1 个厂商标签。
- 勋章规则放在 `badge_def.rule`，不要散落在前端判断里。

## 7. 架构方向

当前实现是本地快速骨架:

```text
Vue3 SPA -> Vite proxy -> Node Express -> backend/data/*.json
```

长期目标是华为云优先:

```text
Vue3 SPA(OBS + CDN)
  -> APIG
  -> FunctionGraph 领域函数
  -> GaussDB(for openGauss, JSONB) + OBS
  -> 盘古大模型 / ModelArts Studio
  -> FunctionGraph MCP Server(裁判 Agent)
```

选型原则:

- 前端: Vue 3 + Vite + Element Plus。
- 后端: FunctionGraph HTTP 函数，当前 Express 仅用于迭代一快速验证契约。
- 数据库: 默认 GaussDB(for openGauss) + JSONB；如团队更熟 MySQL，可切 GaussDB(for MySQL) + JSON，领域模型不变。
- 文件: OBS，使用预签名上传。
- AI: 盘古大模型，用于重要性评估、Doc 提示词、资讯摘要、案例生成、判定辅助。
- MCP: 迭代三基于 FunctionGraph 官方 MCP Server 模板，对外暴露 APIG/SSE。

## 8. API 与数据契约约定

新增接口时遵循以下习惯:

- 列表接口返回 `{ total, items }`。
- 详情接口返回一个完整对象。
- 错误返回 `{ error, message? }`，不要返回 HTML。
- 用户面只读接口默认只返回 `published` 数据。
- 管理面接口必须做角色校验和审计记录。
- 写接口要能表达状态流转，例如 `draft -> published -> archived`、`pending -> approved/rejected`。

数据字段命名优先使用当前 JSON 种子里的 snake_case。前端不要自行发明另一套字段。

## 9. UX 落地约定

设计主线是“修仙 x 科技”，不是普通学习平台。

玩家端:

- 主题: 玄夜仙穹，深色沉浸。
- 主色: 鎏金 `#E7C87B`。
- 关键组件: 技能 Boss 卡、Boss 环形等级盘、灵犀提示词、闯关 Modal、个人洞府、法印勋章、点亮星图。

管理端:

- 主题: 琅嬛玉阁，浅色宣纸。
- 主色: 朱砂 `#C2452F`。
- 关键组件: 技能候选审核、技能编辑抽屉、标签管理、灵讯管理、玩家仙籍、勋章铸造。

做 UI 前必须对照 `for-agent-dev/ux/设计交付文档.md`。如果为了 MVP 做简化，要在交付说明里写明哪些设计能力被延期。

## 10. 迭代路线

### 迭代一: 技能对象

目标: 技能数据、技能 API、技能大厅、技能详情页。

当前已具备:

- 14 个技能种子数据。
- 难度境界映射。
- 标签字典。
- 技能列表/详情 API。
- 技能大厅/详情页。

后续可继续补强:

- 与 UX 原型对齐视觉。
- 管理面技能审核。
- 技能 CRUD 和状态机。
- 真实数据源和 AI 生成 Doc 流程。

### 迭代二: 玩家与手工点亮

目标: GitCode 登录、玩家档案、截图/日志上传、人工/规则审核、技能墙、勋章 v1、个人主页 v1。

关键约束:

- 上传走 OBS 预签名。
- 点亮写 `quest_log`。
- 勋章由规则引擎从点亮事件计算。

### 迭代三: MCP 自动闯关与资讯

目标: 裁判 MCP Server、每日资讯爬取、技能关联、MCP 自动点亮。

分工:

- 玩家自己的开发者 Agent 只连接 Portal MCP，不拿管理权限。
- Portal MCP 内部复用后端 `quest` 流水，必要时调用裁判判定函数。
- 技能/资讯定时采集属于管理面 Agent，走 `/api/admin-agent/*` 写候选。
- 人类管理员在 `/api/admin/*` 审核候选后，玩家端 `/api/portal/*` 才可见。

Portal MCP 工具建议:

- `verify_quest(skill_slug, player_token, evidence_url)`
- `light_up_skill(skill_slug, player_token, judge_result)`
- `get_skill_doc(skill_slug)`
- `list_available_quests(player_token)`

详细契约见 `for-agent-dev/07-portal-mcp-contract.md`。

### 迭代四: AI 强化与体验打磨

目标: 盘古全量评估、AI 生成案例、个人主页炫酷化、规则可视化、安全加固、全量回归。

## 11. 安全与配置

- 不提交 `.env`、Token、密码、AK/SK、OAuth secret、cookie、私钥。
- 本机关键配置统一在 `~/.codex/user-config`，只能引用路径或读取到运行环境，不在聊天和日志里打印明文。
- GitCode OAuth 使用最小 scope。
- 管理员白名单配置化，不写死在前端。
- OBS 上传使用预签名 URL，服务端只保存文件 URL、hash、大小、类型、上传者、时间。
- AI 生成内容必须带来源、生成时间、模型/提示词版本，方便追溯。

## 12. 开发完成标准

任意 Agent 提交任务前，至少确认:

- 变更没有破坏当前本地启动路径。
- 新增或修改了 API 时，同步更新 `for-agent-dev/05-backend-api-openapi.yaml` 和 `for-agent-dev/06-backend-development-plan.md`。
- 新增领域字段时，同步更新种子数据、迁移设计和前端类型假设。
- UI 变更对照 UX 文档，关键页面要能截图验收。
- 涉及鉴权、上传、点亮、MCP、AI 的改动要覆盖失败路径。
- 没有提交敏感配置。
- 最终说明里写清楚运行方式、验证结果、遗留风险。

## 13. 交付说明模板

后续 Agent 完成任务时，建议在交付回复或 PR 描述里包含:

```md
## 本次角色
前端 Agent / 后端 Agent / 技能 Agent / 裁判 Agent / QA Agent / 项目经理 Agent

## 完成内容
- ...

## 涉及文件
- ...

## API / 数据契约变化
- ...

## 验证
- 启动:
- 测试:
- 截图:

## 遗留问题
- ...
```

## 14. 重要提醒

- 不要把设计文档当成已经实现的代码能力。先看代码，再看文档目标。
- 不要为了某个页面临时绕过领域边界。技能、案例、玩家、点亮、勋章、资讯要保持独立模块和稳定契约。
- 不要把“游戏化文案”只当视觉皮肤。难度、成长、勋章、点亮反馈都应该成为真实产品机制。
- 不要一次性追求全量大平台。当前节奏是: 先技能，再手工点亮，再 MCP 自动判定，再 AI 强化。
