# Whats Awesome 系统设计方案

> 版本: v2.0  |  编制: 高级项目经理  |  日期: 2026-08-13(v2.0: 项目更名 / 数据库定 GaussDB / Agent 拆解定稿)
> 代码仓: https://github.com/huaweicloud-mate/whatsawesome(空仓,全新项目)
> 技术基调: 所有能力优先选用华为云

---

## 1. 整体工作分析与 Agent 拆解

### 1.1 拆解结论(发起人定稿):6 个 Agent

| # | Agent | 职责范围 | 主要交付 | 依赖 |
|---|-------|----------|----------|------|
| 1 | **项目经理 Agent** | 需求与领域模型、API 契约、迭代规划、任务分派、验收组织 | 规格/设计文档、OpenAPI 契约、进度与复盘 | 无(先行) |
| 2 | **前端 Agent** | 用户面(技能大厅/技能 Doc/案例/资讯/个人主页炫酷)+ 管理面后台 | Vue3 + Element Plus 应用 | 后端 API 契约 |
| 3 | **后端 Agent** | 全部领域 API(技能/案例/玩家/点亮/勋章)、鉴权(GitCode OAuth + 双管理员)、GaussDB/OBS 存储 | FunctionGraph 函数集 + APIG 路由 + 数据层 | 无(与前端并行) |
| 4 | **技能 Agent** | 生成和管理最新技能、技能 Doc;资讯爬取与摘要;生成案例(AI) | 内容流水线、盘古大模型集成、定时爬虫 | 后端 API、盘古 API |
| 5 | **裁判 Agent** | 判定某人是否实现了某个技能或案例;开发/维护闯关判定 MCP Server | MCP Server + 判定规则引擎 | 后端点亮 API |
| 6 | **QA Agent** | 测试整个系统:冒烟/功能/链路/MCP 联调/截图/回归/上线验收 | 测试用例、缺陷报告、验收结论 | 各模块 |

**并行节奏**:
- 阶段 0:项目经理 Agent 先行(领域模型 + OpenAPI 契约 + 任务分派)
- 阶段 1:后端 Agent 与前端 Agent 并行(契约先行,前端可 mock)
- 阶段 2:技能 Agent 依赖后端技能 API;裁判 Agent 依赖后端点亮 API
- 全程:QA Agent 边开发边准备用例,每个迭代末执行验收,上线前全量回归

**为什么这样拆**:开发侧(前端/后端)与内容侧(技能/裁判)天然隔离,QA 独立把关;每类 Agent 职责单一,便于持续迭代演进,符合"核心对象解耦"要求。

---

## 2. 系统架构(华为云优先)

### 2.1 总体架构图(文字版)

```
┌─ 用户面(玩家浏览器) ───────────────┐      ┌─ 管理面(管理员 2 人) ──┐
│ Vue3 + Element Plus 前端           │      │ Vue3 管理后台           │
│ (技能大厅/案例/个人主页/资讯)          │      │ (技能审核露出/标签管理)   │
└──────────────┬────────────────────┘      └──────────┬─────────────┘
               │ HTTPS                                │ HTTPS
               ▼                                      ▼
        ┌───────────────────────────────────────────────────┐
        │ 华为云 APIG(API 网关: 域名/限流/鉴权/CORS)          │
        └───────┬───────────────────────┬───────────────────┘
                ▼                       ▼
        ┌─ FunctionGraph 领域函数 ─┐   ┌─ FunctionGraph MCP Server ─┐
        │ skill / case / player   │   │ 闯关判定(裁判 Agent,官方    │
        │ auth / badge / quest    │   │ MCP 模板)SSE + APIG 对外    │
        └───────┬────────┬────────┘   └────────────┬──────────────┘
                ▼        ▼                         ▼
        ┌─ GaussDB(关系表+JSONB) ┐  ┌─ OBS 对象存储 ─┐  ┌─ 盘古大模型 API ─┐
        │ 主库,对象化建模          │  │ 截图/日志/头像 │  │ 重要性评估/生成    │
        └───────────────────────┘  └──────────────┘  └────────┬─────────┘
                ▲                                             │
                └───────── FunctionGraph 定时触发器 ──────────┘
                          (技能 Agent: 每天爬取资讯/技能 → AI 摘要 → 入库)
```

