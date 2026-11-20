const DAY = 86_400_000
const DAYS = 365
const WEEK = 7
const WEEK_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const LEVEL_THRESHOLDS = [1, 3, 6, 10]

const number = new Intl.NumberFormat('en')
const month = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' })
const date = new Intl.DateTimeFormat('en', {
  dateStyle: 'full',
  timeZone: 'UTC',
})
const time = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

interface CommitDay {
  date: string
  count: number
}

interface CommitActivity {
  days: CommitDay[]
  totalCommits: number
  currentStreak: number
  longestStreak: number
  updatedAt: string
  stale: boolean
}

function parseActivity(value: unknown): CommitActivity {
  const activity = value as Partial<CommitActivity> | null
  const { days, totalCommits, currentStreak, longestStreak, updatedAt, stale } =
    activity ?? {}
  if (
    !Array.isArray(days) ||
    days.length !== DAYS ||
    ![totalCommits, currentStreak, longestStreak].every(isCount) ||
    typeof updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(updatedAt)) ||
    typeof stale !== 'boolean'
  ) {
    throw new Error('Invalid commit activity response.')
  }

  let previous = 0
  for (const [index, day] of days.entries()) {
    const timestamp = Date.parse(day?.date)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(day?.date) ||
      !Number.isFinite(timestamp) ||
      (index > 0 && timestamp !== previous + DAY) ||
      !isCount(day.count)
    ) {
      throw new Error('Invalid daily commit activity.')
    }
    previous = timestamp
  }
  return activity as CommitActivity
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function createRow() {
  const row = document.createElement('div')
  row.className = 'commit-row'
  row.setAttribute('role', 'row')
  return row
}

function renderCalendar(
  grid: HTMLElement,
  detail: HTMLElement,
  { days, totalCommits }: CommitActivity,
) {
  const firstWeekday = new Date(days[0].date).getUTCDay()
  const rows = WEEK_LABELS.map((label) => {
    const row = createRow()
    const weekday = document.createElement('span')
    weekday.className = 'commit-weekday'
    weekday.setAttribute('aria-hidden', 'true')
    weekday.textContent = label
    row.append(weekday)
    return row
  })
  const monthRow = createRow()
  monthRow.classList.add('commit-months')
  monthRow.setAttribute('aria-hidden', 'true')
  let previousMonth = -1
  let previousLabelWeek = -3
  const buttons = days.map((day, index) => {
    const timestamp = new Date(day.date)
    const offset = index + firstWeekday
    const weekday = offset % WEEK
    const week = Math.floor(offset / WEEK)
    const monthNumber = timestamp.getUTCMonth()

    if (monthNumber !== previousMonth) {
      if (week - previousLabelWeek >= 3) {
        const label = document.createElement('span')
        label.className = 'commit-month'
        label.textContent = month.format(timestamp)
        label.style.gridColumn = `${Math.min(week + 2, 53)} / span 2`
        monthRow.append(label)
        previousLabelWeek = week
      }
      previousMonth = monthNumber
    }

    const cell = document.createElement('div')
    cell.setAttribute('role', 'gridcell')
    cell.setAttribute('aria-colindex', String(week + 1))
    cell.style.gridColumnStart = String(week + 2)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'commit-day'
    button.tabIndex = -1
    button.dataset.level = String(
      LEVEL_THRESHOLDS.filter((threshold) => day.count >= threshold).length,
    )
    button.setAttribute(
      'aria-label',
      `${date.format(timestamp)} · ${number.format(day.count)} ${day.count === 1 ? 'commit' : 'commits'}`,
    )
    button.setAttribute('aria-pressed', 'false')
    cell.append(button)
    rows[weekday].append(cell)
    return button
  })

  let tabStop = buttons.length - 1
  let selection: HTMLButtonElement | undefined
  buttons[tabStop].tabIndex = 0
  grid.setAttribute(
    'aria-colcount',
    String(Math.ceil((DAYS + firstWeekday) / WEEK)),
  )
  grid.replaceChildren(monthRow, ...rows)

  const show = (button = selection) => {
    detail.textContent =
      button?.getAttribute('aria-label') ??
      (totalCommits === 0
        ? 'No public commits in this period.'
        : buttons[tabStop].getAttribute('aria-label'))
  }

  const setTabStop = (button: HTMLButtonElement) => {
    buttons[tabStop].tabIndex = -1
    button.tabIndex = 0
    tabStop = buttons.indexOf(button)
  }

  grid.addEventListener('focusin', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return
    setTabStop(event.target)
    show(event.target)
  })
  grid.addEventListener('pointerover', (event) => {
    if (event.target instanceof HTMLButtonElement) show(event.target)
  })
  grid.addEventListener('pointerout', (event) => {
    if (event.target instanceof HTMLButtonElement) show()
  })
  grid.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return
    setTabStop(event.target)
    selection?.setAttribute('aria-pressed', 'false')
    selection = selection === event.target ? undefined : event.target
    selection?.setAttribute('aria-pressed', 'true')
    show(event.target)
  })

  grid.addEventListener('keydown', (event) => {
    const weekday = (tabStop + firstWeekday) % WEEK
    const firstInRow = (weekday - firstWeekday + WEEK) % WEEK
    const lastInRow =
      firstInRow + Math.floor((DAYS - 1 - firstInRow) / WEEK) * WEEK
    const destinations: Record<string, number> = {
      ArrowLeft: tabStop - WEEK,
      ArrowRight: tabStop + WEEK,
      ArrowUp: tabStop - Number(weekday > 0),
      ArrowDown: tabStop + Number(weekday < WEEK - 1),
      Home: event.ctrlKey ? 0 : firstInRow,
      End: event.ctrlKey ? DAYS - 1 : lastInRow,
    }
    const next = destinations[event.key]
    if (next === undefined) return
    event.preventDefault()
    buttons[next]?.focus()
  })

  show()
}

