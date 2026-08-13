# Whats Awesome Development Tasks

> 依据: `ai/memory-bank/site-setup.md` + `docs/whatsawesome-design.md`(v2.0)
> 技术栈: Vue3 + Element Plus / 华为云 FunctionGraph + APIG + GaussDB(JSONB) + OBS + 盘古大模型 + GitCode OAuth + FunctionGraph MCP 官方模板
> Agent 分工: PM(项目经理) / FE(前端) / BE(后端) / Skill(技能) / Judge(裁判) / QA
> 目标周期: 约 9-10 周(迭代 0-4)

---

## 迭代 0: 地基(约 1 周)

### [ ] Task 0.1: 初始化代码仓与项目结构
**Owner(Agent)**: 项目经理 PM
**Description**: 初始化 whatsawesome 仓库(空仓),建立多目录结构(frontend / backend / mcp-server / infra),写 README 与贡献指南
**Acceptance Criteria**:
- 仓库结构清晰,frontend/backend/mcp-server/infra 分目录
- README 说明项目定位与快速开始
- CI(CodeArts Pipeline)绿

**Files to Create**: README.md、frontend/、backend/、mcp-server/、infra/
**Reference**: 设计方案 §2

### [ ] Task 0.2: 华为云资源 IaC 骨架
**Owner(Agent)**: 后端 BE
**Description**: 用 Terraform/华为云 CLI 定义 APIG(专享)、GaussDB(openGauss 实例)、OBS 桶、FunctionGraph 函数骨架,全部资源同区部署
**Acceptance Criteria**:
- `terraform plan/apply` 可复现全部资源
- 不手工点控制台
- 资源清单与计费预估写入 README