### 2.2 技术栈清单(全部华为云/开源组合)

| 层 | 选型 | 说明 |
|----|------|------|
| 前端 | Vue 3 + Vite + Element Plus | ElementUI 是 Vue2 时代组件库,**Element Plus 是其 Vue3 官方升级版** |
| 前端特效 | CSS 动画 / Canvas / 可选 Three.js | 个人主页炫酷化(勋章流光、境界特效) |
| 后端 | 华为云 FunctionGraph(HTTP 函数,Python 3) | 技能/案例/玩家领域 API,按调用计费、自动弹性 |
| API 网关 | 华为云 APIG(专享版) | 统一域名、鉴权、限流、CORS;承接 MCP SSE 出口 |
| 主数据库 | **华为云 GaussDB**(for openGauss,JSONB 列) | 见 §4 —— 关系型外表 + 对象化内芯,发起人拍板 |
| 对象存储 | 华为云 OBS | 玩家上传的截图/日志、头像、技能封面 |
| AI 能力 | 华为云 ModelArts Studio(盘古大模型) | API Key 认证,V2 OpenAI 兼容 `/api/v2/chat/completions`;重要性评估、资讯摘要、Doc 提示词、案例生成 |
| 定时任务 | FunctionGraph 定时触发器 | 技能 Agent 每天爬取全球技能资讯与发布 |
| 鉴权 | GitCode OAuth 2.0 + 应用内 RBAC | 用户面 GitCode 登录;管理面双管理员白名单 |
| MCP | FunctionGraph 官方 MCP Server 模板 | 裁判 Agent 交付;区域限制:西南-贵阳一 / 华北-北京四 |
| 搜索 | 初版 GaussDB 全文/JSONB 索引 + 标签过滤 | 规模大了再上 CSS(云搜索) |
| DevOps | CodeArts(Pipeline/代码检查) + LTS 日志 + CES 监控 + SMN 告警 | CI/CD、可观测 |

---

## 3. 核心对象解耦设计(领域驱动)

### 3.1 设计原则

1. **每个核心对象一个独立领域模块**(skill / case / player),通过 API 契约交互,不互相 import
2. **事件驱动解耦**: "点亮技能"是一个事件,勋章计算、个人主页更新、成长值累加都订阅该事件,互不阻塞
3. **标签/难度/重要性做成可配置元数据**: 标签字典、难度境界映射、勋章规则全部入库配置,不硬编码
4. **Doc 与技能实体分离**: Doc 是技能的富内容(JSONB 列,可 AI 生成/人工编辑),技能实体只保留结构化字段

### 3.2 领域模型(GaussDB 表设计: 关系表 + JSONB 列)

采用"**结构化列承载强约束字段 + JSONB 列承载富对象/可配置数据**"的双模设计:

```
skill 表
├─ id BIGSERIAL PK
├─ name, slug(UNIQUE)
├─ vendor_name, vendor_type(cloud|ai|devtool), logo_url
├─ category_tags JSONB            # [{key,label}] 可配置标签(GIN 索引)
├─ difficulty_lv INT              # 1..100
├─ importance JSONB               # {score:0-10, basis, evaluated_at}
├─ doc JSONB                      # {summary, official_url, repo_url, ecosystem, hello_world, learning_prompt}
├─ status(draft|published|archived)
├─ related_news JSONB             # [{title,url,date}]
└─ created_at, updated_at

case 表
├─ id, name, slug, scenario_desc
├─ skill_ids JSONB                # [skill_id...] 多技能组合(弱引用)
├─ source(ai_generated|manual)
├─ category_tags JSONB, difficulty_lv INT, importance JSONB
└─ timestamps

player 表
├─ id, gitcode_id(UNIQUE), gitcode_username, avatar_url
├─ role(player|admin)             # 管理面 2 人标记
├─ badges JSONB                   # [{badge_id,name,title,granted_at,icon_url}]
├─ growth JSONB                   # {realm, exp, total_lit}
└─ timestamps

quest_log 表(点亮/闯关流水 - 事件流)
├─ id, player_id, target_type(skill|case), target_id
├─ method(manual_upload|mcp_auto|admin_grant)
├─ evidence JSONB                 # {file_url(OBS), description}
├─ judge_status(pending|approved|rejected), judged_by, judge_note
├─ lit_at
└─ timestamps

news 表
├─ id, title, summary, source_url, published_at
├─ related_skill_id(可选,超链接用)
├─ ai_generated BOOLEAN
└─ timestamps

badge_def 表(勋章定义 - 可配置)
├─ id, name, title, icon_url
├─ rule JSONB                     # {type: vendor_coverage|skill_count|realm, threshold, params}
└─ description

label_dict 表(标签字典 - 可配置)
└─ id, key, label, category

difficulty_stage 表(难度境界映射 - 可配置)
└─ id, stage, min_lv, max_lv, icon(如 1-10 炼气期 … 71-100 神魔期)
```

