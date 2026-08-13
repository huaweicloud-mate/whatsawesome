# Whats Awesome 标签体系设计(一稿)

> 版本: v0.1(草案,待评审)  |  编制: 项目经理 PM  |  日期: 2026-08-13
> 用途: 技能/案例筛选、技能 Agent 自动打标、勋章规则、玩家主页展示、管理面标签管理
> 数据载体: `backend/data/label_dict.json`(后续迁移 GaussDB `label_dict` 表)

---

## 1. 标签体系设计原则

1. **两个维度,分开管理**: 标签分「领域标签 domain」与「厂商标签 vendor」两类。
   - 领域标签描述"这是什么技术"(可多选,1 个技能 2~4 个)
   - 厂商标签描述"谁发布的"(1 个技能 1 个,与技能表 `vendor_name` 字段同源,便于按厂商筛选与勋章覆盖统计)
2. **分类是固定的,标签是可扩展的**: 一级分类固定 8 类(不再新增),分类下的标签允许管理面自由增/改/停用——避免"分类越长越乱"。
3. **每个标签是"人可读"的**: key 用于系统内部(slug 规范),label 用于界面展示,description 用于管理面解释含义,aliases 用于技能 Agent 自动打标时做匹配。
4. **内置标签受保护**: 系统内置标签 `is_system=true`,管理面不能删(可停用),防止业务数据引用悬空。
5. **克制打标**: 一个技能 2~4 个领域标签,不堆标签;标签宁缺毋滥。

## 2. 编码规范

| 字段 | 规范 | 示例 |
|---|---|---|
| key | 小写英文 + 连字符,唯一,≤ 32 字符 | `ai-agent`、`object-storage` |
| label | 中文显示名,≤ 12 字 | `AI Agent`、`对象存储` |
| category | 固定 8 类之一 | `AI 与智能` |
| type | `domain` / `vendor` | `domain` |
| aliases | 同义词数组(给 AI 打标用) | `["智能体","agent","agentic"]` |
| status | `active` / `disabled` | `active` |
| is_system | 内置受保护 | `true` |
| sort_order | 排序权重 | `10` |

## 3. 一级分类(固定 8 类)

| 分类 | 英文 | 说明 |
|---|---|---|
| 计算与架构 | Compute & Architecture | 计算形态、部署架构、云原生化 |
| 数据与存储 | Data & Storage | 数据存储、处理、分析 |
| AI 与智能 | AI & Intelligence | 大模型、Agent、提示词、AI 工程 |
| 工程与 DevOps | Engineering & DevOps | 研发效能、CI/CD、可观测、测试 |
| 前端与体验 | Frontend & UX | 前端框架、移动端、性能、动效 |
| 安全与合规 | Security & Compliance | 身份、加密、合规、DevSecOps |
| 网络与边缘 | Network & Edge | 网络、CDN、网关、边缘 |
| 开发工具与协作 | DevTools & Collaboration | IDE、协作、文档、开源 |

## 4. 领域标签全集(domain)

### 4.1 计算与架构(10)
| key | label | 说明 |
|---|---|---|
| serverless | 无服务器 | Serverless 计算形态 |
| faas | 函数计算 | FaaS 平台与函数开发 |
| container | 容器 | 容器化、镜像、Compose |
| kubernetes | K8s 编排 | Kubernetes 编排调度 |
| microservice | 微服务 | 微服务架构与治理 |
| message-queue | 消息队列 | 异步消息与事件流 |
| event-driven | 事件驱动 | 事件驱动架构 |
| edge-computing | 边缘计算 | 边缘节点计算 |
| iac | 基础设施即代码 | IaC、资源编排 |
| cloud-native | 云原生 | 云原生综合能力 |

### 4.2 数据与存储(10)
| key | label | 说明 |
|---|---|---|
| database | 数据库 | 数据库通用 |
| relational-db | 关系型数据库 | SQL/事务/JSON 列 |
| nosql | NoSQL | 文档/键值/宽表 |
| object-storage | 对象存储 | 文件/对象存储 |
| data-warehouse | 数据仓库 | 数仓与 OLAP |
| bigdata | 大数据 | 大数据处理生态 |
| cache | 缓存 | 缓存与加速 |
| search | 搜索 | 全文/向量检索 |
| etl | 数据集成 | ETL/管道/同步 |
| data-analysis | 数据分析 | 分析/BI/可视化 |

### 4.3 AI 与智能(12)
| key | label | 说明 |
|---|---|---|
| llm | 大模型 | 大语言模型基础 |
| ai-api | AI API | 模型推理 API |
| ai-agent | AI Agent | 智能体开发 |
| mcp | MCP 协议 | 模型上下文协议 |
| prompt-engineering | 提示词工程 | 提示词设计 |
| rag | RAG 检索增强 | 检索增强生成 |
| fine-tuning | 模型微调 | 微调与对齐 |
| ai-coding | AI 编程 | AI 辅助编码 |
| multimodal | 多模态 | 文/图/音/视频 |
| vector-db | 向量数据库 | 向量检索存储 |
| mlops | MLOps | 模型工程化 |
| computer-vision | 计算机视觉 | CV 应用 |

### 4.4 工程与 DevOps(11)
| key | label | 说明 |
|---|---|---|
| devops | DevOps | DevOps 综合 |
| cicd | CI/CD | 持续集成交付 |
| git | 代码托管 | Git 与托管平台 |
| observability | 可观测性 | 监控/日志/链路 |
| monitoring | 监控告警 | 指标与告警 |
| logging | 日志管理 | 日志采集分析 |
| testing | 测试 | 自动化测试 |
| api-testing | API 测试 | 接口测试 |
| security-scan | 安全扫描 | 漏洞扫描 |
| release | 发布管理 | 版本发布 |
| iam | 访问控制 | IAM/权限管理 |

