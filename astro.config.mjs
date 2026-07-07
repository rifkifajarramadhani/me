import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

const site = process.env.SITE_URL || 'https://rifkifajarramadhani.github.io'
const base = process.env.BASE_PATH || '/me'
const homeWithoutSlash = new URL(base === '/' ? '/' : base, site).href.replace(
  /\/$/,
  '',
)

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        if (item.url === homeWithoutSlash) {
          item.url = `${item.url}/`
        }
        item.changefreq = 'monthly'
        item.priority = 1.0
        return item
      },
    }),
  ],
})
