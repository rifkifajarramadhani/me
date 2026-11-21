import { Injectable } from '@nestjs/common'
import { Database } from '../database/database'
import type { NewPost, Post } from './post'
import type { PostStatus } from './post-status'

interface PostRow {
  id: number
  slug: string
  title: string
  excerpt: string
  content_json: string
  content_html: string
  word_count: number
  status: PostStatus
  published_at: string | null
  first_published_at: string | null
  created_at: string
  updated_at: string
}

function toPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: JSON.parse(row.content_json),
    html: row.content_html,
    wordCount: row.word_count,
    status: row.status,
    publishedAt: row.published_at,
    firstPublishedAt: row.first_published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toParams(post: NewPost) {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content_json: JSON.stringify(post.content),
    content_html: post.html,
    word_count: post.wordCount,
    status: post.status,
    published_at: post.publishedAt,
    first_published_at: post.firstPublishedAt,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  }
}

const COLUMNS = `slug, title, excerpt, content_json, content_html, word_count,
  status, published_at, first_published_at, created_at, updated_at`

/** SQL access for posts. Business rules live in `PostsService`. */
@Injectable()
export class PostsRepository {
  constructor(private readonly database: Database) {}

  private get db() {
    return this.database.connection
  }

  all() {
    return this.db
      .query<PostRow, []>(
        `SELECT * FROM posts ORDER BY COALESCE(published_at, updated_at) DESC, id DESC`,
      )
      .all()
      .map(toPost)
  }

  /** Published posts and scheduled posts whose time has come, newest first. */
  public(now: string) {
    return this.db
      .query<PostRow, { now: string }>(
        `SELECT * FROM posts
         WHERE status IN ('published', 'scheduled') AND published_at <= $now
         ORDER BY published_at DESC, id DESC`,
      )
      .all({ now })
      .map(toPost)
  }

  find(id: number) {
    const row = this.db
      .query<PostRow, { id: number }>('SELECT * FROM posts WHERE id = $id')
      .get({ id })
    return row ? toPost(row) : undefined
  }

  findBySlug(slug: string) {
    const row = this.db
      .query<PostRow, { slug: string }>(
        'SELECT * FROM posts WHERE slug = $slug',
      )
      .get({ slug })
    return row ? toPost(row) : undefined
  }

  slugTaken(slug: string, exceptId?: number) {
    return Boolean(
      this.db
        .query<{ id: number }, { slug: string; id: number }>(
          'SELECT id FROM posts WHERE slug = $slug AND id != $id',
        )
        .get({ slug, id: exceptId ?? 0 }),
    )
  }

  insert(post: NewPost) {
    const row = this.db
      .query<PostRow, ReturnType<typeof toParams>>(
        `INSERT INTO posts (${COLUMNS}) VALUES ($slug, $title, $excerpt,
          $content_json, $content_html, $word_count, $status, $published_at,
          $first_published_at, $created_at, $updated_at)
         RETURNING *`,
      )
      .get(toParams(post))!
    return toPost(row)
  }

  /** Writes `post` only if the stored row still has `expectedUpdatedAt`. */
  update(post: Post, expectedUpdatedAt: string) {
    const row = this.db
      .query<
        PostRow,
        ReturnType<typeof toParams> & { id: number; expected: string }
      >(
        `UPDATE posts SET slug = $slug, title = $title, excerpt = $excerpt,
          content_json = $content_json, content_html = $content_html,
          word_count = $word_count, status = $status, published_at = $published_at,
          first_published_at = $first_published_at, updated_at = $updated_at
         WHERE id = $id AND updated_at = $expected
         RETURNING *`,
      )
      .get({ ...toParams(post), id: post.id, expected: expectedUpdatedAt })
    return row ? toPost(row) : undefined
  }

  delete(id: number, expectedUpdatedAt: string) {
    return (
      this.db
        .query<unknown, { id: number; expected: string }>(
          'DELETE FROM posts WHERE id = $id AND updated_at = $expected',
        )
        .run({ id, expected: expectedUpdatedAt }).changes === 1
    )
  }
}