**Files to Create**: infra/terraform/*.tf、infra/README.md
**Reference**: 设计方案 §2.2、§6

### [ ] Task 0.3: GitCode OAuth 用户面登录骨架
**Owner(Agent)**: 后端 BE
**Description**: 注册 GitCode OAuth 应用,实现 authorize → code → token → /api/v5/user 全流程,scope 最小化(user 基础信息)
**Acceptance Criteria**:
- 浏览器可跳 GitCode 授权并回跳拿到用户信息
- state 参数防 CSRF
- 登录态(短 token)存服务端会话,不存 localStorage 明文

**Files to Create**: backend/auth、frontend/login
**Reference**: 规格 §3.1、设计方案 §2.2

### [ ] Task 0.4: GaussDB 建表 + 种子数据
**Owner(Agent)**: 后端 BE
**Description**: 按领域模型建表(关系列 + JSONB 列),创建 skill/case/player/quest_log/news/badge_def/label_dict/difficulty_stage;写入标签与境界映射种子数据;GIN/唯一/复合索引
**Acceptance Criteria**:
- 所有表结构与 §3.2 一致,JSONB 列承载富对象
- 索引合理(slug/gitcode_id 唯一、category_tags GIN、quest_log 组合)
- 种子数据可被管理面读取;迁移脚本幂等可重复执行

**Files to Create**: backend/db/migrations、backend/db/seed
**Reference**: 设计方案 §3.2、§4

### [ ] Task 0.5: QA 基线(环境 + 冒烟用例)
**Owner(Agent)**: QA
**Description**: 建立 QA 环境与冒烟用例集(登录、健康检查、空技能列表),配置 Playwright 截图脚本
**Acceptance Criteria**:
- 冒烟用例可在 CI 跑通
- Playwright 截图脚本可运行: `./qa-playwright-capture.sh http://localhost:8000 public/qa-screenshots`

**Files to Create**: qa/**、qa/qa-playwright-capture.sh
**Reference**: 设计方案 §6

---

## 迭代 1: 技能模块(约 2 周)

### [ ] Task 1.1: 技能领域 API(CRUD + 状态机)
**Owner(Agent)**: 后端 BE
**Description**: skill 领域函数集:draft→published→archived 状态机;管理面写接口 + 用户面只读接口
**Acceptance Criteria**:
- 管理面可创建/编辑/上下架技能
- 用户面只能看到 published
- API 契约(OpenAPI)与前端约定一致

**Files to Create**: backend/functions/skill/*
**Reference**: 设计方案 §3.2

### [ ] Task 1.2: 技能采集与 Doc 初版
**Owner(Agent)**: 技能 Skill
**Description**: AI 采集最新技能候选(官方源),生成技能 Doc 与学习提示词(盘古大模型);候选入库待管理面审核露出
**Acceptance Criteria**:
- 每天定时采集技能候选,带来源/时间戳
- 生成 Doc 的 summary/official_url/repo_url/hello_world/learning_prompt
- 结果入库为 draft,管理面可见

**Files to Create**: backend/functions/skill-crawler/*、ai/*(盘古调用)
**Reference**: 规格 §2.1(Doc)、§3.3

### [ ] Task 1.3: 管理面技能管理后台
**Owner(Agent)**: 前端 FE
**Description**: 管理后台:展示技能 Agent 采集的候选列表,审核"露出"为 published;标签字典管理
**Acceptance Criteria**:
- 双管理员可登录(白名单)
- 技能候选可审核露出/驳回
- 标签可增改(改后技能列表即时生效)

**Files to Create**: admin/** (Vue3 + Element Plus)
**Reference**: 规格 §3.3、设计方案 §3.1

### [ ] Task 1.4: 技能大厅(用户面)
**Owner(Agent)**: 前端 FE
**Description**: 技能列表页:卡片展示(厂商 logo、名称、标签、Boss Lv 境界、重要性分)、标签筛选、难度筛选
**Acceptance Criteria**:
- 移动端响应式
- 标签/难度筛选可用
- Boss Lv 按境界(炼气~神魔)展示对应样式

**Files to Create**: frontend/src/views/SkillHall.vue、components/*
**Reference**: 规格 §2.1、设计方案 §3.2

### [ ] Task 1.5: 技能详情 Doc 页
**Owner(Agent)**: 前端 FE
**Description**: 展示技能 Doc:最新资讯、官方入口、开源地址、开源生态、Hello World、学习提示词(可复制)
**Acceptance Criteria**:
- 所有 Doc 字段完整展示
- "复制提示词"按钮可用
- 关联资讯(若有)超链接跳转

**Files to Create**: frontend/src/views/SkillDetail.vue
**Reference**: 规格 §2.1(技能 Doc 属性)

### [ ] Task 1.6: QA 技能模块验收
**Owner(Agent)**: QA
**Description**: 技能模块功能测试(审核露出/大厅筛选/详情 Doc),界面截图
**Acceptance Criteria**:
- 功能用例通过(管理面露出 → 用户面可见)
- Playwright 截图覆盖技能大厅/详情
- 输出测试报告与缺陷清单

**Reference**: 设计方案 §6

---

## 迭代 2: 玩家点亮(约 2 周)

### [ ] Task 2.1: 玩家档案
**Owner(Agent)**: 后端 BE
**Description**: GitCode 登录后自动建档(role=player);管理面 2 人标记 role=admin
**Acceptance Criteria**:
- 首登自动创建 player 档案并同步 GitCode 头像/用户名
- admin 白名单(2 人)生效

**Files to Create**: backend/functions/player/*
**Reference**: 规格 §2.3

### [ ] Task 2.2: 手工点亮(截图/日志上传 + 审核)
**Owner(Agent)**: 后端 BE(判定规则协同裁判 Judge)
**Description**: 玩家上传截图/日志到 OBS(预签名 URL),提交点亮申请 → 按裁判规则审核(pending/approved/rejected)→ 点亮写入 quest_log 并更新 player
**Acceptance Criteria**:
- OBS 预签名上传可用,文件不落本地
- 申请→审核全流程闭环
- 点亮后技能出现在玩家技能墙

**Files to Create**: backend/functions/quest/*、OBS 集成、判定规则模块
**Reference**: 规格 §3.5、设计方案 §3.3

### [ ] Task 2.3: 勋章/Title v1 + 发放规则
**Owner(Agent)**: 后端 BE
**Description**: badge_def 定义 + 规则引擎 v1(vendor 覆盖率 / 技能数量两类):如点亮某厂商 80% 技能 → "XX 通关达人" 勋章 + Title
**Acceptance Criteria**:
- 规则配置化(改 badge_def 即生效)
- 点亮事件触发勋章计算,达标自动发放
- 勋章含 icon 与 title 文案

**Files to Create**: backend/functions/badge/*
**Reference**: 规格 §2.3(勋章)、设计方案 §3.2

### [ ] Task 2.4: 案例模块 v1(人工)
**Owner(Agent)**: 后端 BE(案例内容协同技能 Skill)
**Description**: 案例实体:人工添加、组合技能(skill_ids 弱引用)、标签/难度/重要性;案例浏览页
**Acceptance Criteria**:
- 管理面可添加案例并选择组合技能
- 用户面可浏览案例列表与详情

**Files to Create**: backend/functions/case/*、frontend CaseHall.vue / CaseDetail.vue
**Reference**: 规格 §2.2

### [ ] Task 2.5: 个人主页 v1
**Owner(Agent)**: 前端 FE
**Description**: 展示点亮的技能墙、勋章墙、当前境界;基础动效(卡片 hover、勋章流光初版)
**Acceptance Criteria**:
- 技能墙/勋章墙按点亮记录渲染
- 境界按成长值展示
- 移动端可用

**Files to Create**: frontend/src/views/Profile.vue
**Reference**: 规格 §3.6、设计方案 §3.2

### [ ] Task 2.6: QA 点亮链路验收
**Owner(Agent)**: QA
**Description**: 点亮全链路测试:上传→审核→点亮→勋章发放→主页展示
**Acceptance Criteria**:
- 全链路用例通过
- 勋章规则触发验证(构造覆盖 80% 场景)
- 输出测试报告与缺陷清单

**Reference**: 设计方案 §6

---

## 迭代 3: MCP 自动闯关 + 资讯(约 2-3 周)

### [ ] Task 3.1: 资讯模块(爬虫 + AI 摘要)
**Owner(Agent)**: 技能 Skill
**Description**: FunctionGraph 定时触发器,每天爬取全球技能趋势/发布(官方源),盘古大模型生成摘要;关联技能给超链接;失败降级 + SMN 告警
**Acceptance Criteria**:
- 每日定时执行,资讯入库带来源/时间戳
- 资讯列表页 + 技能超链接跳转
- 爬取失败不阻塞主流程,触发告警

**Files to Create**: backend/functions/crawler/*、frontend News.vue
**Reference**: 规格 §3.4

### [ ] Task 3.2: 闯关判定 MCP Server
**Owner(Agent)**: 裁判 Judge
**Description**: 基于 FunctionGraph 官方 MCP 模板部署 MCP Server(APIG + SSE),定义工具:verify_quest(skill_slug, evidence)、light_up_skill(...);打通点亮 API
**Acceptance Criteria**:
- 用 MCP 客户端(Cherry Studio)可连上并调用工具
- 调用 light_up_skill 成功 → quest_log 新增 lit 记录 → 玩家技能墙更新
- 提供玩家接入文档(如何配 Agent 连 MCP)

**Files to Create**: mcp-server/**、docs/mcp-integration.md
**Reference**: 规格 §3.5、设计方案 §2.2/§3.3(区域: 西南-贵阳一/华北-北京四)

### [ ] Task 3.3: 案例闯关(MCP 扩展)
**Owner(Agent)**: 裁判 Judge(协同后端 BE)
**Description**: 点亮案例 = 组合内技能点亮逻辑;案例点亮写入 quest_log(target_type=case)
**Acceptance Criteria**:
- 玩家可对案例提交点亮(手工 + MCP 均可)
- 案例点亮反映在个人主页

**Files to Create**: mcp-server 工具扩展、backend/functions/quest/*
**Reference**: 规格 §2.2、设计方案 §3.2

### [ ] Task 3.4: QA MCP 联调 + 资讯验收
**Owner(Agent)**: QA
**Description**: MCP 客户端联调测试(verify_quest/light_up_skill 全流程)、资讯模块验收
**Acceptance Criteria**:
- MCP 工具调用全流程通过,点亮落地
- 资讯每日更新,关联技能跳转可用
- 输出测试报告与缺陷清单

**Reference**: 设计方案 §6

---

## 迭代 4: AI 强化 + 打磨(约 2 周)

### [ ] Task 4.1: AI 重要性评估全量
**Owner(Agent)**: 技能 Skill
**Description**: 盘古大模型对每个技能做重要性评估(0-10 + 理由),结果带来源与时间戳入库
**Acceptance Criteria**:
- 全部 published 技能有 importance.score 与 basis
- 可重算(记录 evaluated_at)

**Files to Create**: backend/functions/ai/*、管理面展示
**Reference**: 规格 §2.1(重要性属性)

### [ ] Task 4.2: AI 生成 Doc 提示词与案例
**Owner(Agent)**: 技能 Skill
**Description**: AI 生成技能 Doc 学习提示词;AI 生成场景案例(组合技能)
**Acceptance Criteria**:
- 技能 Doc 提示词可一键生成后人工编辑
- AI 案例进入候选,管理面审核后露出

**Files to Create**: backend/functions/ai/generate_*
**Reference**: 规格 §2.1/§2.2

### [ ] Task 4.3: 成长体系 + 主页炫酷化
**Owner(Agent)**: 前端 FE(成长规则协同后端 BE)
**Description**: 炼气→神魔完整成长规则(经验/升级);个人主页特效:境界背景、勋章流光、技能 Boss 墙
**Acceptance Criteria**:
- 成长经验规则生效并展示进度
- 主页视觉达到"极其炫酷"验收
- 动效不拖慢加载

**Files to Create**: frontend Profile 强化、badge/成长规则扩展
**Reference**: 规格 §2.3、§3.6

### [ ] Task 4.4: 安全加固 + 性能
**Owner(Agent)**: 后端 BE
**Description**: 管理面二次校验、限流、LTS 审计;读接口预留实例降冷启动
**Acceptance Criteria**:
- 管理面操作有审计日志
- APIG 限流策略生效
- 读接口冷启动优化生效(预留实例)

**Files to Create**: backend 安全/性能配置、infra 调整
**Reference**: 设计方案 §6

### [ ] Task 4.5: QA 全量回归 + 上线验收
**Owner(Agent)**: QA
**Description**: 全量回归测试 + Playwright 截图覆盖关键页 + 上线验收结论
**Acceptance Criteria**:
- 回归通过:登录/技能/点亮/MCP/资讯/主页/管理后台
- Playwright 截图测试通过:技能大厅/详情/个人主页/管理后台
- 输出上线验收报告与遗留问题清单

**Commands**: `./qa-playwright-capture.sh http://localhost:8000 public/qa-screenshots`
**Reference**: 设计方案 §6

---

## Quality Requirements(全迭代,QA 把关)
- [ ] 所有 FluxUI 组件使用受支持 props(若使用)
- [ ] 无后台进程,无服务器启动命令(全部 Serverless)
- [ ] 移动端响应式
- [ ] 表单功能必须可用(上传/审核/登录)
- [ ] 图片占位用 Unsplash/picsum,正式图走 OBS(不用 Pexels)
- [ ] 华为云资源全部 IaC 化
- [ ] 每个迭代 QA 输出测试报告,上线前出验收结论

## Technical Notes
**Development Stack**: Vue3 + Element Plus / FunctionGraph(Python3) + APIG / GaussDB(openGauss,JSONB) / OBS / 盘古大模型(ModelArts Studio) / GitCode OAuth / FunctionGraph MCP 官方模板 / Terraform
**Special Instructions**: 所有能力优先华为云;数据库定 GaussDB(默认 openGauss+JSONB,备选 GaussDB for MySQL);MCP 固定部署"西南-贵阳一 / 华北-北京四";管理面仅 2 个管理员
**Timeline Expectations**: 迭代 0-4 共约 9-10 周,每迭代结束可演示、可复盘
