# AGENTS.md — 给 AI Agent 的总规则

> 本文件是本仓库所有 AI Agent（opencode / Claude Code / Codex 等）的行为准则。
> 每次开始工作前先读这里；规则变更请走 Git 提交。

## 项目是什么

「会成长的个人助手」——南京大学《生成式软件工程》Lab1。
核心不是功能堆叠，而是**一个能被不断纠正、并把纠正沉淀成规则的 Agent 系统**。

五项能力：
1. **个人数据库**（memory）：索引/检索个人资料，回答必须能定位到原文
2. **邮箱**（mail）：持续获取 smail 邮件、关联历史、拟草稿，确认后再发
3. **ehall**：办事大厅查询与表单准备，**提交前必须人工确认**
4. **手机端联动**：手机可发起任务/看进度/确认，不依赖桌面端常开窗口
5. **能力组合**：跨工具共享上下文，至少一条可反复使用的完整流程

## 架构（核心 / 通道解耦）

```
channels/  交互适配器（email / bot / pwa，可插拔）
     │ HTTP API (Hono) + Zod 校验
core/      领域服务（与交互方式无关）
     │
memory/*.md (真相源) → data/index.sqlite (派生索引，可重建)
```

- **真相源永远是 Markdown 文件**；SQLite 索引是派生物，必须能随时重建。
- 新增交互方式时，**只加 channel，不改 core**。

## 目录约定

```
apps/core       领域服务 + HTTP API
apps/cli        命令行入口
packages/*      可复用库（shared；后续 memory/mail/ehall/rules）
agent/          opencode 的 agent / skill / command 配置
docs/           文档（含 lab1.md 实验要求存档）
memory/         个人数据库（Markdown 源）
data/           运行时状态（gitignore）
```

## 铁律（必须遵守）

1. **危险操作必须人工确认**：发送邮件、提交表单、退课/撤销等，先展示关键字段与后果，
   得到明确确认后才执行。绝不自行决定不可逆操作。
2. **不重复处理**：已处理的邮件/任务要有幂等标记（如 Message-ID 去重）。
3. **密钥绝不入库**：只提交 `.env.example`；真实凭据放 `.env`（已 gitignore）。
4. **所有外部输入与 Agent 输出都要过 Zod 校验**。
5. **跨平台**：路径一律用 `node:path`，禁止硬编码 `\` 或盘符；脚本用 Node 写，不用 `.sh`/`.ps1`。
6. **回答给出处**：检索类回答必须引用具体文件路径。

## Git 规范（强制）

- 遵循 **Conventional Commits**：`<type>(<scope>): <subject>`
  - type：feat / fix / docs / refactor / test / chore / build / ci / perf / style
  - subject 祈使句、小写、无句号、≤ 72 字符
- **原子提交**：一次只做一件事；每个逻辑单元完成即提交
- 提交信息用**英文**
- 阶段里程碑打 tag：`p0-skeleton` / `p1-memory` / ...
- 已用 husky + lint-staged + commitlint **强制拦截**不合规提交

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动 core（开发）
pnpm build            # 构建全部
pnpm typecheck        # 类型检查
pnpm lint / lint:fix  # 代码检查
pnpm format           # 格式化
```

## 工作方式

- 接到需求先判断属于哪项能力、动 core 还是 channel。
- 改动前先 `git status`，只提交相关文件。
- 沉淀：把「用户纠正」写成 `packages/rules` 里可读可改的规则文件，新会话自动生效。
