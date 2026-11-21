import type { JSONContent } from '@tiptap/core'
import type { PostStatus } from './post-status'

/** A post as stored. `status` is the stored status, before scheduling resolves. */
export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  content: JSONContent
  html: string
  wordCount: number
  status: PostStatus
  publishedAt: string | null
  firstPublishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type NewPost = Omit<Post, 'id'>