**关系原则**: 全部 **id 弱引用**(skill_ids 数组、related_skill_id 等),不用强外键约束跨表 —— 技能/案例/玩家独立演进,持续迭代不改动其他表结构;JSONB 列让"标签/勋章/规则/Doc"等可配置富对象**改配置即生效,无需 ALTER 表**。

**关键索引**: category_tags 建 GIN 索引;status + difficulty_lv 建复合索引;slug / gitcode_id 建唯一索引;quest_log(player_id, target_type, target_id) 组合索引。

### 3.3 闯关判定逻辑(裁判 Agent 负责)

| 判定方式 | 说明 | 迭代 | 负责人 |
|----------|------|------|--------|
| 手工判定(首选,第一版) | 玩家上传截图/日志到 OBS → 提交点亮申请 → 管理员(或简单规则)审核 → 点亮 | 迭代 2 | 后端 + 裁判 |
| MCP 自动判定(进阶) | 玩家 Agent 连 MCP Server → 提交"技能名 + 作品/产物" → MCP 内判定(规则 + 可选盘古大模型语义校验)→ 通过则调点亮 API | 迭代 3 | 裁判 Agent |
| 规则判定(可扩展) | 如 AWS 技能点亮数/覆盖率达阈值自动发"通关达人"勋章 | 勋章规则引擎 | 后端 + 裁判 |

> **MCP 判定协议**: 定义工具 `verify_quest(skill_slug, player_token, evidence_url)` 与 `light_up_skill(...)`,玩家 Agent 按 MCP 工具契约调用。判定是否引入 AI 作品质量评估,迭代 3 定义协议时确定。

---

## 4. 数据库选型(GaussDB 落地"对象化"论证)

### 4.1 决策背景

发起人最初期望"正式的面向对象数据库";公有云无成熟 OODBMS 托管服务。经权衡,**发起人拍板采用华为云 GaussDB(关系型)**。本方案给出如何在关系型上无损落地"对象化解耦"的建模方式。

### 4.2 落地方式: "关系型外表 + JSONB 内芯"双模设计

| 数据类型 | 承载方式 | 示例 |
|----------|----------|------|
| 强约束/高频查询字段 | 普通列 | id、slug、status、difficulty_lv、gitcode_id、时间戳 |
| 富对象/嵌套/可配置字段 | JSONB 列(GIN 索引) | doc 富内容、category_tags、badges、growth、rule、evidence、skill_ids |
| 可配置字典 | 独立表 | label_dict、difficulty_stage、badge_def |
| 文件对象 | OBS(独立存储) | 截图/日志/头像/封面 |

### 4.3 为什么 GaussDB + JSONB 同样满足"对象化解耦"

