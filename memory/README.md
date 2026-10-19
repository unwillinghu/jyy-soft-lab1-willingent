# memory/ — 个人数据库（真相源）

这里存放**可读、可改的 Markdown**，是个人数据库的**唯一真相源**。
`data/index.sqlite` 只是由这里**派生**出来的检索索引，随时可删可重建。

## 目录约定

```
memory/
  profile/        个人资料（基本信息、联系方式、学号等）
  courses/        课程、成绩、培养方案
  projects/       项目与作品
  notes/          随手笔记
  people/         联系人与往来
```

## 文件约定

- 每个文件开头用 YAML front matter 声明元数据，便于索引：

  ```markdown
  ---
  title: 数据结构课程笔记
  tags: [course, cs]
  date: 2026-03-01
  ---

  正文……
  ```

- 一个主题一个文件；文件名用英文短横线（如 `data-structures.md`）。
- 正文尽量用标题分段——索引定位到「文件 + 标题」。

## 规则

- **只改这里的内容**，不要手改 SQLite。
- 修改后重新构建索引（P1 提供 `pnpm --filter @pa/memory index`）。
- 检索类回答必须引用到具体文件路径，禁止凭空作答。
