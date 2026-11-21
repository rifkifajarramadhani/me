import { afterEach, describe, expect, test } from 'bun:test'
import {
  BlogUnavailable,
  formatListDate,
  formatLongDate,
  getPost,
  isPostSlug,
  listPosts,
} from './blog'

const post = {
  slug: 'hello',
  title: 'Hello',
  excerpt: 'Hi',
  publishedAt: '2026-11-20T18:30:00.000Z',
  updatedAt: '2026-11-20T18:30:00.000Z',
  readingMinutes: 1,
}

function fakeFetch(status: number, body: unknown, seen: string[] = []) {
  return async (url: string) => {
    seen.push(url)
    return Response.json(body, { status })
  }
}

describe('blog client', () => {
  const previous = process.env.CMS_API_TARGET
  afterEach(() => {
    if (previous === undefined) delete process.env.CMS_API_TARGET
    else process.env.CMS_API_TARGET = previous
  })

  test('lists posts from the configured CMS', async () => {
    process.env.CMS_API_TARGET = 'http://api:3000'
    const seen: string[] = []
    expect(await listPosts(fakeFetch(200, { posts: [post] }, seen))).toEqual([post])
    expect(seen).toEqual(['http://api:3000/api/posts'])
  })

  test('returns undefined for a missing post and never fetches a bad slug', async () => {
    const seen: string[] = []
    expect(await getPost('hello', fakeFetch(404, {}, seen))).toBeUndefined()
    expect(await getPost('../admin', fakeFetch(200, post, seen))).toBeUndefined()
    expect(await getPost('Hello', fakeFetch(200, post, seen))).toBeUndefined()
    expect(seen).toHaveLength(1)
  })

  test('reports CMS failures as unavailable', async () => {
    expect(listPosts(fakeFetch(500, {}))).rejects.toBeInstanceOf(BlogUnavailable)
    expect(getPost('hello', fakeFetch(503, {}))).rejects.toBeInstanceOf(
      BlogUnavailable,
    )
    const offline = async () => {
      throw new TypeError('fetch failed')
    }
    expect(listPosts(offline)).rejects.toBeInstanceOf(BlogUnavailable)
  })

  test('validates slugs', () => {
    expect(isPostSlug('cutting-load-time-2')).toBe(true)
    for (const slug of [undefined, '', 'a--b', '-a', 'a/b', 'x'.repeat(81)]) {
      expect(isPostSlug(slug)).toBe(false)
    }
  })

  test('formats dates in the author’s time zone', () => {
    expect(formatListDate(post.publishedAt)).toBe('2026-11-21')
    expect(formatLongDate(post.publishedAt)).toBe('21 November 2026')
  })
})
