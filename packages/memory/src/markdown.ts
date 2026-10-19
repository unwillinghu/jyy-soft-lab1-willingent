import { parse as parseYaml } from 'yaml'
import { toSearchText } from './latex'

/** 一个文档内的段落（由标题切分） */
export interface MemorySection {
  /** 标题文本；前言段为 '' */
  heading: string
  /** 标题层级（#=1…######=6）；前言段为 0 */
  level: number
  /** 原始 Markdown（含 LaTeX，用于展示/引用） */
  content: string
  /** 抹掉公式与标记后的纯文本（用于建索引） */
  plain: string
}

/** 一个 Markdown 文档 */
export interface MemoryDoc {
  /** 相对仓库的 posix 路径 */
  path: string
  title: string
  tags: string[]
  date: string | null
  sections: MemorySection[]
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const HEADING = /^(#{1,6})\s+(.*)$/

function basename(path: string): string {
  const name = path.split('/').pop() ?? path
  return name.replace(/\.md$/i, '')
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v))
  if (typeof value === 'string')
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  return []
}

/** 解析一份 Markdown：front matter + 按标题切段 */
export function parseMarkdown(path: string, raw: string): MemoryDoc {
  let body = raw
  let meta: Record<string, unknown> = {}

  const fm = raw.match(FRONT_MATTER)
  if (fm) {
    body = raw.slice(fm[0].length)
    try {
      const parsed: unknown = parseYaml(fm[1] ?? '')
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        meta = parsed as Record<string, unknown>
      }
    } catch {
      meta = {}
    }
  }

  const lines = body.split(/\r?\n/)
  const sections: MemorySection[] = []

  let heading = ''
  let level = 0
  let buffer: string[] = []
  let firstHeading: string | null = null

  const flush = (): void => {
    const content = buffer.join('\n').trim()
    if (content.length > 0 || heading.length > 0) {
      const plain = toSearchText(`${heading}\n${content}`)
      sections.push({ heading, level, content, plain })
    }
    buffer = []
  }

  for (const line of lines) {
    const m = line.match(HEADING)
    if (m) {
      flush()
      heading = (m[2] ?? '').trim()
      level = (m[1] ?? '#').length
      if (firstHeading === null) firstHeading = heading
    } else {
      buffer.push(line)
    }
  }
  flush()

  const title =
    (typeof meta['title'] === 'string' ? meta['title'] : null) ?? firstHeading ?? basename(path)
  const date = typeof meta['date'] === 'string' ? meta['date'] : null

  return { path, title, tags: toStringArray(meta['tags']), date, sections }
}
