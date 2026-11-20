const GITHUB_LOGIN = 'rifkifajarramadhani'
const DAY = 86_400_000
const DAYS = 365
const WINDOW_DAYS = 92
const REPOSITORY_LIMIT = 100
const REQUEST_LIMIT = 16

interface CommitDay {
  date: string
  count: number
}

interface RepositoryCommits {
  repository: { visibility: 'PUBLIC' | 'PRIVATE' | 'INTERNAL' }
  contributions: {
    nodes: { occurredAt: string; commitCount: number }[]
    pageInfo: { hasNextPage: boolean }
  }
}

interface ContributionsResponse {
  data?: {
    user: {
      contributionsCollection: {
        totalCommitContributions: number
        commitContributionsByRepository: RepositoryCommits[]
      }
    } | null
  }
  errors?: unknown[]
}

const query = `query PublicCommits($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      commitContributionsByRepository(maxRepositories: ${REPOSITORY_LIMIT}) {
        repository { visibility }
        contributions(first: ${WINDOW_DAYS}) {
          nodes { occurredAt commitCount }
          pageInfo { hasNextPage }
        }
      }
    }
  }
}`

export class GitHubRateLimit extends Error {
  constructor(readonly retryAt: number) {
    super('GitHub asked to delay commit activity requests.')
  }
}

function retryAt(headers: Headers) {
  const retryAfter = headers.get('retry-after')
  const delay =
    retryAfter && /^\d+$/.test(retryAfter)
      ? Date.now() + Number(retryAfter) * 1000
      : Date.parse(retryAfter ?? '')
  const reset =
    headers.get('x-ratelimit-remaining') === '0'
      ? Number(headers.get('x-ratelimit-reset')) * 1000
      : 0

  return Math.max(
    Number.isFinite(delay) ? delay : 0,
    Number.isFinite(reset) ? reset : 0,
  )
}

function dateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export async function fetchGitHubCommits(token: string, now: number) {
  const today = Math.floor(now / DAY) * DAY
  const start = today - (DAYS - 1) * DAY
  const counts = Array<number>(DAYS).fill(0)
  const signal = AbortSignal.timeout(8_000)
  let requests = 0
  let blockedUntil = 0

  async function loadWindow(from: number, days: number): Promise<void> {
    if (Date.now() < blockedUntil) throw new GitHubRateLimit(blockedUntil)
    if (requests >= REQUEST_LIMIT)
      throw new Error('GitHub commit query budget exceeded.')
    requests += 1

    const end = from + days * DAY
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          login: GITHUB_LOGIN,
          from: new Date(from).toISOString(),
          to: new Date(Math.min(end - 1, now)).toISOString(),
        },
      }),
      redirect: 'error',
      signal,
    })
    blockedUntil = retryAt(response.headers)
    if (!response.ok) throw new Error('GitHub commit query failed.')

    const payload: ContributionsResponse | null = await response.json()
    const collection = payload?.data?.user?.contributionsCollection
    if (payload?.errors?.length || !collection) {
      throw new Error('GitHub commit query returned no usable data.')
    }

    const groups = collection.commitContributionsByRepository
    const reportedTotal = collection.totalCommitContributions
    if (
      !Array.isArray(groups) ||
      !Number.isSafeInteger(reportedTotal) ||
      reportedTotal < 0
    ) {
      throw new Error('GitHub commit query returned an invalid collection.')
    }

    let total = 0
    const windowCounts = Array<number>(days).fill(0)
    let incomplete = groups.length >= REPOSITORY_LIMIT
    for (const { repository, contributions } of groups) {
      if (!['PUBLIC', 'PRIVATE', 'INTERNAL'].includes(repository.visibility)) {
        throw new Error('GitHub returned an invalid repository visibility.')
      }
      if (contributions.pageInfo.hasNextPage !== false) incomplete = true

      const seen = new Set<number>()
      for (const { occurredAt, commitCount } of contributions.nodes) {
        const day = Math.floor((Date.parse(occurredAt) - from) / DAY)
        if (
          !Number.isInteger(day) ||
          day < 0 ||
          day >= days ||
          seen.has(day) ||
          !Number.isSafeInteger(commitCount) ||
          commitCount < 1
        ) {
          throw new Error('GitHub returned an invalid daily commit count.')
        }

        seen.add(day)
        total += commitCount
        if (repository.visibility === 'PUBLIC') windowCounts[day] += commitCount
      }
    }

    if (incomplete || total !== reportedTotal) {
      if (days === 1)
        throw new Error('GitHub returned an incomplete day of commit activity.')
      const half = Math.floor(days / 2)
      await loadWindow(from, half)
      await loadWindow(from + half * DAY, days - half)
      return
    }

    counts.splice((from - start) / DAY, days, ...windowCounts)
  }

  try {
    for (let offset = 0; offset < DAYS; offset += WINDOW_DAYS) {
      await loadWindow(
        start + offset * DAY,
        Math.min(WINDOW_DAYS, DAYS - offset),
      )
    }
  } catch (error) {
    if (Date.now() < blockedUntil) throw new GitHubRateLimit(blockedUntil)
    throw error
  }

  const days: CommitDay[] = counts.map((count, index) => ({
    date: dateKey(start + index * DAY),
    count,
  }))
  return { days, ...summarizeCommits(days), retryAt: blockedUntil }
}

function summarizeCommits(days: CommitDay[]) {
  let totalCommits = 0
  let streak = 0
  let longestStreak = 0
  let currentStreak = 0

  for (const [index, { count }] of days.entries()) {
    totalCommits += count
    streak = count > 0 ? streak + 1 : 0
    longestStreak = Math.max(longestStreak, streak)
    // During the current UTC day, yesterday's streak can still continue.
    if (index < days.length - 1 || count > 0) currentStreak = streak
  }

  return { totalCommits, currentStreak, longestStreak }
}
