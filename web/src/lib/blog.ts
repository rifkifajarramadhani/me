/**
 * Server-side client for published posts. The blog server reaches the CMS over
 * the internal network; `CMS_API_TARGET` is read per request, at runtime.
 */
export interface BlogPostSummary {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  updatedAt: string
  readingMinutes: number
}

export interface BlogPost extends BlogPostSummary {
  /** Server-rendered from validated editor JSON by the CMS. */
  html: string
}

/** The CMS could not be reached or answered with an error. */
export class BlogUnavailable extends Error {}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TIMEOUT = 5_000
/** Dates read in the author's zone, so a post never shifts a day. */
const TIME_ZONE = 'Asia/Jakarta'

export function isPostSlug(value: string | undefined): value is string {
  return Boolean(value && value.length <= 80 && SLUG.test(value))
}

function apiUrl(path: string) {
  const base = process.env.CMS_API_TARGET ?? 'http://127.0.0.1:3000'
  return new URL(path, base).href
}

async function request(path: string, fetchImpl: Fetch) {
  const url = apiUrl(path)
  try {
    return await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT),
    })
  } catch (error) {
    throw new BlogUnavailable('The CMS did not respond.', { cause: error })
  }
}

export async function listPosts(fetchImpl: Fetch = fetch) {
  const response = await request('/api/posts', fetchImpl)
  if (!response.ok) throw new BlogUnavailable(`CMS answered ${response.status}.`)
  const body = (await response.json()) as { posts: BlogPostSummary[] }
  return body.posts
}

/** The published post with this slug, or undefined when there is none. */
export async function getPost(slug: string, fetchImpl: Fetch = fetch) {
  if (!isPostSlug(slug)) return undefined
  const response = await request(`/api/posts/${slug}`, fetchImpl)
  if (response.status === 404) return undefined
  if (!response.ok) throw new BlogUnavailable(`CMS answered ${response.status}.`)
  return (await response.json()) as BlogPost
}

const isoDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const longDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** `2026-11-21`, for the `ls -lt` style listing. */
export function formatListDate(iso: string) {
  return isoDate.format(new Date(iso))
}

/** `21 November 2026`, for article bylines. */
export function formatLongDate(iso: string) {
  return longDate.format(new Date(iso))
}

export function formatReadingTime(minutes: number) {
  return `${minutes} min read`
}
