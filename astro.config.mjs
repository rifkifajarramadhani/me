import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import { createSitePublishing } from './src/lib/site-publishing'

const publishing = createSitePublishing()

export default defineConfig({
  ...publishing.astro,
  integrations: [sitemap(publishing.sitemap)],
  vite: {
    plugins: [tailwindcss()],
  },
})
