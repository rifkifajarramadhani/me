import { Injectable, Logger } from '@nestjs/common'
import { fetchGitHubCalendar, GitHubRateLimit } from './github-calendar'

const HOUR = 3_600_000
const MAX_AGE = 24 * HOUR

type Snapshot = Omit<
  Awaited<ReturnType<typeof fetchGitHubCalendar>>,
  'retryAt'
> & {
  updatedAt: string
}

@Injectable()
export class GitHubActivity {
  private readonly token = process.env.GITHUB_CONTRIBUTIONS_TOKEN?.trim()
  private readonly logger = new Logger(GitHubActivity.name)
  private snapshot?: Snapshot
  private savedAt = 0
  private nextRefresh = 0
  private refreshing?: Promise<void>

  async get() {
    if (!this.token) return null

    const now = Date.now()
    if (!this.refreshing && now >= this.nextRefresh) {
      this.refreshing = this.refresh(this.token).finally(() => {
        this.refreshing = undefined
      })
    }

    if (!this.snapshot || now - this.savedAt >= MAX_AGE) await this.refreshing
    const age = Date.now() - this.savedAt
    if (!this.snapshot || age >= MAX_AGE) return null
    return { ...this.snapshot, stale: age >= HOUR }
  }

  private async refresh(token: string) {
    try {
      const { retryAt, ...data } = await fetchGitHubCalendar(token)
      this.savedAt = Date.now()
      this.nextRefresh = Math.max(this.savedAt + HOUR, retryAt)
      this.snapshot = {
        ...data,
        updatedAt: new Date(this.savedAt).toISOString(),
      }
    } catch (error) {
      const retryAt = error instanceof GitHubRateLimit ? error.retryAt : 0
      this.nextRefresh = Math.max(Date.now() + HOUR, retryAt)
      this.logger.warn(
        retryAt
          ? 'GitHub contribution activity is rate limited.'
          : 'GitHub contribution activity refresh failed.',
      )
    }
  }
}
