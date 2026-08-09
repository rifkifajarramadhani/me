import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import { createSitePublishing } from './src/lib/site-publishing'

const publishing = createSitePublishing()

export default defineConfig({
  ...publishing.astro,
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(publishing.sitemap),
  ],
})
