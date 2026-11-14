import astro from 'eslint-plugin-astro'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      '.agents/',
      '.claude/',
      '.codex/',
      '.github/',
      '.impeccable/',
    ],
  },
  ...astro.configs.recommended,
  prettier,
]
