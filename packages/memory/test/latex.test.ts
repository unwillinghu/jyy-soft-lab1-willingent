import { describe, expect, it } from 'vitest'
import { hasLatex, latexToPlain, toSearchText } from '../src/latex'

describe('latexToPlain', () => {
  it('drops structural commands, keeps visible words', () => {
    expect(latexToPlain('\\frac{a}{b}')).toBe('a b')
    expect(latexToPlain('\\alpha + \\beta')).toBe('+')
  })

  it('keeps operator names that render as text', () => {
    expect(latexToPlain('\\log n')).toBe('log n')
    expect(latexToPlain('\\max(a,b)')).toBe('max (a,b)')
  })
})

describe('toSearchText', () => {
  it('keeps inline math content but strips $ and ^', () => {
    const out = toSearchText('质能方程 $E = mc^2$ 很重要')
    expect(out).toContain('E')
    expect(out).toContain('mc')
    expect(out).toContain('很重要')
    expect(out).not.toContain('$')
    expect(out).not.toContain('^')
  })

  it('handles display math', () => {
    const out = toSearchText('$$\n\\int_0^1 x\\,dx = \\frac{1}{2}\n$$')
    expect(out).not.toContain('\\')
    expect(out).not.toContain('$')
  })

  it('handles \\( \\) and \\[ \\]', () => {
    expect(toSearchText('\\(a+b\\)')).toBe('a+b')
    expect(toSearchText('\\[c-d\\]')).toBe('c-d')
  })

  it('keeps plain markup text intact', () => {
    expect(toSearchText('# 标题\n\n- 项目一\n- 项目二')).toContain('标题')
  })
})

describe('hasLatex', () => {
  it('detects formulas', () => {
    expect(hasLatex('$x$')).toBe(true)
    expect(hasLatex('$$y$$')).toBe(true)
    expect(hasLatex('plain text')).toBe(false)
  })
})
