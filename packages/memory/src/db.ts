import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'

/** better-sqlite3 数据库实例类型 */
export type Db = InstanceType<typeof Database>

/**
 * 索引结构。
 * 注意：`sections` 是**派生数据**，随时可整库重建；真相源始终是 memory/*.md。
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS docs (
  path  TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags  TEXT NOT NULL,
  date  TEXT,
  mtime INTEGER NOT NULL,
  hash  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id      INTEGER PRIMARY KEY,
  path    TEXT NOT NULL,
  ord     INTEGER NOT NULL,
  heading TEXT NOT NULL,
  level   INTEGER NOT NULL,
  content TEXT NOT NULL,
  plain   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sections_path ON sections(path);

-- trigram 分词器：对中文/子串检索有效（要求查询 >= 3 字符）
CREATE VIRTUAL TABLE IF NOT EXISTS sections_fts USING fts5(
  heading,
  body,
  tokenize = 'trigram'
);
`

/** 打开（或创建）索引库 */
export function openDb(file: string): Db {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.exec(SCHEMA)
  return db
}
