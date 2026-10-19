/**
 * LaTeX 与 Markdown 的「可检索化」处理。
 *
 * 目标：**原文照常保留**（用于展示/渲染），但送去建索引的文本要抹掉
 * 公式语法噪声（$、\frac、{}、^、_ 等），避免污染全文检索的 token。
 *
 * 处理策略：数学区域内的「语义内容」保留，LaTeX 命令与符号丢弃。
 *   例：`$E = mc^2$`  ->  "E mc 2"
 *       `\frac{a}{b}`  ->  "a b"
 */

/** 行间公式 $$ ... $$ */
const DISPLAY_MATH = /\$\$([\s\S]+?)\$\$/g
/** \[ ... \] */
const BRACKET_MATH = /\\\[([\s\S]+?)\\\]/g
/** \( ... \) */
const PAREN_MATH = /\\\(([\s\S]+?)\\\)/g
/** 行内公式 $ ... $（不跨行、不匹配 $$） */
const INLINE_MATH = /\$([^$\n]+?)\$/g

/**
 * 会**渲染成可见文字**的 LaTeX 命令：保留其名字（否则 `\log` 渲染为 "log"，
 * 用户却搜不到，属于信息丢失）。结构性命令（\frac \bigl …）不产生可见文字，丢弃。
 */
const TEXT_COMMANDS = new Set([
  'log',
  'ln',
  'lg',
  'exp',
  'arg',
  'deg',
  'dim',
  'ker',
  'hom',
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'arcsin',
  'arccos',
  'arctan',
  'sinh',
  'cosh',
  'tanh',
  'coth',
  'max',
  'min',
  'lim',
  'sup',
  'inf',
  'det',
  'gcd',
  'lcm',
  'mod',
  'bmod',
  'pmod',
  'Pr',
])

/** 把一段 LaTeX 源码转成纯文本（保留可见字词，丢语法） */
export function latexToPlain(math: string): string {
  return math
    .replace(/\\([a-zA-Z]+)\*?/g, (_m, name: string) =>
      TEXT_COMMANDS.has(name) ? ` ${name} ` : ' ',
    )
    .replace(/[{}^_&~\\$]/g, ' ') // 结构符号
    .replace(/\s+/g, ' ')
    .trim()
}

/** 判断文本中是否含 LaTeX 公式（用于统计/测试） */
export function hasLatex(text: string): boolean {
  DISPLAY_MATH.lastIndex = 0
  BRACKET_MATH.lastIndex = 0
  PAREN_MATH.lastIndex = 0
  INLINE_MATH.lastIndex = 0
  return (
    DISPLAY_MATH.test(text) ||
    BRACKET_MATH.test(text) ||
    PAREN_MATH.test(text) ||
    INLINE_MATH.test(text)
  )
}

/**
 * 将 Markdown 正文（可含 LaTeX）转为用于 FTS 的纯文本。
 * 原文不受影响，此函数只产出「索引副本」。
 */
export function toSearchText(raw: string): string {
  let out = raw

  // 1) 数学区域：先去最长的 $$，再 \[ \( ...，最后行内 $
  out = out.replace(DISPLAY_MATH, (_m, body: string) => ` ${latexToPlain(body)} `)
  out = out.replace(BRACKET_MATH, (_m, body: string) => ` ${latexToPlain(body)} `)
  out = out.replace(PAREN_MATH, (_m, body: string) => ` ${latexToPlain(body)} `)
  out = out.replace(INLINE_MATH, (_m, body: string) => ` ${latexToPlain(body)} `)

  // 2) 代码块围栏去掉，代码内容保留
  out = out.replace(/```[^\n]*/g, ' ')
  out = out.replace(/`([^`]*)`/g, ' $1 ')

  // 3) 链接保留文字
  out = out.replace(/\[([^\]]*)\]\([^)]*\)/g, ' $1 ')

  // 4) Markdown 结构符号
  out = out.replace(/[#>*_~|]/g, ' ')

  return out.replace(/\s+/g, ' ').trim()
}
