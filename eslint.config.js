import stylistic from '@stylistic/eslint-plugin'
import parserTs from '@typescript-eslint/parser'

export default [
  {
    ignores: ['main.js', 'test-vault/**']
  },
  {
    files: ['**/*.ts', '*.js'],
    languageOptions: {
      parser: parserTs,
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/linebreak-style': 'error',
      '@stylistic/eol-last': 'error'
    }
  }
]
