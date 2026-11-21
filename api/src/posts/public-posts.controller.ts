import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { PublicRoute } from '../admin/owner.guard'
import type { Post } from './post'
import { excerptFrom, plainText, readingMinutes } from './post-content'
import { PostsRepository } from './posts.repository'

function toSummary(post: Post) {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || excerptFrom(plainText(post.content)),
    publishedAt: post.publishedAt!,
    updatedAt: post.updatedAt,
    readingMinutes: readingMinutes(post.wordCount),
  }
}

/**
 * Published posts for the blog server. Not routed publicly by Traefik; the
 * Astro server calls it over the internal network.
 */
@Controller('api/posts')
export class PublicPostsController {
  constructor(private readonly posts: PostsRepository) {}

  @Get()
  @PublicRoute()
  @Header('Cache-Control', 'no-store')
  list() {
    return { posts: this.posts.public(new Date().toISOString()).map(toSummary) }
  }

  @Get(':slug')
  @PublicRoute()
  @Header('Cache-Control', 'no-store')
  get(@Param('slug') slug: string) {
    const post = this.posts.findBySlug(slug)
    const now = new Date().toISOString()
    const live =
      post &&
      (post.status === 'published' || post.status === 'scheduled') &&
      post.publishedAt !== null &&
      post.publishedAt <= now
    if (!live) throw new NotFoundException('No published post has this slug.')
    return { ...toSummary(post), html: post.html }
  }
}
