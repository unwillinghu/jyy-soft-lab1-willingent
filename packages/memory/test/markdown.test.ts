import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../src/markdown'

const doc = `---
title: 数据结构笔记
tags: [course, cs]
date: 2026-03-01
---

这是前言。

# 树

二叉树与遍历。

## 公式

平衡因子 $BF = h_L - h_R$。
`

describe('parseMarkdown', () => {
  it('reads front matter', () => {
    const d = parseMarkdown('courses/ds.md', doc)
    expect(d.title).toBe('数据结构笔记')
    expect(d.tags).toEqual(['course', 'cs'])
    expect(d.date).toBe('2026-03-01')
  })

  it('splits sections by heading', () => {
    const d = parseMarkdown('courses/ds.md', doc)
    const headings = d.sections.map((s) => s.heading)
    expect(headings).toContain('树')
    expect(headings).toContain('公式')
  })

  it('keeps raw latex but produces a clean index copy', () => {
    const d = parseMarkdown('courses/ds.md', doc)
    const formula = d.sections.find((s) => s.heading === '公式')
    expect(formula?.content).toContain('$BF = h_L - h_R$')
    expect(formula?.plain).not.toContain('$')
    expect(formula?.plain).toContain('BF')
  })

  it('falls back to first heading, then filename', () => {
    expect(parseMarkdown('notes/a.md', '# Hello\n\nx').title).toBe('Hello')
    expect(parseMarkdown('notes/b.md', 'just text').title).toBe('b')
  })
})