1. **对象即一行 + JSONB**: 技能的 Doc、标签、关联资讯都收进 JSONB,一个技能 = 一行记录 = 一个聚合对象,与领域对象一一映射
2. **持续迭代免 ALTER**: 新增标签类型/勋章字段/成长属性,只改 JSONB 内容,不改表结构 —— 解耦诉求达成
3. **关系型强项保留**: 事务(点亮流水 + 勋章发放原子性)、SQL 生态(报表/联查)、与 CodeArts/监控/备份工具天然集成
4. **JSONB 可查询**: 支持 GIN 索引检索嵌套字段,标签/技能筛选性能可控;规模大再上云搜索 CSS
5. **华为云原生**: openGauss 内核是华为自研,全链路华为云优先

### 4.4 内核选择建议

- **首选 GaussDB(for openGauss)**: JSONB 类型成熟、GIN 索引、函数丰富,更贴合"对象化"诉求
- **备选 GaussDB(for MySQL)**: 若团队更熟 MySQL,其 JSON 类型 + 虚拟列索引也可实现同一建模思路
- 两者建模完全一致(表 + JSONB/JSON 列),切换成本低,不阻塞开发

---

## 5. 迭代规划设计

> 原则: 先跑通技能,再上玩家;先手工点亮,再 MCP 自动化;AI 能力后置强化。每个迭代交付可验收,QA Agent 全程把关。

### 迭代 0 —— 地基(约 1 周,PM/后端/QA)
- [x] 空仓初始化、README、项目结构、CI(CodeArts Pipeline)— **PM Agent**
- [x] 华为云资源 IaC(APIG/GaussDB/OBS/FunctionGraph 骨架)— **后端 Agent**
- [x] GitCode OAuth 接入(用户面登录骨架)— **后端 Agent**
- [x] GaussDB 建表 + 种子数据(label_dict / difficulty_stage)— **后端 Agent**
- [x] QA 基线: 环境就绪 + 冒烟用例 — **QA Agent**
- [ ] **验收**: 能登录、能访问空技能列表 API;CI 绿;QA 冒烟通过

### 迭代 1 —— 技能模块(约 2 周,后端/前端/技能/QA)
- [x] 技能领域 API(CRUD + draft→published→archived 状态机)— **后端 Agent**
- [x] 技能采集与 Doc 初版: AI 采集最新技能候选、生成 Doc 与学习提示词 — **技能 Agent**
- [x] 管理面技能管理后台(审核技能 Agent 候选,决定露出;标签字典管理)— **前端 Agent**
- [x] 用户面技能大厅(卡片/Boss Lv 境界/标签/难度筛选)— **前端 Agent**
- [x] 技能详情 Doc 页(官方入口/开源/Hello World/复制提示词)— **前端 Agent**
- [x] QA: 技能模块功能验收 + 界面截图 — **QA Agent**
- [ ] **验收**: 管理员可审核露出技能;玩家可浏览技能与 Doc;难度按境界显示

### 迭代 2 —— 玩家点亮(约 2 周,后端/前端/裁判/技能/QA)
- [x] 玩家档案(GitCode 登录自动建档;admin 白名单 2 人)— **后端 Agent**
- [x] 手工点亮: 上传截图/日志到 OBS → 提交 → 审核(裁判规则)→ 点亮 — **后端 + 裁判**
- [x] 勋章/Title v1(vendor 覆盖率 / 技能数量两类规则)— **后端 Agent**
- [x] 案例模块 v1(人工添加 + 组合技能;案例内容由技能 Agent 协同)— **后端 + 技能**
- [x] 个人主页 v1(技能墙 + 勋章墙 + 境界)— **前端 Agent**
- [x] QA: 点亮全链路验收(上传→审核→点亮→主页展示)— **QA Agent**
- [ ] **验收**: 玩家能点亮技能并在主页看到技能/勋章;案例可浏览

### 迭代 3 —— MCP 自动闯关 + 资讯(约 2-3 周,裁判/技能/后端/QA)
- [x] 资讯模块: 定时爬虫(每天)+ AI 摘要 + 技能超链接 — **技能 Agent**
- [x] **闯关判定 MCP Server**: FunctionGraph 官方模板 + APIG;`verify_quest` / `light_up_skill` — **裁判 Agent**
- [x] MCP 与点亮 API 打通;玩家 Agent 接入文档 — **裁判 + 后端**
- [x] 案例闯关(点亮案例 = 组合内技能点亮逻辑)— **裁判 + 后端**
- [x] QA: MCP 客户端(Cherry Studio)联调测试 + 资讯验收 — **QA Agent**
- [ ] **验收**: MCP 工具调用可自动点亮;资讯每天更新且关联技能可跳转

