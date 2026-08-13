# Whats Awesome 后端开发规划

> 版本: v0.2 · 日期: 2026-08-13  
> 负责人角色: 后端 Agent  
> 接口契约: `for-agent-dev/05-backend-api-openapi.yaml`  
> 云操作约束: 所有华为云资源操作必须通过 `huaweicloud/huaweicloud-devkit` 能力或其约定的 KooCLI 路径完成。

## 1. 第一稿状态

第一稿后端已经完成“迭代二先行”的本地可跑版本，但还不是生产云上版本。

已完成:

- 技能接口兼容迭代一: 技能列表、技能详情、标签、境界。
- 案例接口 v1: 案例列表、案例详情、案例与技能弱引用。
- 玩家接口 v1: 创建或更新玩家档案。
- 闯关接口 v1: 手工提交点亮申请，进入 `pending` 状态。
- 管理审核 v1: 管理员审核 `approved/rejected`，通过后写入点亮记录。
- 勋章规则 v1: 首次点亮自动发放“第一盏星灯 / 筑基初成”。
- 个人主页聚合 v1: 返回玩家、成长、勋章、点亮技能、点亮案例、最近闯关流水。
- GaussDB 建表基线: `backend/db/migrations/001_init_gaussdb.sql`。
- 后端测试基线: `backend/test/iteration2-api.test.js`。

当前限制:

- 存储仍是内存 + `backend/data/*.json` 种子数据，服务重启后玩家和点亮流水会丢失。
- GitCode OAuth 还没有真正接入，`POST /api/players` 目前是给本地联调和后续 OAuth callback 复用的领域入口。
- OBS 预签名上传接口还没有实现，当前 `evidence.file_url` 先接收外部文件引用。
- 管理员身份本地用 `x-admin-id` 临时模拟，正式版会换成 GitCode OAuth + RBAC。
- 还没有实际创建华为云 GaussDB / FunctionGraph / APIG / OBS 资源。

## 2. 后端总体规划

后端目标形态:

```text
Frontend SPA
  -> APIG
  -> FunctionGraph HTTP Functions
  -> GaussDB(for openGauss, JSONB)
  -> OBS
  -> Pangu / ModelArts
  -> LTS + CTS + Cloud Eye
```

服务分层:

| 层 | 职责 | 当前状态 | 目标状态 |
|---|---|---|---|
| API 层 | HTTP 路由、鉴权、参数校验、错误格式 | Express 路由 | APIG + FunctionGraph |
| 领域层 | Skill/Case/Player/Quest/Badge/News/Judge 规则 | 集中在 `server.js` | 拆模块，便于函数部署 |
| 数据层 | 持久化查询与事务 | 内存 + JSON | GaussDB Repository |
| 文件层 | 上传截图、日志、头像、作品附件 | 接收 URL | OBS 预签名上传 |
| AI 层 | 技能评估、Doc 生成、资讯摘要、裁判辅助 | 未接 | 盘古大模型 |
| 运维层 | 日志、审计、监控、告警 | 本地测试 | LTS + CTS + Cloud Eye + SMN |

## 3. 华为云能力选择

必须启用 GaussDB。FunctionGraph 只负责计算，不负责持久状态。

| 后端能力 | 华为云服务 | 使用理由 |
|---|---|---|
| 业务 API | FunctionGraph | Serverless、适合 HTTP 函数和定时任务 |
| API 出口 | APIG | 统一域名、CORS、限流、鉴权、MCP 出口 |
| 主业务库 | GaussDB(for openGauss) | 玩家、点亮、勋章、案例、资讯都需要持久化、事务和 JSONB |
| 文件证据 | OBS | 截图、日志、作品附件、头像、封面 |
| 密钥管理 | DEW/CSMS | OAuth secret、数据库密码、模型 API Key |
| AI 能力 | ModelArts / 盘古大模型 | 重要性评分、Doc 生成、资讯摘要、裁判辅助 |
| 审计日志 | CTS + LTS | 管理审核、MCP 点亮、AI 生成可追溯 |
| 监控告警 | Cloud Eye + SMN | 函数失败、爬虫失败、判定服务异常告警 |

## 4. 接口分期规划

### v0.2 当前已暴露接口

| Method | Path | 调用方 | 说明 |
|---|---|---|---|
| GET | `/api/health` | QA / 运维 | 健康检查 |
| GET | `/api/meta/stages` | 前端 | 八境难度映射 |
| GET | `/api/meta/labels` | 前端 / 技能 Agent | 标签字典 |
| GET | `/api/skills` | 前端 / 裁判 Agent | 技能列表 |
| GET | `/api/skills/{slug}` | 前端 / 裁判 Agent | 技能详情与 Doc |
| GET | `/api/cases` | 前端 | 案例列表 |
| GET | `/api/cases/{slug}` | 前端 | 案例详情与技能链 |
| POST | `/api/players` | Auth 回调 / QA | 创建或更新玩家档案 |
| GET | `/api/players/{id}/profile` | 前端 | 个人主页聚合 |
| GET | `/api/quests` | 前端 / 管理端 / QA | 闯关流水查询 |
| POST | `/api/quests/manual` | 前端 | 手工点亮申请 |
| POST | `/api/admin/quests/{id}/review` | 管理端 | 审核点亮申请 |

### v0.3 数据库与上传

