import type { Db } from './db'

export interface SearchResult {
  /** 相对路径，回答时必须引用 */
  path: string
  heading: string
  level: number
  /** 命中片段（原文，可能含 LaTeX） */
  snippet: string
  score: number
}

export interface SearchOptions {
  limit?: number
}

interface FtsRow {
  path: string
  heading: string
  level: number
  snip: string
  score: number
}

interface LikeRow {
  path: string
  heading: string
  level: number
  snip: string
}

function excerpt(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`
}

/**
 * 检索。>= 3 字符走 FTS5（trigram，支持中文与子串）；更短的查询退化为 LIKE。
 */
export function searchMemory(db: Db, query: string, options: SearchOptions = {}): SearchResult[] {
  const q = query.trim()
  const limit = options.limit ?? 10
  if (q.length === 0) return []

  if (q.length >= 3) {
    const phrase = `"${q.replace(/"/g, '""')}"`
    const rows = db
      .prepare(
        `SELECT s.path AS path,
                s.heading AS heading,
                s.level AS level,
                snippet(sections_fts, 1, '', '', '…', 14) AS snip,
                bm25(sections_fts) AS score
         FROM sections_fts
         JOIN sections s ON s.id = sections_fts.rowid
         WHERE sections_fts MATCH ?
         ORDER BY score
         LIMIT ?`,
      )
      .all(phrase, limit) as FtsRow[]

    return rows.map((r) => ({
      path: r.path,
      heading: r.heading,
      level: r.level,
      snippet: r.snip,
      score: r.score,
    }))
  }

  const like = `%${q}%`
  const rows = db
    .prepare(
      `SELECT path, heading, level, content AS snip
       FROM sections
       WHERE plain LIKE ? OR heading LIKE ?
       ORDER BY path, ord
       LIMIT ?`,
    )
    .all(like, like, limit) as LikeRow[]

  return rows.map((r) => ({
    path: r.path,
    heading: r.heading,
    level: r.level,
    snippet: excerpt(r.snip),
    score: 0,
  }))
}
