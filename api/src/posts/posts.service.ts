import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Post } from './post'
import {
  EMPTY_DOCUMENT,
  InvalidPostContent,
  readingMinutes,
  renderPostContent,
} from './post-content'
import type {
  PostDraftInput,
  PostUpdateInput,
  StatusChangeInput,
} from './post-input'
import {
  canDelete,
  canTransition,
  effectiveStatus,
  nextStatuses,
  POST_STATUSES,
  type PostStatus,
} from './post-status'
import { PostsRepository } from './posts.repository'
import { slugify } from './slug'

const STALE_POST =
  'This post changed in another tab. Reload to see the latest version.'

/** A post as the admin sees it: scheduling resolved, with allowed actions. */
export function toAdminPost(post: Post, now = new Date()) {
  const status = effectiveStatus(post.status, post.publishedAt, now)
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    wordCount: post.wordCount,
    readingMinutes: readingMinutes(post.wordCount),
    status,
    publishedAt: post.publishedAt,
    slugLocked: isPublic(post, now),
    nextStatuses: nextStatuses(status),
    deletable: canDelete(status),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

export function toAdminSummary(post: Post, now = new Date()) {
  const { content: _content, ...summary } = toAdminPost(post, now)
  return summary
}

function isPublic(post: Post, now: Date) {
  return (
    post.firstPublishedAt !== null ||
    effectiveStatus(post.status, post.publishedAt, now) === 'published'
  )
}

/** A due scheduled post becomes published in storage on its next write. */
function settle(post: Post, now: Date): Post {
  if (effectiveStatus(post.status, post.publishedAt, now) !== 'published') {
    return post
  }
  return {
    ...post,
    status: 'published',
    firstPublishedAt: post.firstPublishedAt ?? post.publishedAt,
  }
}

/** Strictly later than `previous`, so the concurrency token always changes. */
function nextTimestamp(previous: string, now: Date) {
  const next = Math.max(now.getTime(), Date.parse(previous) + 1)
  return new Date(next).toISOString()
}

function render(content: unknown) {
  try {
    return renderPostContent(content ?? EMPTY_DOCUMENT)
  } catch (error) {
    if (error instanceof InvalidPostContent) {
      throw new BadRequestException(error.message)
    }
    throw error
  }
}

@Injectable()
export class PostsService {
  constructor(private readonly posts: PostsRepository) {}

  list(filter?: PostStatus) {
    const now = new Date()
    const posts = this.posts.all().map((post) => toAdminSummary(post, now))
    const counts = Object.fromEntries(
      POST_STATUSES.map((status) => [
        status,
        posts.filter((post) => post.status === status).length,
      ]),
    ) as Record<PostStatus, number>
    return {
      posts: filter ? posts.filter((post) => post.status === filter) : posts,
      counts,
    }
  }

  get(id: number) {
    return toAdminPost(this.require(id))
  }

  create(input: PostDraftInput) {
    const title = this.requireTitle(input.title)
    const content = render(input.content)
    const slug = input.slug ?? this.availableSlug(slugify(title) || 'post')
    this.assertSlugFree(slug)

    const now = new Date().toISOString()
    return toAdminPost(
      this.posts.insert({
        slug,
        title,
        excerpt: input.excerpt,
        content: content.json,
        html: content.html,
        wordCount: content.wordCount,
        status: 'draft',
        publishedAt: null,
        firstPublishedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  update(id: number, input: PostUpdateInput) {
    const now = new Date()
    const current = settle(this.require(id), now)
    const title = this.requireTitle(input.title)
    const slug = input.slug ?? current.slug
    if (slug !== current.slug) {
      if (isPublic(current, now)) {
        throw new ConflictException(
          'The slug is locked because this post has been published.',
        )
      }
      this.assertSlugFree(slug, id)
    }
    const content = render(input.content)

    return this.save(
      {
        ...current,
        title,
        slug,
        excerpt: input.excerpt,
        content: content.json,
        html: content.html,
        wordCount: content.wordCount,
      },
      input.updatedAt,
      now,
    )
  }

  changeStatus(id: number, input: StatusChangeInput) {
    const now = new Date()
    const current = settle(this.require(id), now)
    if (!canTransition(current.status, input.status)) {
      throw new ConflictException(
        `A ${current.status} post cannot become ${input.status}.`,
      )
    }

    return this.save(
      { ...current, ...this.statusFields(current, input, now) },
      input.updatedAt,
      now,
    )
  }

  delete(id: number, updatedAt: string) {
    const current = this.require(id)
    const status = effectiveStatus(current.status, current.publishedAt)
    if (!canDelete(status)) {
      throw new ConflictException(
        'Unpublish or archive this post before deleting it.',
      )
    }
    if (!this.posts.delete(id, updatedAt))
      throw new ConflictException(STALE_POST)
  }

  private statusFields(
    current: Post,
    { status, publishAt }: StatusChangeInput,
    now: Date,
  ): Pick<Post, 'status' | 'publishedAt' | 'firstPublishedAt'> {
    if (status !== 'scheduled' && publishAt !== undefined) {
      throw new BadRequestException('Only scheduling takes a publish time.')
    }
    switch (status) {
      case 'scheduled':
        if (!publishAt || Date.parse(publishAt) <= now.getTime()) {
          throw new BadRequestException('Choose a publish time in the future.')
        }
        return {
          status,
          publishedAt: publishAt,
          firstPublishedAt: current.firstPublishedAt,
        }
      case 'published': {
        // Restoring an archived post keeps its original publish date.
        const publishedAt =
          current.status === 'archived' && current.publishedAt
            ? current.publishedAt
            : now.toISOString()
        return {
          status,
          publishedAt,
          firstPublishedAt: current.firstPublishedAt ?? publishedAt,
        }
      }
      case 'draft':
        return {
          status,
          publishedAt: null,
          firstPublishedAt: current.firstPublishedAt,
        }
      case 'archived':
        return {
          status,
          publishedAt: current.publishedAt,
          firstPublishedAt: current.firstPublishedAt,
        }
    }
  }

  private save(post: Post, expectedUpdatedAt: string, now: Date) {
    const saved = this.posts.update(
      { ...post, updatedAt: nextTimestamp(post.updatedAt, now) },
      expectedUpdatedAt,
    )
    if (!saved) throw new ConflictException(STALE_POST)
    return toAdminPost(saved, now)
  }

  private require(id: number) {
    const post = this.posts.find(id)
    if (!post) throw new NotFoundException('This post no longer exists.')
    return post
  }

  private requireTitle(title: string) {
    if (!title) throw new BadRequestException('Add a title.')
    return title
  }

  private assertSlugFree(slug: string, exceptId?: number) {
    if (this.posts.slugTaken(slug, exceptId)) {
      throw new ConflictException('Another post already uses this slug.')
    }
  }

  private availableSlug(base: string) {
    let slug = base
    for (let n = 2; this.posts.slugTaken(slug); n++) {
      const suffix = `-${n}`
      slug = `${base.slice(0, 80 - suffix.length).replace(/-+$/, '')}${suffix}`
    }
    return slug
  }
}
