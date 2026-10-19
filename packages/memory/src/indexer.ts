import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { Db } from './db'
import { parseMarkdown } from './markdown'

export interface IndexStats {
  root: string
  documents: number
  sections: number
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage'])

function walk(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, acc)
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      acc.push(full)
    }
  }
  return acc
}

/**
 * 全量重建索引。幂等：先清空派生表，再从 Markdown 重新灌入。
 * 个人规模下全量重建是毫秒级，换来实现简单、永不失同步。
 */
export function indexMemory(db: Db, root: string): IndexStats {
  const files = walk(root, []).sort()

  const insertDoc = db.prepare(
    'INSERT OR REPLACE INTO docs(path, title, tags, date, mtime, hash) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const insertSection = db.prepare(
    'INSERT INTO sections(path, ord, heading, level, content, plain) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const insertFts = db.prepare('INSERT INTO sections_fts(rowid, heading, body) VALUES (?, ?, ?)')

  const run = db.transaction((): IndexStats => {
    db.exec('DELETE FROM sections_fts; DELETE FROM sections; DELETE FROM docs;')

    let sectionCount = 0

    for (const file of files) {
      const raw = readFileSync(file, 'utf8')
      const relPath = relative(root, file).split(sep).join('/')
      const doc = parseMarkdown(relPath, raw)
      const stat = statSync(file)
      const hash = createHash('sha1').update(raw).digest('hex')

      insertDoc.run(
        doc.path,
        doc.title,
        JSON.stringify(doc.tags),
        doc.date,
        Math.floor(stat.mtimeMs),
        hash,
      )

      let ord = 0
      for (const section of doc.sections) {
        const info = insertSection.run(
          doc.path,
          ord,
          section.heading,
          section.level,
          section.content,
          section.plain,
        )
        insertFts.run(info.lastInsertRowid, section.heading, section.plain)
        ord += 1
        sectionCount += 1
      }
    }

    return { root, documents: files.length, sections: sectionCount }
  })

  return run()
}
