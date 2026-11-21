import { adminFetch, byId, mountAdminShell } from '../admin-shell'
import {
  formatDateTime,
  isPostStatus,
  STATUS_LABELS,
  type AdminPostSummary,
  type PostList,
  type PostStatus,
} from './post-types'

const loading = byId('posts-loading')
const error = byId('posts-error')
const retry = byId<HTMLButtonElement>('posts-retry')
const empty = byId('posts-empty')
const emptyMessage = byId('posts-empty-message')
const emptyAction = byId('posts-empty-action')
const table = byId<HTMLTableElement>('posts-table')
const rows = byId<HTMLTableSectionElement>('posts-rows')
const filters = [
  ...document.querySelectorAll<HTMLButtonElement>('[data-filter]'),
]

let list: PostList | undefined
let filter: PostStatus | undefined = readFilter()

function readFilter() {
  const value = new URLSearchParams(location.search).get('status')
  return isPostStatus(value) ? value : undefined
}

function show(panel: HTMLElement) {
  for (const element of [loading, error, empty, table]) {
    element.hidden = element !== panel
  }
}

function statusBadge(status: PostStatus) {
  const badge = document.createElement('span')
  badge.className = 'post-status'
  badge.dataset.status = status
  badge.textContent = STATUS_LABELS[status]
  return badge
}

function cell(...children: (Node | string)[]) {
  const td = document.createElement('td')
  td.append(...children)
  return td
}

function time(iso: string | null, fallback = '—') {
  if (!iso) return fallback
  const element = document.createElement('time')
  element.dateTime = iso
  element.textContent = formatDateTime(iso)
  return element
}

function row(post: AdminPostSummary) {
  const tr = document.createElement('tr')
  const link = document.createElement('a')
  link.className = 'post-title-link'
  link.href = `/admin/posts/edit/?id=${post.id}`
  link.textContent = post.title
  const slug = document.createElement('span')
  slug.className = 'post-slug'
  slug.textContent = `~/blog/${post.slug}`

  tr.append(
    cell(statusBadge(post.status)),
    cell(link, slug),
    cell(time(post.publishedAt)),
    cell(time(post.updatedAt)),
  )
  for (const [index, label] of ['Status', 'Title', 'Publish date', 'Updated'].entries()) {
    tr.children[index].setAttribute('data-label', label)
  }
  return tr
}

function render() {
  if (!list) return
  for (const button of filters) {
    const value = button.dataset.filter || undefined
    button.setAttribute('aria-pressed', String(value === filter))
  }
  for (const count of document.querySelectorAll<HTMLElement>('[data-count]')) {
    const key = count.dataset.count!
    count.textContent = String(
      key === 'all'
        ? list.posts.length
        : isPostStatus(key)
          ? list.counts[key]
          : 0,
    )
  }

  const visible = filter
    ? list.posts.filter((post) => post.status === filter)
    : list.posts
  if (visible.length === 0) {
    emptyMessage.textContent = filter
      ? `No ${STATUS_LABELS[filter].toLowerCase()} posts.`
      : 'No posts yet. Start with your first draft.'
    emptyAction.hidden = Boolean(filter)
    show(empty)
    return
  }
  rows.replaceChildren(...visible.map(row))
  show(table)
}

async function load() {
  show(loading)
  try {
    const response = await adminFetch('/admin/api/posts')
    if (!response.ok) throw new Error('Post list failed')
    list = (await response.json()) as PostList
    render()
  } catch {
    show(error)
  }
}

for (const button of filters) {
  button.addEventListener('click', () => {
    const value = button.dataset.filter
    filter = isPostStatus(value) ? value : undefined
    const url = new URL(location.href)
    if (filter) url.searchParams.set('status', filter)
    else url.searchParams.delete('status')
    history.replaceState(null, '', url)
    render()
  })
}
retry.addEventListener('click', load)

mountAdminShell({ onReady: load })