export function mountGithubActivity(panel: HTMLElement) {
  const endpoint = panel.dataset.githubActivity
  const status = panel.querySelector<HTMLElement>('[data-commit-status]')
  const content = panel.querySelector<HTMLElement>('[data-commit-content]')
  const scroll = panel.querySelector<HTMLElement>('[data-commit-scroll]')
  const calendar = panel.querySelector<HTMLElement>('[data-commit-calendar]')
  const detail = panel.querySelector<HTMLElement>('[data-commit-detail]')
  const updated = panel.querySelector<HTMLTimeElement>('[data-commit-updated]')
  if (
    !endpoint ||
    !status ||
    !content ||
    !scroll ||
    !calendar ||
    !detail ||
    !updated
  )
    return

  const load = async () => {
    status.textContent = 'Loading GitHub commit activity…'

    try {
      const response = await fetch(endpoint, {
        credentials: 'omit',
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) throw new Error('Commit activity is unavailable.')
      const activity = parseActivity(await response.json())
      renderCalendar(calendar, detail, activity)

      const text = {
        'total-commits': number.format(activity.totalCommits),
        'current-streak': number.format(activity.currentStreak),
        'longest-streak': number.format(activity.longestStreak),
        'current-unit': activity.currentStreak === 1 ? 'day' : 'days',
        'longest-unit': activity.longestStreak === 1 ? 'day' : 'days',
        'commit-freshness': activity.stale
          ? 'Showing cached data · Updated'
          : 'Updated',
      }
      for (const [key, value] of Object.entries(text)) {
        const target = panel.querySelector<HTMLElement>(`[data-${key}]`)
        if (target) target.textContent = value
      }
      updated.dateTime = activity.updatedAt
      updated.textContent = time.format(new Date(activity.updatedAt))

      status.hidden = true
      content.hidden = false
      scroll.scrollLeft = scroll.scrollWidth
    } catch {
      status.textContent =
        'Commit activity is temporarily unavailable. View the profile on GitHub.'
    }
  }

  if (!('IntersectionObserver' in window)) {
    void load()
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        void load()
      }
    },
    { rootMargin: '240px' },
  )
  observer.observe(panel)
}
