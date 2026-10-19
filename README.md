# personal-assistant

> 会成长的个人助手 — 南京大学《生成式软件工程》Lab1

一个持续为你工作的 Agent 系统：检索个人资料、处理邮件、办理事务、手机联动，
并且**会把你的纠正沉淀成规则**，下次自动做对。

- 实验要求见 [`docs/lab1.md`](docs/lab1.md)
- Agent 行为准则见 [`AGENTS.md`](AGENTS.md)

## 技术栈

TypeScript · Node 20 LTS · pnpm workspaces · Hono · Zod · SQLite(FTS5) · Playwright

## 快速开始

```bash
nvm use            # 对齐 Node 20.16.0
pnpm install
pnpm dev
```

## 目录

```
apps/
  core/            领域服务 + HTTP API
  cli/             命令行入口
packages/
  shared/          公共类型与工具
agent/             Agent / Skill / Command 配置
docs/              文档
memory/            个人数据库（Markdown 源）
data/              运行时状态（gitignore）
```

## 开发命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动 core（开发模式，默认 <http://127.0.0.1:4310>） |
| `pnpm typecheck` | 全部包类型检查 |
| `pnpm lint` / `lint:fix` | 代码检查 / 修复 |
| `pnpm format` | 格式化 |
| `pnpm format:check` | 校验格式 |

## Git 规范

Conventional Commits + 原子提交；husky / lint-staged / commitlint 已强制启用。
