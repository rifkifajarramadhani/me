import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://rifkifajarramadhani.github.io',
  base: '/me',
  trailingSlash: 'always',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        if (item.url.endsWith('/me')) {
          item.url = `${item.url}/`
        }
        item.changefreq = 'monthly'
        item.priority = 1.0
        return item
      },
    }),
  ],
})
