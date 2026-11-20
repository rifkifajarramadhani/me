require('reflect-metadata')

const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createApp } = require('../dist/app')
const { GitHubActivity } = require('../dist/contributions/github-activity')
const { fetchGitHubCalendar } = require('../dist/contributions/github-calendar')

const HOUR = 3_600_000
const NOW = Date.parse('2024-03-01T12:00:00Z')
const token = 'public-read-test-token'

function calendar(entries = {}, { gap = false, total } = {}) {
  const firstDay = Date.parse('2023-02-26T00:00:00Z')
  const days = Array.from({ length: 370 }, (_, index) => {
    const date = new Date(firstDay + index * 86_400_000)
      .toISOString()
      .slice(0, 10)
    const count = entries[date] ?? 0
    return {
      date,
      contributionCount: count,
      contributionLevel: count > 0 ? 'FOURTH_QUARTILE' : 'NONE',
    }
  })
  if (gap) days.splice(20, 1)
  const weeks = []
  for (let index = 0; index < days.length; index += 7) {
    weeks.push({ contributionDays: days.slice(index, index + 7) })
  }

  return Response.json({
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions:
              total ??
              days.reduce((sum, day) => sum + day.contributionCount, 0),
            weeks,
          },
        },
      },
    },
  })
}

function stubGitHub(t, respond) {
  return t.mock.method(globalThis, 'fetch', (url, options) => {
    assert.equal(url, 'https://api.github.com/graphql')
    assert.equal(options.headers.Authorization, `Bearer ${token}`)
    assert.ok(options.signal instanceof AbortSignal)
    const { query, variables } = JSON.parse(options.body)
    assert.match(query, /contributionCalendar/)
    assert.doesNotMatch(
      query,
      /commitContributionsByRepository|repository\s*\{/,
    )
    assert.deepEqual(variables, { login: 'rifkifajarramadhani' })
    return respond(variables, options.signal)
  })
}

function configure(t, githubToken = token) {
  const oldToken = process.env.GITHUB_CONTRIBUTIONS_TOKEN
  process.env.GITHUB_CONTRIBUTIONS_TOKEN = githubToken
  t.after(() => {
    if (oldToken === undefined) delete process.env.GITHUB_CONTRIBUTIONS_TOKEN
    else process.env.GITHUB_CONTRIBUTIONS_TOKEN = oldToken
  })
}

test('uses all profile contributions and keeps the streak through yesterday across leap day', async (t) => {
  const provider = stubGitHub(t, () =>
    calendar({
      '2023-02-26': 2,
      '2024-02-26': 2,
      '2024-02-28': 14,
      '2024-02-29': 1,
    }),
  )

  const data = await fetchGitHubCalendar(token)
  assert.equal(data.days.length, 370)
  assert.equal(data.days[0].date, '2023-02-26')
  assert.deepEqual(data.days.slice(-4), [
    { date: '2024-02-27', count: 0, level: 0 },
    { date: '2024-02-28', count: 14, level: 4 },
    { date: '2024-02-29', count: 1, level: 4 },
    { date: '2024-03-01', count: 0, level: 0 },
  ])
  assert.equal(data.totalContributions, 19)
  assert.equal(data.longestStreak, 2)
  assert.equal(data.currentStreak, 2)
  assert.equal(provider.mock.callCount(), 1)
})

test('rejects a calendar with a missing date or a mismatched total', async (t) => {
  stubGitHub(t, () => calendar({}, { gap: true }))
  await assert.rejects(fetchGitHubCalendar(token), /invalid daily contribution/)
  t.mock.restoreAll()
  stubGitHub(t, () => calendar({}, { total: 1 }))
  await assert.rejects(
    fetchGitHubCalendar(token),
    /incomplete contribution calendar/,
  )
})

test('shares a cold refresh and serves stale data through a rate-limit cooldown', async (t) => {
  configure(t)
  t.mock.timers.enable({ apis: ['Date'], now: NOW })
  const activity = new GitHubActivity()
  const provider = stubGitHub(t, () => calendar())

  const snapshots = await Promise.all(
    Array.from({ length: 8 }, () => activity.get()),
  )
  assert.equal(provider.mock.callCount(), 1)
  assert.deepEqual(snapshots[0], snapshots.at(-1))
  assert.equal(snapshots[0].stale, false)
  assert.equal(snapshots[0].totalContributions, 0)
  assert.equal(snapshots[0].longestStreak, 0)
  assert.equal(snapshots[0].currentStreak, 0)
  t.mock.timers.tick(HOUR - 1)
  await activity.get()
  assert.equal(provider.mock.callCount(), 1)

  t.mock.restoreAll()
  const limited = stubGitHub(t, () =>
    Response.json(
      { errors: [{ type: 'RATE_LIMITED' }] },
      {
        headers: {
          'retry-after': '7200',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String((Date.now() + 3 * HOUR) / 1000),
        },
      },
    ),
  )
  t.mock.timers.tick(1)
  for (const result of await Promise.all([activity.get(), activity.get()])) {
    assert.equal(result.stale, true)
    assert.equal(result.updatedAt, snapshots[0].updatedAt)
  }
  // Let the detached refresh finish reading the GraphQL error before advancing the clock.
  await new Promise(setImmediate)
  t.mock.timers.tick(2.5 * HOUR)
  assert.equal((await activity.get()).stale, true)
  assert.equal(limited.mock.callCount(), 1)

  t.mock.restoreAll()
  const recovered = stubGitHub(t, () => calendar())
  t.mock.timers.tick(21.5 * HOUR)
  const snapshot = await activity.get()
  assert.equal(snapshot.stale, false)
  assert.notEqual(snapshot.updatedAt, snapshots[0].updatedAt)
  assert.equal(recovered.mock.callCount(), 1)
})

test('backs off after a cold failure and does not expose upstream errors', async (t) => {
  configure(t)
  t.mock.timers.enable({ apis: ['Date'], now: NOW })
  const activity = new GitHubActivity()
  const provider = stubGitHub(t, () => {
    throw new DOMException('Timeout with provider details', 'TimeoutError')
  })
  assert.equal(await activity.get(), null)
  assert.equal(await activity.get(), null)
  assert.equal(provider.mock.callCount(), 1)
})

test('serves the public endpoint and handles missing configuration without calling GitHub', async (t) => {
  Object.assign(process.env, {
    CMS_ORIGIN: 'https://cms.example.test',
    CMS_GITHUB_CLIENT_ID: 'test-client',
    CMS_GITHUB_CLIENT_SECRET: 'test-secret',
    CMS_GITHUB_OWNER_ID: '157324525',
  })
  const request = globalThis.fetch
  const provider = stubGitHub(t, () => calendar())
  const path = '/api/github/contributions'

  async function openApp() {
    const app = await createApp(false)
    t.after(() => app.close())
    await app.listen(0, '127.0.0.1')
    return app.getUrl()
  }

  configure(t, '')
  const unavailable = await request(`${await openApp()}${path}`)
  assert.equal(unavailable.status, 503)
  assert.equal(unavailable.headers.get('cache-control'), 'no-store')
  assert.equal(provider.mock.callCount(), 0)

  process.env.GITHUB_CONTRIBUTIONS_TOKEN = token
  const available = await request(`${await openApp()}${path}`)
  assert.equal(available.status, 200)
  assert.equal(available.headers.get('cache-control'), 'no-store')
  const snapshot = await available.json()
  assert.equal(snapshot.days.length, 370)
  assert.equal(snapshot.stale, false)
  assert.doesNotMatch(
    JSON.stringify(snapshot),
    /public-read-test-token|repository|retryAt/,
  )
})
