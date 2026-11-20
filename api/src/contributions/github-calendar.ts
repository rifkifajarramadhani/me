const GITHUB_LOGIN = 'rifkifajarramadhani'
const DAY = 86_400_000
const LEVELS = [
  'NONE',
  'FIRST_QUARTILE',
  'SECOND_QUARTILE',
  'THIRD_QUARTILE',
  'FOURTH_QUARTILE',
]

interface CalendarDay {
  date: string
  contributionCount: number
  contributionLevel: string
}

interface ContributionCalendar {
  totalContributions: number
  weeks: { contributionDays: CalendarDay[] }[]
}

interface CalendarResponse {
  data?: {
    user: {
      contributionsCollection: { contributionCalendar: ContributionCalendar }
    } | null
  }
  errors?: unknown[]
}

// Let GitHub choose the date window used on the profile, including any partial week.
const query = `query ProfileCalendar($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`

export class GitHubRateLimit extends Error {
  constructor(readonly retryAt: number) {
    super('GitHub asked to delay contribution requests.')
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

export async function fetchGitHubCalendar(token: string) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { login: GITHUB_LOGIN } }),
    redirect: 'error',
    signal: AbortSignal.timeout(8_000),
  })
  const blockedUntil = retryAt(response.headers)

  try {
    if (!response.ok) throw new Error('GitHub contribution query failed.')

    const payload: CalendarResponse | null = await response.json()
    const calendar =
      payload?.data?.user?.contributionsCollection?.contributionCalendar
    if (payload?.errors?.length || !calendar) {
      throw new Error('GitHub contribution query returned no usable data.')
    }

    return { ...summarizeCalendar(calendar), retryAt: blockedUntil }
  } catch (error) {
    if (Date.now() < blockedUntil) throw new GitHubRateLimit(blockedUntil)
    throw error
  }
}

function summarizeCalendar({
  totalContributions,
  weeks,
}: ContributionCalendar) {
  const daily = weeks.flatMap(({ contributionDays }) => contributionDays)
  let previous: number | undefined
  let total = 0
  let streak = 0
  let longestStreak = 0
  let currentStreak = 0

  const days = daily.map(
    ({ date, contributionCount: count, contributionLevel }, index) => {
      const timestamp = Date.parse(date)
      const level = LEVELS.indexOf(contributionLevel)
      if (
        !Number.isFinite(timestamp) ||
        new Date(timestamp).toISOString().slice(0, 10) !== date ||
        (previous !== undefined && timestamp !== previous + DAY) ||
        !Number.isSafeInteger(count) ||
        count < 0 ||
        level < 0 ||
        (count === 0) !== (level === 0)
      ) {
        throw new Error('GitHub returned an invalid daily contribution count.')
      }

      previous = timestamp
      total += count
      streak = count > 0 ? streak + 1 : 0
      longestStreak = Math.max(longestStreak, streak)
      // The last calendar day is still in progress.
      if (index < daily.length - 1 || count > 0) currentStreak = streak
      return { date, count, level }
    },
  )

  if (days.length < 365 || days.length > 373 || total !== totalContributions) {
    throw new Error('GitHub returned an incomplete contribution calendar.')
  }

  return { days, totalContributions, currentStreak, longestStreak }
}
