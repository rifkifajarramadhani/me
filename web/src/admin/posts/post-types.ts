export const POST_STATUSES = [
  'draft',
  'scheduled',
  'published',
  'archived',
] as const

export type PostStatus = (typeof POST_STATUSES)[number]

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
}

export interface AdminPostSummary {
  id: number
  slug: string
  title: string
  excerpt: string
  wordCount: number
  readingMinutes: number
  status: PostStatus
  publishedAt: string | null
  slugLocked: boolean
  nextStatuses: PostStatus[]
  deletable: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminPost extends AdminPostSummary {
  content: Record<string, unknown>
}

export interface PostList {
  posts: AdminPostSummary[]
  counts: Record<PostStatus, number>
}

export function isPostStatus(value: unknown): value is PostStatus {
  return POST_STATUSES.includes(value as PostStatus)
}

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso))
}

/** Reads the `message` from a Nest error response, if there is one. */
export async function errorMessage(response: Response, fallback: string) {
  try {
    const body: { message?: unknown } = await response.json()
    if (typeof body.message === 'string') return body.message
  } catch {
    // Not JSON; use the fallback.
  }
  return fallback
}
