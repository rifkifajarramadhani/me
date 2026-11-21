import { describe, expect, test } from 'bun:test'
import { createSitePublishing } from './site-publishing'

describe('createSitePublishing', () => {
  test('selects the apex profile by default and exposes Astro configuration', () => {
    const previousProfile = process.env.PUBLISHING_PROFILE
    delete process.env.PUBLISHING_PROFILE

    try {
      const publishing = createSitePublishing()

      expect(publishing.profile).toBe('apex')
      expect(publishing.astro).toEqual({
        site: 'https://rifkiramadhani.my.id',
        base: '/',
        trailingSlash: 'always',
      })
    } finally {
      if (previousProfile === undefined) delete process.env.PUBLISHING_PROFILE
      else process.env.PUBLISHING_PROFILE = previousProfile
    }
  })

  test('normalizes public paths for the GitHub Pages base path', () => {
    const publishing = createSitePublishing('github-pages')

    expect(publishing.publicPath()).toBe('/me/')
    expect(publishing.publicPath('resume.pdf')).toBe('/me/resume.pdf')
    expect(publishing.publicPath('/resume.pdf')).toBe('/me/resume.pdf')
    expect(publishing.publicPath('///resume.pdf')).toBe('/me/resume.pdf')
  })

  test('builds profile-aware absolute URLs without duplicating the base path', () => {
    const publishing = createSitePublishing('github-pages')

    expect(publishing.absoluteUrl()).toBe(
      'https://rifkifajarramadhani.github.io/me/',
    )
    expect(publishing.absoluteUrl('/project/preview.png')).toBe(
      'https://rifkifajarramadhani.github.io/me/project/preview.png',
    )
    expect(publishing.absoluteUrl('/me/project/preview.png')).toBe(
      'https://rifkifajarramadhani.github.io/me/project/preview.png',
    )
  })

  test('resolves canonical URLs and default social metadata with trailing slashes', () => {
    const publishing = createSitePublishing('github-pages')
    const document = publishing.resolveDocument({ pathname: '/me/work' })

    expect(document.canonicalUrl).toBe(
      'https://rifkifajarramadhani.github.io/me/work/',
    )
    expect(document.ogImageUrl).toBe(
      'https://rifkifajarramadhani.github.io/me/og-image.png',
    )
    expect(document.twitterImageUrl).toBe(
      'https://rifkifajarramadhani.github.io/me/twitter-image.png',
    )
    expect(publishing.resolveDocument({ pathname: '/me/' }).canonicalUrl).toBe(
      'https://rifkifajarramadhani.github.io/me/',
    )
  })

  test('preserves document overrides and resolves custom public or absolute images', () => {
    const publishing = createSitePublishing('github-pages')
    const publicImage = publishing.resolveDocument({
      pathname: '/me/404',
      title: 'Missing',
      description: 'Not found',
      image: '/custom.png',
      noindex: true,
    })

    expect(publicImage).toMatchObject({
      title: 'Missing',
      description: 'Not found',
      noindex: true,
      robots: 'noindex',
      canonicalUrl: 'https://rifkifajarramadhani.github.io/me/404/',
      ogImageUrl: 'https://rifkifajarramadhani.github.io/me/custom.png',
      twitterImageUrl: 'https://rifkifajarramadhani.github.io/me/custom.png',
    })

    const absoluteImage = publishing.resolveDocument({
      pathname: '/me/',
      image: 'https://images.example.com/social.png',
    })
    expect(absoluteImage.ogImageUrl).toBe(
      'https://images.example.com/social.png',
    )
    expect(absoluteImage.twitterImageUrl).toBe(
      'https://images.example.com/social.png',
    )
  })

  test('fails configuration for an unknown profile name', () => {
    const previousProfile = process.env.PUBLISHING_PROFILE
    process.env.PUBLISHING_PROFILE = 'preview'

    try {
      expect(() => createSitePublishing()).toThrow(
        'Unknown publishing profile "preview". Expected "apex" or "github-pages".',
      )
    } finally {
      if (previousProfile === undefined) delete process.env.PUBLISHING_PROFILE
      else process.env.PUBLISHING_PROFILE = previousProfile
    }
  })

  test('provides semantic asset paths to callers', () => {
    const publishing = createSitePublishing('github-pages')

    expect(publishing.assets).toEqual({
      favicon96: '/me/favicon-96x96.png',
      faviconSvg: '/me/favicon.svg',
      faviconIco: '/me/favicon.ico',
      favicon32: '/me/favicon-32x32.png',
      favicon16: '/me/favicon-16x16.png',
      appleTouchIcon: '/me/apple-touch-icon.png',
      manifest: '/me/site.webmanifest',
      sitemap: '/me/sitemap-index.xml',
      resume: '/me/resume.pdf',
    })
  })

  test('generates profile-aware robots content', () => {
    const publishing = createSitePublishing('github-pages')

    expect(publishing.robots).toBe(
      'User-agent: *\nAllow: /me/\n\nSitemap: https://rifkifajarramadhani.github.io/me/sitemap-index.xml\n',
    )
  })

  test('generates a manifest whose navigation and icons stay within the profile scope', () => {
    const publishing = createSitePublishing('github-pages')

    expect(publishing.manifest).toMatchObject({
      name: 'Rifki Fajar Ramadhani',
      short_name: 'Rifki',
      start_url: '/me/',
      scope: '/me/',
      display: 'standalone',
      background_color: '#fdfcfc',
      theme_color: '#171514',
      icons: [
        {
          src: '/me/favicon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/me/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/me/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/me/maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    })
    expect(createSitePublishing('apex').manifest.start_url).toBe('/')
    expect(createSitePublishing('apex').manifest.scope).toBe('/')
  })

  test('configures sitemap filtering, metadata, and the canonical home slash', () => {
    const publishing = createSitePublishing('github-pages')

    expect(
      publishing.sitemap.filter?.(
        'https://rifkifajarramadhani.github.io/me/404/',
      ),
    ).toBe(false)
    expect(
      publishing.sitemap.filter?.(
        'https://rifkifajarramadhani.github.io/me/',
      ),
    ).toBe(true)

    const home = publishing.sitemap.serialize?.({
      url: 'https://rifkifajarramadhani.github.io/me',
    })
    expect(home).toMatchObject({
      url: 'https://rifkifajarramadhani.github.io/me/',
      changefreq: 'monthly',
      priority: 1,
    })
  })

  test('lists the on-demand blog only where it is deployed', () => {
    const apex = createSitePublishing('apex')
    expect(apex.hasBlog).toBe(true)
    expect(apex.sitemap.customPages).toEqual([
      'https://rifkiramadhani.my.id/blog/',
    ])
    expect(
      apex.sitemap.serialize?.({ url: 'https://rifkiramadhani.my.id/blog/' }),
    ).toMatchObject({ changefreq: 'weekly', priority: 0.8 })

    const pages = createSitePublishing('github-pages')
    expect(pages.hasBlog).toBe(false)
    expect(pages.sitemap.customPages).toEqual([])
  })
})
