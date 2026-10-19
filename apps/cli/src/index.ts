import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { APP_NAME, APP_VERSION } from '@pa/shared'
import { indexMemory, listDocuments, openDb, searchMemory } from '@pa/memory'

/** 从当前目录向上找 monorepo 根（含 pnpm-workspace.yaml） */
function findRepoRoot(start: string): string {
  let dir = resolve(start)
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = dirname(dir)
    if (parent === dir) return resolve(start)
    dir = parent
  }
}

interface MemoryPaths {
  dir: string
  dbFile: string
}

function memoryPaths(root: string): MemoryPaths {
  return {
    dir: resolve(root, process.env['PA_MEMORY_DIR'] ?? 'memory'),
    dbFile: resolve(root, process.env['PA_INDEX_DB'] ?? 'data/index.sqlite'),
  }
}

function printHelp(): void {
  console.log(`${APP_NAME} v${APP_VERSION}

用法:
  pa health                      检查 core 服务
  pa memory index                重建个人数据库索引
  pa memory search <关键词>      检索（结果含文件路径）
  pa memory list                 列出已索引文档
`)
}

async function health(): Promise<void> {
  const baseUrl = process.env['PA_BASE_URL'] ?? 'http://127.0.0.1:4310'
  try {
    const res = await fetch(`${baseUrl}/health`)
    console.log(await res.text())
  } catch (err) {
    console.error(`无法连接 core (${baseUrl}): ${(err as Error).message}`)
    process.exitCode = 1
  }
}

function memoryIndex(paths: MemoryPaths): void {
  if (!existsSync(paths.dir)) {
    console.error(`memory 目录不存在: ${paths.dir}`)
    process.exitCode = 1
    return
  }
  const db = openDb(paths.dbFile)
  try {
    const stats = indexMemory(db, paths.dir)
    console.log(`索引完成: ${stats.documents} 篇文档, ${stats.sections} 个段落`)
    console.log(`  源: ${stats.root}`)
    console.log(`  库: ${paths.dbFile}`)
  } finally {
    db.close()
  }
}

function memorySearch(paths: MemoryPaths, query: string, limit: number): void {
  if (query.length === 0) {
    console.error('用法: pa memory search <关键词>')
    process.exitCode = 1
    return
  }
  if (!existsSync(paths.dbFile)) {
    console.error('索引不存在，先运行: pa memory index')
    process.exitCode = 1
    return
  }
  const db = openDb(paths.dbFile)
  try {
    const hits = searchMemory(db, query, { limit })
    if (hits.length === 0) {
      console.log(`未找到与「${query}」相关的内容`)
      return
    }
    console.log(`找到 ${hits.length} 条结果:\n`)
    for (const hit of hits) {
      const loc = hit.heading ? `${hit.path}#${hit.heading}` : hit.path
      console.log(`• ${loc}`)
      if (hit.snippet) console.log(`  ${hit.snippet}`)
    }
  } finally {
    db.close()
  }
}

function memoryList(paths: MemoryPaths): void {
  if (!existsSync(paths.dbFile)) {
    console.error('索引不存在，先运行: pa memory index')
    process.exitCode = 1
    return
  }
  const db = openDb(paths.dbFile)
  try {
    const docs = listDocuments(db)
    if (docs.length === 0) {
      console.log('（索引为空）')
      return
    }
    for (const doc of docs) {
      const tags = doc.tags.length > 0 ? `  [${doc.tags.join(', ')}]` : ''
      console.log(`• ${doc.path} — ${doc.title}${tags}`)
    }
  } finally {
    db.close()
  }
}

function memory(args: string[]): void {
  const [sub, ...rest] = args
  const paths = memoryPaths(findRepoRoot(process.cwd()))

  switch (sub) {
    case 'index':
      memoryIndex(paths)
      return
    case 'list':
      memoryList(paths)
      return
    case 'search': {
      const limitIdx = rest.findIndex((arg) => arg === '--limit')
      let limit = 10
      const words: string[] = []

      for (let i = 0; i < rest.length; i += 1) {
        if (i === limitIdx) {
          const raw = rest[i + 1]
          if (raw !== undefined) limit = Number(raw)
          i += 1
          continue
        }
        const word = rest[i]
        if (word !== undefined) words.push(word)
      }

      memorySearch(paths, words.join(' ').trim(), limit)
      return
    }
    default:
      console.error(`未知子命令: ${sub ?? '(空)'}`)
      printHelp()
      process.exitCode = 1
  }
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv

  switch (command) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      printHelp()
      return
    case 'health':
      await health()
      return
    case 'memory':
      memory(rest)
      return
    default:
      console.error(`未知命令: ${command}`)
      printHelp()
      process.exitCode = 1
  }
}

await main()
