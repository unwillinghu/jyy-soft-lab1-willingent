import type { Db } from './db'

export interface DocumentInfo {
  path: string
  title: string
  tags: string[]
  date: string | null
}

interface DocRow {
  path: string
  title: string
  tags: string
  date: string | null
}

/** 列出已索引的文档 */
export function listDocuments(db: Db): DocumentInfo[] {
  const rows = db
    .prepare('SELECT path, title, tags, date FROM docs ORDER BY path')
    .all() as DocRow[]

  return rows.map((r) => ({
    path: r.path,
    title: r.title,
    tags: JSON.parse(r.tags) as string[],
    date: r.date,
  }))
}
