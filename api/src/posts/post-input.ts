import { BadRequestException } from '@nestjs/common'
import { isPostStatus, type PostStatus } from './post-status'
import { isValidSlug, SLUG_MAX_LENGTH } from './slug'

export const TITLE_MAX_LENGTH = 200
export const EXCERPT_MAX_LENGTH = 300

export interface PostDraftInput {
  title: string
  slug?: string
  excerpt: string
  content?: unknown
}

export interface PostUpdateInput extends PostDraftInput {
  updatedAt: string
}

export interface StatusChangeInput {
  status: PostStatus
  publishAt?: string
  updatedAt: string
}

function asObject(body: unknown) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('Send the post as a JSON object.')
  }
  return body as Record<string, unknown>
}

function text(value: unknown, field: string, max: number) {
  if (value === undefined) return ''
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be text.`)
  }
  const trimmed = value.trim()
  if (trimmed.length > max) {
    throw new BadRequestException(
      `${field} must be ${max} characters or fewer.`,
    )
  }
  return trimmed
}

function slug(value: unknown) {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string' || !isValidSlug(value)) {
    throw new BadRequestException(
      `Slug must use lowercase letters, numbers, and single hyphens, up to ${SLUG_MAX_LENGTH} characters.`,
    )
  }
  return value
}

function timestamp(value: unknown, field: string) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new BadRequestException(`${field} must be an ISO 8601 date and time.`)
  }
  return new Date(value).toISOString()
}

export function updatedAtToken(value: unknown) {
  return timestamp(value, 'updatedAt')
}

export function parseDraft(body: unknown): PostDraftInput {
  const input = asObject(body)
  return {
    title: text(input.title, 'Title', TITLE_MAX_LENGTH),
    slug: slug(input.slug),
    excerpt: text(input.excerpt, 'Excerpt', EXCERPT_MAX_LENGTH),
    content: input.content,
  }
}

export function parseUpdate(body: unknown): PostUpdateInput {
  const input = asObject(body)
  return { ...parseDraft(input), updatedAt: updatedAtToken(input.updatedAt) }
}

export function parseStatusChange(body: unknown): StatusChangeInput {
  const input = asObject(body)
  if (!isPostStatus(input.status)) {
    throw new BadRequestException(
      'Status must be draft, scheduled, published, or archived.',
    )
  }
  return {
    status: input.status,
    publishAt:
      input.publishAt === undefined
        ? undefined
        : timestamp(input.publishAt, 'publishAt'),
    updatedAt: updatedAtToken(input.updatedAt),
  }
}

export function parseStatusFilter(value: unknown) {
  if (value === undefined || value === '') return undefined
  if (!isPostStatus(value)) {
    throw new BadRequestException(
      'Filter by draft, scheduled, published, or archived.',
    )
  }
  return value
}
