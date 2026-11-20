import astro from 'eslint-plugin-astro'
import prettier from 'eslint-config-prettier'
import typescriptParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      '**/dist/',
      '**/.astro/',
      '.agents/',
      '.claude/',
      '.codex/',
      '.github/',
      '.impeccable/',
    ],
  },
  ...astro.configs.recommended,
  {
    files: ['api/src/**/*.ts'],
    languageOptions: { parser: typescriptParser },
    rules: {
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  prettier,
]
