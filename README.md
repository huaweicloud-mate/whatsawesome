# WHATS AWESOME · 仙穹

> **天下技能，皆可入道。** 团队技能养成游戏化平台——AI 时代所有必备技能的修仙世界。

## 项目简介

所有人可以来「仙穹首页」看到最新技能发布，找到自己相关领域的技能；亲手尝试并点亮每项技能；每个人都有自己的专属洞府（个人主页），根据点亮的技能获得定制勋章与 Title。

## 核心对象

| 对象 | 说明 |
|---|---|
| **技能 Skill** | AI 大厂 / 云厂商 / 垂类厂商的能力。含 Doc（最新资讯、官方入口、开源生态、Hello World、灵犀提示词）、标签、难度（拟化 Boss Lv 1–100，对应炼气→神魔八境）、重要性（灵犀 AI 综合评估 10 分制） |
| **案例 Case** | 多技能的场景化组合，可 AI 生成或人工添加，带标签/难度/重要性 |
| **玩家 Player** | 闯关者，攻克技能与案例；有勋章（法印）体系与炼气→神魔成长规则 |

## 目录结构（主目录约定）

```
whatsawesome/
├── ux/          # UI/UX 设计工作区（设计文档 + 高保真原型）
├── docs/        # 产品 / 架构 / 规划文档        （待建）
├── backend/     # 华为云 FunctionGraph 函数等    （迭代一: Node Express API）
├── frontend/    # 玩家端 + 管理端 SPA            （迭代一: Vue3 技能大厅/详情）
├── agents/      # 多 Agent 协作配置 / 提示词     （待建）
└── dev/         # 项目管理与过程交付件（规格/设计/任务清单/标签体系/QA截图）
```

## 技术底座

优先选用华为云能力：GaussDB（含向量检索）、FunctionGraph、OBS、盘古大模型（灵犀 AI 裁判）、CDN。详见 `ux/设计交付文档.md` 第 7 节落地映射。

## 快速预览

- 玩家端原型：`ux/user.html`（玄夜仙穹 · 深色沉浸）
- 管理端原型：`ux/admin.html`（琅嬛玉阁 · 浅色宣纸）
- 设计交付文档：`ux/设计交付文档.md`

---

## 迭代一（当前）· 技能对象技术实现

> 范围锁定：仅「技能」对象——技能数据 + 技能 API + 技能大厅/详情页。登录、管理面、玩家后续迭代开放。

### 在线效果（本地）

| 页面 | 地址 |
|---|---|
| 技能大厅 | http://localhost:5173/ |
| 技能详情 | http://localhost:5173/skills/{slug}（例 `/skills/mcp`） |

### 快速开始

```bash
# 后端（端口 8000）
cd backend && npm install && node server.js

# 前端（端口 5173，代理 /api -> 8000）
cd frontend && npm install && npm run dev
```

### 目录说明

```
backend/                Node Express API（契约对齐后续华为云 FunctionGraph）
├── data/
│   ├── skills.json            14 个真实技能种子（字段对应 GaussDB skill 表）
│   ├── difficulty_stage.json  难度境界映射（炼气→神魔 8 境）
│   └── label_dict.json        标签字典（94 个：80 领域 + 14 厂商）
└── server.js            API 入口
frontend/               Vue3 + Element Plus + Vite
└── src/views/
    ├── SkillHall.vue     技能大厅（搜索 / 境界 / 领域筛选）
    └── SkillDetail.vue   技能详情（Doc / Hello World / 学习提示词复制）
qa-playwright-capture.sh  Edge headless QA 截图脚本
```

### API 契约（后续平滑迁移华为云 FunctionGraph）

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/skills?tag=&min_lv=&max_lv=&q= | 列表（标签/难度/关键字筛选） |
| GET | /api/skills/:slug | 详情（含完整 doc） |
| GET | /api/meta/stages | 难度境界映射 |
| GET | /api/meta/labels | 标签字典 |

**stage 结构**：`{ name, icon, color, desc }`（列表与详情已对齐）

### 迭代路线图

- **迭代 0** ✅ 地基：仓库 / IaC / 数据库 / 鉴权 / QA 基线
- **迭代 1** ✅（当前）技能对象：14 个真实技能 + 大厅 + 详情页
- **迭代 2** 玩家点亮：GitCode OAuth + 手工点亮 + 勋章 v1 + 主页 v1
- **迭代 3** MCP 自动闯关 + 资讯：裁判 Agent + MCP Server + 资讯爬虫
- **迭代 4** AI 强化 + 打磨：盘古全量评估 + 主页炫酷化 + 成长体系

### 技术栈

- 前端：Vue 3 + Vite + Element Plus + Vue Router + Axios
- 后端：Node Express（契约对齐 FunctionGraph，后续一键迁移）
- 数据库（后续）：华为云 GaussDB(for MySQL) + JSON 列，字段已与 seed JSON 一一对应
- AI：华为云盘古大模型 API（V2 OpenAI 兼容）
- MCP：华为云 FunctionGraph 官方 MCP 模板（迭代 3）
- 运维：HuaweiCloud DevKit（KooCLI，北京四 cn-north-4）
