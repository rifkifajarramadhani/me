import { adminFetch, byId, mountAdminShell } from './admin-shell'
import {
  formatDateTime,
  POST_STATUSES,
  STATUS_LABELS,
  type AdminPostSummary,
  type PostList,
} from './posts/post-types'

const heading = byId('dashboard-posts-title')
const loading = byId('dashboard-posts-loading')
const error = byId('dashboard-posts-error')
const retry = byId<HTMLButtonElement>('dashboard-posts-retry')
const results = byId('dashboard-posts-results')
const total = byId('dashboard-post-total')
const empty = byId('dashboard-posts-empty')
const recent = byId('dashboard-recent-posts')
const rows = byId('dashboard-post-rows')
const template = byId<HTMLTemplateElement>('dashboard-post-template')
const counts = POST_STATUSES.map((status) => ({
  status,
  element: results.querySelector<HTMLElement>(
    `[data-dashboard-post-count="${status}"]`,
  )!,
}))
const recentLimit = 5

let latestRequest = 0

function show(panel: HTMLElement) {
  loading.hidden = panel !== loading
  error.hidden = panel !== error
  results.hidden = panel !== results
  total.hidden = results.hidden
}

function postRow(post: AdminPostSummary) {
  const row = template.content.cloneNode(true) as DocumentFragment
  const link = row.querySelector('a')!
  const status = row.querySelector<HTMLElement>('.post-status')!
  const updated = row.querySelector('time')!

  link.href = `/admin/posts/edit/?id=${post.id}`
  link.textContent = post.title
  status.dataset.status = post.status
  status.textContent = STATUS_LABELS[post.status]
  updated.dateTime = post.updatedAt
  updated.textContent = formatDateTime(post.updatedAt)
  return row
}

function render(list: PostList) {
  const latest = list.posts
    .toSorted(
      (a, b) =>
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || b.id - a.id,
    )
    .slice(0, recentLimit)

  rows.replaceChildren(...latest.map(postRow))
  total.textContent = `(${list.posts.length})`
  for (const { status, element } of counts) {
    element.textContent = String(list.counts[status])
  }
  recent.hidden = latest.length === 0
  empty.hidden = !recent.hidden
}

async function load() {
  const request = ++latestRequest
  const restoreFocus = document.activeElement === retry
  show(loading)
  try {
    const response = await adminFetch('/admin/api/posts')
    if (!response.ok) throw new Error('Post list failed')
    const list = (await response.json()) as PostList
    if (request !== latestRequest) return
    render(list)
    show(results)
  } catch {
    if (request !== latestRequest) return
    show(error)
  }
  if (restoreFocus && document.activeElement === document.body) {
    const target = error.hidden ? heading : retry
    target.focus()
  }
}

retry.addEventListener('click', load)
mountAdminShell({ onReady: load })