### 4.5 前端与体验(10)
| key | label | 说明 |
|---|---|---|
| frontend | 前端开发 | 前端通用 |
| ui-framework | UI 框架 | 组件/UI 框架 |
| web-framework | Web 框架 | Web 应用框架 |
| mobile | 移动端 | 移动开发 |
| performance | 性能优化 | 前端性能 |
| animation | 动效 | 动画与特效 |
| design-system | 设计系统 | 设计规范 |
| cross-platform | 跨平台 | 跨端方案 |
| ssg | 静态站点 | 静态生成 |
| server-render | 服务端渲染 | SSR/SSG |

### 4.6 安全与合规(8)
| key | label | 说明 |
|---|---|---|
| security | 安全 | 安全综合 |
| identity | 身份认证 | 登录/SSO/OAuth |
| authn-authz | 认证授权 | 鉴权与授权 |
| encryption | 加密 | 数据加密 |
| compliance | 合规 | 合规治理 |
| devsecops | DevSecOps | 安全左移 |
| secret-management | 密钥管理 | 凭据管理 |
| waf | Web 防火墙 | WAF/防护 |

### 4.7 网络与边缘(8)
| key | label | 说明 |
|---|---|---|
| networking | 网络 | 网络基础 |
| cdn | CDN | 内容分发 |
| load-balance | 负载均衡 | 流量分发 |
| dns | DNS | 域名解析 |
| vpc | 私有网络 | VPC/子网 |
| api-gateway | API 网关 | 网关/限流/鉴权 |
| domain | 域名 | 域名与证书 |
| websocket | 实时通信 | WebSocket/长连接 |

### 4.8 开发工具与协作(10)
| key | label | 说明 |
|---|---|---|
| ide | 开发工具 | IDE/编辑器 |
| ai-tool | AI 工具 | AI 生产力工具 |
| lowcode | 低代码 | 低代码平台 |
| collaboration | 协作 | 团队协作 |
| docs | 文档 | 文档工具 |
| api-design | API 设计 | API 设计 |
| openapi | OpenAPI | OpenAPI 规范 |
| sdk | SDK | SDK 与客户端库 |
| open-source | 开源 | 开源生态 |
| code-review | 代码评审 | 评审与合并 |

> 领域标签小计: **79 个**(10+10+12+11+10+8+8+10)

## 5. 厂商标签全集(vendor,可继续扩)

| key | label | 说明 |
|---|---|---|
| huaweicloud | 华为云 | 华为云全系 |
| aws | AWS | 亚马逊云 |
| azure | 微软 Azure | 微软云 |
| google-cloud | Google Cloud | 谷歌云 |
| aliyun | 阿里云 | 阿里云 |
| tencent-cloud | 腾讯云 | 腾讯云 |
| vercel | Vercel | 前端托管平台 |
| github | GitHub | 代码托管 |
| gitcode | GitCode | 代码托管/开放平台 |
| docker | Docker | 容器公司 |
| anthropic | Anthropic | Claude/MCP 发起方 |
| openai | OpenAI | GPT 系列 |
| langchain | LangChain | LLM 框架 |
| cncf | CNCF | 云原生基金会 |

> 厂商标签小计: **14 个**(按需扩)

## 6. 打标规则(技能 Agent 与人工共同维护)

1. **领域标签**: 每个技能 2~4 个;首标签 = 主领域,其余为辅助标签
2. **厂商标签**: 1 个,与 `vendor_name` 字段一致(后端可自动关联,也可手动微调)
3. **打标流程**: 技能 Agent 采集/生成技能时,根据 aliases 与内容**自动建议标签** → 管理面审核确认 → 露出
4. **标签变更**: 管理面停用/合并标签时,给出影响范围提示(涉及 N 个技能),确认后批量替换
5. **勋章联动**: 勋章规则可引用标签,如 `vendor=aws 覆盖率 ≥ 80% → AWS 通关达人`;`domain=ai-agent 点亮 ≥ 5 → AI Agent 猎手`

## 7. 管理面「标签管理」页面设计(迭代四落地,先定结构)

| 模块 | 能力 |
|---|---|
| 标签列表 | 按分类/类型/状态筛选,搜索,排序 |
| 新增/编辑 | key、label、分类、类型、别名、说明、排序;key 创建后不可改(引用安全) |
| 停用/启用 | 停用需确认(该标签关联 N 个技能),停用后新打标不可用,历史数据保留 |
| 合并标签 | 把 A 合并进 B,自动重写技能引用 |
| 统计 | 每个标签关联技能数、点亮数(供管理决策) |
| 内置保护 | `is_system=true` 的标签仅可停用,不可删除/改名 |

## 8. 与当前数据的映射(迭代一 14 个技能)

现有 15 个标签已全部并入新体系,无冲突;14 个技能将按新规则补全为 2~4 个领域标签 + 1 个厂商标签(如:华为云 FunctionGraph → `serverless, faas, cloud-native` + vendor `huaweicloud`)。

## 9. 待你确认的点

1. **分类数量**: 8 个一级分类是否合适?需要合并/拆分?
2. **标签密度**: 79 个领域标签是否偏多?可砍掉不常用的(如保留 50 个核心集)
3. **厂商标签**: 是否独立成维度(推荐),还是并入领域标签统一筛选?
4. **命名**: 分类名/标签名是否有团队习惯要统一(中英混排?)