### 迭代 4 —— AI 强化 + 打磨(约 2 周,技能/前端/后端/QA)
- [x] 盘古大模型全量: 技能重要性评估(0-10+理由)、Doc 提示词生成、案例 AI 生成 — **技能 Agent**
- [x] 成长体系完整化(炼气→神魔,经验/升级规则)— **后端 Agent**
- [x] 勋章体系丰富 + 个人主页炫酷化(境界背景/勋章流光/Boss 墙)— **前端 Agent**
- [x] 安全加固(管理面二次校验/限流/LTS 审计)+ 性能优化(预留实例)— **后端 Agent**
- [x] QA: 全量回归 + Playwright 截图 + 上线验收 — **QA Agent**
- [ ] **验收**: AI 评估上线;主页效果达标;安全合规检查通过;QA 出验收结论

**总周期约 9-10 周(小团队 1-5 人合理节奏,每迭代结束可演示、可复盘)**

---

## 6. 质量要求与验收标准(QA Agent 把关)

- [ ] 所有华为云资源通过 IaC(Terraform / 华为云 CLI)可复现,不手工点控制台
- [ ] 无后台进程,无服务器启动命令(全部 Serverless,开发环境本地调试函数)
- [ ] 移动端响应式(技能大厅/主页/管理后台)
- [ ] 上传图片/文件统一走 OBS 预签名 URL,不落本地
- [ ] 管理面仅 2 个管理员账号,登录带审计
- [ ] MCP Server 用官方模板,走 APIG 出口,SSE 模式,提供玩家接入文档
- [ ] AI 评估/生成结果入库带来源与时间戳,可追溯
- [ ] 资讯爬取失败不阻塞主流程(降级为空列表 + SMN 告警)
- [ ] Playwright 截图测试覆盖关键页面:技能大厅、技能详情、个人主页、管理后台
- [ ] QA Agent 每迭代输出测试报告,上线前输出验收结论
- [ ] 图片资源: 初版占位图用 Unsplash / picsum(避免外链 403),正式图传 OBS

## 7. 风险与待确认

| # | 风险/待确认 | 影响 | 建议 |
|---|------------|------|------|
| 1 | MCP 判定是否需要"AI 作品质量评估" | 判定复杂度 | 迭代 3 定义协议时确定;先用规则 + 管理员兜底 |
| 2 | 勋章规则引擎复杂度 | 迭代 2 范围 | v1 只做"vendor 覆盖率 + 数量"两类简单规则,复杂规则后置 |
| 3 | GitCode OAuth scope 最小化 | 安全 | 只申请 user 基础 scope,不申请 repo 写权限 |
| 4 | 爬虫合规 | 资讯功能 | 只抓公开资讯页 + 官方源,控制频率,遵守 robots |
| 5 | GaussDB 内核选型(openGauss vs MySQL) | 团队熟悉度 | 默认 openGauss + JSONB;若团队更熟 MySQL 换 GaussDB(for MySQL),建模不变 |
| 6 | FunctionGraph 冷启动 | 体验 | 技能列表等读接口可配预留实例;MCP 用 APIG 缓存 |
| 7 | 区域限制 | MCP 部署 | MCP 固定部署"西南-贵阳一 / 华北-北京四",其他资源同区部署避免跨区调用 |

## 8. 下一步行动

1. 确认本方案 v2.0(尤其 §4 GaussDB 建模、§1 Agent 拆解)
2. 项目经理 Agent 分派 6 个 Agent 的任务(任务清单见 `ai/memory-bank/tasks/whatsawesome-tasklist.md`)
3. 迭代 0 开工: 初始化仓库 + 华为云账号/资源 + IaC + GaussDB 建表
4. 建议在项目资料库建立: 方案文档、API 契约、每周进展同步;将迭代任务创建为事项分配给各 Agent 负责人
