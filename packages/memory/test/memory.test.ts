import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { indexMemory, openDb, searchMemory } from '../src'

const root = mkdtempSync(join(tmpdir(), 'pa-memory-'))

mkdirSync(join(root, 'courses'), { recursive: true })

writeFileSync(
  join(root, 'courses', 'algo.md'),
  `---
title: 算法笔记
tags: [cs]
---

# 动态规划

背包问题与状态转移方程 $dp[i] = \\max(dp[i-1], dp[i-w]+v)$，其中系数为 $\\frac{w_i}{W}$。

# 图论

Dijkstra 最短路算法。
`,
)

writeFileSync(join(root, 'profile.md'), '# 个人资料\n\n姓名：张三\n')

afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('memory index + search', () => {
  it('indexes documents and sections', () => {
    const db = openDb(':memory:')
    const stats = indexMemory(db, root)
    expect(stats.documents).toBe(2)
    expect(stats.sections).toBe(3)
    db.close()
  })

  it('searches Chinese text', () => {
    const db = openDb(':memory:')
    indexMemory(db, root)
    const hits = searchMemory(db, '动态规划')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]?.path).toBe('courses/algo.md')
    db.close()
  })

  it('searches plain latin text', () => {
    const db = openDb(':memory:')
    indexMemory(db, root)
    expect(searchMemory(db, 'Dijkstra').length).toBeGreaterThan(0)
    db.close()
  })

  it('keeps visible operator names but drops structural commands', () => {
    const db = openDb(':memory:')
    indexMemory(db, root)
    // 公式里可见的 token 保留
    expect(searchMemory(db, 'dp').length).toBeGreaterThan(0)
    // \max 渲染为可见文字 "max"，应可检索
    expect(searchMemory(db, 'max').length).toBeGreaterThan(0)
    // \frac 不产生可见文字，不应可检索
    expect(searchMemory(db, 'frac').length).toBe(0)
    db.close()
  })

  it('supports short (<3 chars) queries via LIKE fallback', () => {
    const db = openDb(':memory:')
    indexMemory(db, root)
    expect(searchMemory(db, '张三').length).toBeGreaterThan(0)
    db.close()
  })

  it('is idempotent across rebuilds', () => {
    const db = openDb(':memory:')
    const a = indexMemory(db, root)
    const b = indexMemory(db, root)
    expect(b).toEqual(a)
    db.close()
  })
})
