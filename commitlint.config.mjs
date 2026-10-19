/**
 * Conventional Commits 强制校验。
 * 格式：<type>(<scope>): <subject>
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    // 允许中文/英文任意大小写开头
    'subject-case': [0],
  },
}