| Method | Path | 调用方 | 说明 |
|---|---|---|---|
| POST | `/api/uploads/presign` | 前端 | 获取 OBS 预签名上传 URL |
| GET | `/api/admin/quests` | 管理端 | 待审核申请列表，支持分页筛选 |
| GET | `/api/badges` | 前端 / 管理端 | 勋章定义列表 |
| GET | `/api/players/{id}/quests` | 前端 | 玩家点亮历史 |
| POST | `/api/auth/gitcode/callback` | GitCode OAuth | 登录回调，创建玩家会话 |
| POST | `/api/auth/logout` | 前端 | 退出登录 |
| GET | `/api/me` | 前端 | 当前登录用户 |

### v0.4 管理面

| Method | Path | 调用方 | 说明 |
|---|---|---|---|
| POST | `/api/admin/skills` | 管理端 / 技能 Agent | 创建技能候选 |
| PATCH | `/api/admin/skills/{slug}` | 管理端 | 编辑技能 |
| POST | `/api/admin/skills/{slug}/publish` | 管理端 | 露出技能 |
| POST | `/api/admin/skills/{slug}/archive` | 管理端 | 下架技能 |
| POST | `/api/admin/cases` | 管理端 / 技能 Agent | 创建案例候选 |
| PATCH | `/api/admin/cases/{slug}` | 管理端 | 编辑案例 |
| POST | `/api/admin/cases/{slug}/publish` | 管理端 | 露出案例 |
| POST | `/api/admin/badges` | 管理端 | 创建勋章规则 |
| PATCH | `/api/admin/badges/{key}` | 管理端 | 更新勋章规则 |
| GET | `/api/admin/audit-logs` | 管理端 | 管理操作审计 |

### v0.5 技能 Agent 与资讯

| Method | Path | 调用方 | 说明 |
|---|---|---|---|
| POST | `/api/agent/skill-candidates` | 技能 Agent | 提交技能候选 |
| POST | `/api/agent/case-candidates` | 技能 Agent | 提交案例候选 |
| POST | `/api/agent/news` | 技能 Agent | 写入资讯摘要 |
| GET | `/api/news` | 前端 | 资讯列表 |
| GET | `/api/news/{id}` | 前端 | 资讯详情 |
| POST | `/api/admin/news/{id}/publish` | 管理端 | 发布资讯 |

### v0.6 裁判 Agent 与 MCP

| Method | Path | 调用方 | 说明 |
|---|---|---|---|
| POST | `/api/judge/verify` | MCP Server / 裁判 Agent | 判定技能或案例证据 |
| POST | `/api/quests/mcp` | MCP Server | MCP 自动提交点亮申请 |
| POST | `/api/quests/{id}/auto-review` | 裁判 Agent | 自动审核判定结果 |
| GET | `/api/mcp/player-token` | 前端 | 获取玩家 MCP 接入令牌 |

MCP 工具建议:

- `get_skill_doc(skill_slug)`
- `list_available_quests(player_token)`
- `verify_quest(target_type, target_slug, evidence)`
- `light_up_skill(skill_slug, player_token, judge_result)`
- `light_up_case(case_slug, player_token, judge_result)`

## 5. 数据库规划

已提交 GaussDB 基线表:

- `skill`
- `scenario_case`
- `player_profile`
- `quest_log`
- `badge_def`
- `news`
- `label_dict`
- `difficulty_stage`
- `admin_audit_log`

建模原则:

- 强查询字段用普通列，例如 `slug`、`status`、`difficulty_lv`、`gitcode_id`。
- 富对象用 JSONB，例如 `doc`、`importance`、`category_tags`、`growth`、`badges`、`evidence`、`rule`。
- 点亮以 `quest_log` 为事件流，个人主页由后端聚合。
- 技能、案例、资讯之间使用弱引用 `slug`，降低迭代耦合。

## 6. 开发优先级

1. 把当前 `server.js` 拆成领域模块和 repository 接口，保持测试不变。
2. 接入 GaussDB 本地/云上连接，替换内存 store。
3. 实现 GitCode OAuth callback 与 `GET /api/me`。
4. 实现 OBS 预签名上传，完成手工点亮真实证据链路。
5. 补管理面技能/案例/勋章/资讯 CRUD。
6. 接入技能 Agent 写入候选内容。
7. 接入裁判 Agent 与 MCP 自动点亮。
8. 做 FunctionGraph 部署适配，把 Express handler 拆成可部署函数。

## 7. 华为云操作规则

所有华为云操作必须遵守:

- 只读检查可以先执行，例如查看 region、project、已有实例。
- 创建/修改/删除云资源前，必须列出精确计划并获得用户批准。
- 通过 `huaweicloud/huaweicloud-devkit` 提供的能力或其约定的 KooCLI 命令操作。
- 执行 FunctionGraph / APIG / GaussDB 命令前先查对应 `--help`，不硬猜参数。
- OBS 使用 `hcloud OBS help` 体系，先同步 OBS 配置，不用 API 风格命令乱拼。
- 不读取、不打印 AK/SK、OAuth secret、数据库密码、模型 API Key。

## 8. 当前验收口径

第一稿后端验收命令:

```bash
cd backend
npm test
```

应覆盖:

- 创建玩家档案。
- 迭代一技能列表/详情兼容。
- 提交手工技能点亮并审核通过。
- 自动发放首次点亮勋章。
- 查询个人主页聚合。
- 查询案例并点亮案例。

前端兼容验证:

```bash
cd frontend
npm run build
```

已知风险:

- 前端依赖目前存在 npm audit 提示，暂未强制升级，避免引入破坏性依赖变化。
- 生产持久化尚未接入 GaussDB，当前第一稿只适合本地联调。
