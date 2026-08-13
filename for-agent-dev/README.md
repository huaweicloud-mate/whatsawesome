# Whats Awesome · for-agent-dev（Agent 协作交付件区）

> 本目录是**面向所有参与 Agent** 的协作交付件区：需求、设计、任务、标签、UX 设计。
> 任何 Agent（项目经理 / 前端 / 后端 / 技能 / 裁判 / QA）接入项目时，从这里了解全局。
> 业务代码在仓库根（frontend/ backend/）。品牌世界观: **仙穹** —— 天下技能，皆可入道。

## 交付件索引

| 文件 | 内容 | 状态 |
|---|---|---|
| `01-site-setup.md` | 项目规格（核心对象/功能/决策/外部依赖确认） | ✅ v2 |
| `02-system-design.md` | 系统设计方案 v2.0（Agent 拆解/华为云架构/GaussDB 建模/迭代规划） | ✅ v2.0 |
| `03-development-tasklist.md` | 开发任务清单（迭代 0-4，按 6 Agent 归属，22 项） | ✅ |
| `04-tag-taxonomy.md` | 标签体系设计一稿（80 领域 + 14 厂商 = 94 标签） | ⏳ 待评审 |
| `05-backend-api-openapi.yaml` | 后端对外接口标准文档（OpenAPI 3.0，覆盖技能/案例/玩家/点亮/审核/主页） | ✅ v0.2 |
| `AGENT_DEVELOPER_README.md` | 新 Agent 开发接入手册（当前代码现状 / 分工 / 对象边界 / 交付标准） | ✅ v0.1 |
| `ux/` | UX 设计工作区（高保真原型 + 设计交付文档，最新版） | ✅ |

## 关键决策记录（2026-08-13）

1. **项目名称**: Whats Awesome（原名 Whats New）
2. **数据库**: 华为云 GaussDB(for openGauss) + JSONB 列（对象化建模，"关系表 + JSONB 内芯"）
3. **Agent 拆解定稿(6)**: 项目经理 / 前端 / 后端 / 技能 / 裁判 / QA
4. **资源**: 全部北京四 cn-north-4，运维走 HuaweiCloud DevKit(KooCLI)
5. **迭代策略**: 迭代一仅技能对象(已交付)→ 迭代二手工点亮 → 迭代三 MCP 自动闯关

## UX 设计（最新）

见 `ux/README.md` 与 `ux/设计交付文档.md`；原型文件：
- 玩家端：`ux/user.html`（玄夜仙穹 · 深色沉浸）
- 管理端：`ux/admin.html`（琅嬛玉阁 · 浅色宣纸）

## 交付节奏

- 每迭代结束: 更新本目录交付件 + 复盘
- 文档命名: 序号-类别，保持历史可追溯
- Agent 接入指引: 新 Agent 先读 `AGENT_DEVELOPER_README.md`（怎么接入）→ 01（是什么）→ 02（怎么建）→ 03（做什么）→ ux（长什么样）
