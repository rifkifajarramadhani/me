import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import { createSitePublishing } from './src/lib/site-publishing'

const publishing = createSitePublishing()

const adminRoutes = [
  { pattern: '/admin', entrypoint: './src/admin/Admin.astro' },
  { pattern: '/admin/login', entrypoint: './src/admin/Login.astro' },
  { pattern: '/admin/posts', entrypoint: './src/admin/posts/Posts.astro' },
]

// The admin CSP allows only same-origin script files, so Astro must never
// inline an admin page's script. Other scripts keep Vite's default limit.
const adminScript = new RegExp(
  `^_astro/(?:${adminRoutes
    .map(({ entrypoint }) => entrypoint.match(/(\w+)\.astro$/)[1])
    .join('|')})\\.astro_astro_type_script_`,
)
const assetsInlineLimit = (path) => (adminScript.test(path) ? false : undefined)

const cms = {
  name: 'cms-admin',
  hooks: {
    'astro:config:setup': ({ command, injectRoute, updateConfig }) => {
      // Astro checks trailing slashes before Vite can proxy the API paths.
      if (command === 'dev') updateConfig({ trailingSlash: 'ignore' })

      adminRoutes.forEach((route) => injectRoute(route))
    },
  },
}

export default defineConfig({
  ...publishing.astro,
  // Astro 7 defaults to JSX whitespace rules, which drop the spaces our
  // inline markup relies on; keep the lossless HTML-aware compression.
  compressHTML: true,
  integrations: [
    sitemap(publishing.sitemap),
    ...(publishing.profile === 'apex' ? [cms] : []),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit },
    server: {
      proxy:
        publishing.profile === 'apex'
          ? {
              '^/admin/(?:auth/github(?:/callback)?|session|logout)(?:\\?|$)':
                process.env.CMS_API_TARGET ?? 'http://127.0.0.1:3000',
              '^/admin/api/': process.env.CMS_API_TARGET ?? 'http://127.0.0.1:3000',
              '^/api/github/contributions(?:\\?|$)':
                process.env.CMS_API_TARGET ?? 'http://127.0.0.1:3000',
            }
          : undefined,
    },
  },
})
