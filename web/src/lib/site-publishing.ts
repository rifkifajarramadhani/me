import type { AstroUserConfig } from 'astro'
import { ChangeFreqEnum, type SitemapOptions } from '@astrojs/sitemap'
import {
  defaultDescription,
  defaultSocialImageAlt,
  defaultTitle,
  manifestDescription,
  name,
  shortName,
} from './site'

export type PublishingProfileName = 'apex' | 'github-pages'

type AstroPublishingConfig = Required<
  Pick<AstroUserConfig, 'site' | 'base' | 'trailingSlash'>
>

export interface DocumentMetadataInput {
  pathname: string
  title?: string
  description?: string
  image?: string
  noindex?: boolean
}

export interface ResolvedDocumentMetadata {
  title: string
  description: string
  noindex: boolean
  robots: 'noindex' | 'index, follow'
  canonicalUrl: string
  ogImageUrl: string
  twitterImageUrl: string
  socialImageAlt: string
}

export interface PublishingAssets {
  favicon96: string
  faviconSvg: string
  faviconIco: string
  favicon32: string
  favicon16: string
  appleTouchIcon: string
  manifest: string
  sitemap: string
  resume: string
}

export interface SiteManifest {
  name: string
  short_name: string
  description: string
  start_url: string
  scope: string
  display: 'standalone'
  background_color: string
  theme_color: string
  icons: Array<{
    src: string
    sizes: string
    type: 'image/png'
    purpose: 'any' | 'maskable'
  }>
}

export interface SitePublishing {
  readonly profile: PublishingProfileName
  readonly astro: AstroPublishingConfig
  readonly assets: PublishingAssets
  readonly robots: string
  readonly manifest: SiteManifest
  readonly sitemap: Exclude<SitemapOptions, undefined>
  publicPath(path?: string): string
  absoluteUrl(path?: string): string
  resolveDocument(input: DocumentMetadataInput): ResolvedDocumentMetadata
}

const PROFILES: Record<PublishingProfileName, AstroPublishingConfig> = {
  apex: {
    site: 'https://rifkiramadhani.my.id',
    base: '/',
    trailingSlash: 'always',
  },
  'github-pages': {
    site: 'https://rifkifajarramadhani.github.io',
    base: '/me',
    trailingSlash: 'always',
  },
}

function resolveProfile(profile: string | undefined): PublishingProfileName {
  const selected = profile ?? 'apex'
  if (selected === 'apex' || selected === 'github-pages') return selected

  throw new Error(
    `Unknown publishing profile "${selected}". Expected "apex" or "github-pages".`,
  )
}

export function createSitePublishing(
  profile: PublishingProfileName | undefined = process.env.PUBLISHING_PROFILE as
    | PublishingProfileName
    | undefined,
): SitePublishing {
  const selected = resolveProfile(profile)
  const astro = PROFILES[selected]
  const base = astro.base === '/' ? '/' : `${astro.base.replace(/\/$/, '')}/`
  const baseWithoutSlashes = base.replace(/^\/|\/$/g, '')

  const publicPath = (path = '') => {
    const relativePath = path.replace(/^\/+/, '')
    if (!relativePath) return base
    if (
      baseWithoutSlashes &&
      (relativePath === baseWithoutSlashes ||
        relativePath.startsWith(`${baseWithoutSlashes}/`))
    ) {
      return `/${relativePath}`
    }
    return `${base}${relativePath}`
  }

  const absoluteUrl = (path = '') => {
    if (/^https?:\/\//i.test(path)) return path
    return new URL(publicPath(path), astro.site).href
  }

  const documentUrl = (pathname: string) => {
    const path = publicPath(pathname)
    return absoluteUrl(path.endsWith('/') ? path : `${path}/`)
  }

  const resolveDocument = ({
    pathname,
    title = defaultTitle,
    description = defaultDescription,
    image,
    noindex = false,
  }: DocumentMetadataInput): ResolvedDocumentMetadata => ({
    title,
    description,
    noindex,
    robots: noindex ? 'noindex' : 'index, follow',
    canonicalUrl: documentUrl(pathname),
    ogImageUrl: absoluteUrl(image ?? 'og-image.png'),
    twitterImageUrl: absoluteUrl(image ?? 'twitter-image.png'),
    socialImageAlt: defaultSocialImageAlt,
  })

  const assets: PublishingAssets = {
    favicon96: publicPath('favicon-96x96.png'),
    faviconSvg: publicPath('favicon.svg'),
    faviconIco: publicPath('favicon.ico'),
    favicon32: publicPath('favicon-32x32.png'),
    favicon16: publicPath('favicon-16x16.png'),
    appleTouchIcon: publicPath('apple-touch-icon.png'),
    manifest: publicPath('site.webmanifest'),
    sitemap: publicPath('sitemap-index.xml'),
    resume: publicPath('resume.pdf'),
  }
  const robots = `User-agent: *\nAllow: ${publicPath()}\n\nSitemap: ${absoluteUrl(
    assets.sitemap,
  )}\n`
  const manifest: SiteManifest = {
    name,
    short_name: shortName,
    description: manifestDescription,
    start_url: publicPath(),
    scope: publicPath(),
    display: 'standalone',
    background_color: '#fdfcfc',
    theme_color: '#171514',
    icons: [
      {
        src: assets.favicon96,
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: publicPath('android-chrome-192x192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: publicPath('android-chrome-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: publicPath('maskable-icon-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
  const homeUrl = absoluteUrl()
  const homeWithoutSlash = homeUrl.replace(/\/$/, '')
  const sitemap: Exclude<SitemapOptions, undefined> = {
    filter: (page) => {
      const pathname = new URL(page).pathname.replace(/\/$/, '')
      return !pathname.endsWith('/404')
    },
    serialize: (item) => ({
      ...item,
      url: item.url === homeWithoutSlash ? homeUrl : item.url,
      changefreq: ChangeFreqEnum.MONTHLY,
      priority: 1,
    }),
  }

  return {
    profile: selected,
    astro,
    assets,
    robots,
    manifest,
    sitemap,
    publicPath,
    absoluteUrl,
    resolveDocument,
  }
}
