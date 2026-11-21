export const POST_STATUSES = [
  'draft',
  'scheduled',
  'published',
  'archived',
] as const

export type PostStatus = (typeof POST_STATUSES)[number]

/** The statuses each status may move to. Anything else is a conflict. */
const TRANSITIONS: Record<PostStatus, readonly PostStatus[]> = {
  draft: ['published', 'scheduled'],
  scheduled: ['draft', 'published'],
  published: ['draft', 'archived'],
  archived: ['draft', 'published'],
}

const DELETABLE: readonly PostStatus[] = ['draft', 'archived']

export function isPostStatus(value: unknown): value is PostStatus {
  return POST_STATUSES.includes(value as PostStatus)
}

export function canTransition(from: PostStatus, to: PostStatus) {
  return TRANSITIONS[from].includes(to)
}

export function nextStatuses(from: PostStatus) {
  return TRANSITIONS[from]
}

export function canDelete(status: PostStatus) {
  return DELETABLE.includes(status)
}

/**
 * A scheduled post goes live once its publish time passes, without a job
 * rewriting its stored status.
 */
export function effectiveStatus(
  status: PostStatus,
  publishedAt: string | null,
  now = new Date(),
): PostStatus {
  if (
    status === 'scheduled' &&
    publishedAt &&
    Date.parse(publishedAt) <= now.getTime()
  ) {
    return 'published'
  }
  return status
}
