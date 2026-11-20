import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import { createSitePublishing } from './src/lib/site-publishing'

const publishing = createSitePublishing()

export default defineConfig({
  ...publishing.astro,
  // Astro 7 defaults to JSX whitespace rules, which drop the spaces our
  // inline markup relies on; keep the lossless HTML-aware compression.
  compressHTML: true,
  integrations: [sitemap(publishing.sitemap)],
  vite: {
    plugins: [tailwindcss()],
  },
})
