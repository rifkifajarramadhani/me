import { Editor } from '@tiptap/core'
import { adminFetch, byId, mountAdminShell } from '../admin-shell'
import { editorExtensions } from './editor-extensions'
import { mountLinkDialog } from './link-dialog'
import {
  errorMessage,
  formatDateTime,
  STATUS_LABELS,
  type AdminPost,
} from './post-types'
import { mountStatusActions } from './status-actions'
import { mountToolbar } from './toolbar'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const WORDS_PER_MINUTE = 220
const savedTime = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' })

const heading = byId('page-title')
const loading = byId('editor-loading')
const loadError = byId('editor-load-error')
const loadMessage = byId('editor-load-message')
const retry = byId<HTMLButtonElement>('editor-retry')
const form = byId<HTMLFormElement>('post-form')
const title = byId<HTMLInputElement>('post-title')
const slug = byId<HTMLInputElement>('post-slug')
const slugHint = byId('post-slug-hint')
const excerpt = byId<HTMLTextAreaElement>('post-excerpt')
const toolbar = byId('post-toolbar')
const content = byId('post-content')
const statusBadge = byId('post-status-badge')
const statusDetail = byId('post-status-detail')
const saveButton = byId<HTMLButtonElement>('post-save')
const formError = byId('post-form-error')
const statuslineMode = byId('statusline-mode')
const statuslinePath = byId('statusline-path')
const statuslineCount = byId('statusline-count')
const statuslineSave = byId('statusline-save')

let editor: Editor | undefined
let post: AdminPost | undefined
let savedSnapshot = ''
let savedAt: Date | undefined
let slugEdited = false
let busy = false

const linkDialog = mountLinkDialog(() => editor)

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 80)
    .replace(/^-+|-+$/g, '')
}

function snapshot() {
  return JSON.stringify({
    title: title.value.trim(),
    slug: slug.value,
    excerpt: excerpt.value.trim(),
    content: editor?.getJSON(),
  })
}

function isDirty() {
  return Boolean(editor) && snapshot() !== savedSnapshot
}

function wordCount() {
  const text = editor?.getText({ blockSeparator: '\n\n' }) ?? ''
  return text.split(/\s+/u).filter(Boolean).length
}

function updateStatusline() {
  const words = wordCount()
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
  statuslinePath.textContent = `~/blog/${slug.value}`
  statuslineCount.textContent = `${words} ${words === 1 ? 'word' : 'words'} · ${minutes} min read`
  if (busy) return
  statuslineSave.textContent = isDirty()
    ? 'Unsaved changes'
    : savedAt
      ? `Saved at ${savedTime.format(savedAt)}`
      : post
        ? 'No changes'
        : 'Not saved yet'
  statuslineSave.dataset.dirty = String(isDirty())
}

function statusDescription(current: AdminPost | undefined) {
  if (!current || current.status === 'draft') return 'Only you can see drafts.'
  const when = current.publishedAt ? formatDateTime(current.publishedAt) : ''
  switch (current.status) {
    case 'scheduled':
      return `Goes live ${when}.`
    case 'published':
      return `Live on the blog since ${when}.`
    case 'archived':
      return 'Hidden from the blog. The content is kept.'
  }
}

/** Reflects the saved post in the form chrome. */
function showPost(current: AdminPost) {
  post = current
  const status = current.status
  heading.lastChild!.textContent = ' Edit post'
  statusBadge.dataset.status = status
  statusBadge.textContent = STATUS_LABELS[status]
  statuslineMode.dataset.status = status
  statuslineMode.textContent = STATUS_LABELS[status]
  statusDetail.textContent = statusDescription(current)
  saveButton.textContent = status === 'draft' ? 'Save draft' : 'Save changes'
  slug.readOnly = current.slugLocked
  slugHint.textContent = current.slugLocked
    ? 'Locked after publishing so existing links keep working.'
    : 'Lowercase letters, numbers, and hyphens.'
  statusActions.render()
  updateStatusline()
}

function showFormError(message: string) {
  formError.textContent = message
  formError.hidden = !message
}

function setBusy(label: string | false) {
  busy = Boolean(label)
  saveButton.disabled = busy
  form.setAttribute('aria-busy', String(busy))
  if (label) statuslineSave.textContent = label
  else updateStatusline()
}

function validate() {
  if (!title.value.trim()) {
    title.focus()
    return 'Add a title.'
  }
  if (slug.value && !SLUG.test(slug.value)) {
    slug.focus()
    return 'Slug must use lowercase letters, numbers, and single hyphens.'
  }
  return ''
}

/** Saves the form. Resolves to the saved post, or undefined on failure. */
async function save(): Promise<AdminPost | undefined> {
  if (!editor || busy) return undefined
  const problem = validate()
  showFormError(problem)
  if (problem) return undefined

  const requestSnapshot = snapshot()
  const body = {
    title: title.value.trim(),
    slug: slug.value || undefined,
    excerpt: excerpt.value.trim(),
    content: editor.getJSON(),
    ...(post && { updatedAt: post.updatedAt }),
  }
  setBusy('Saving…')
  try {
    const response = await adminFetch(
      post ? `/admin/api/posts/${post.id}` : '/admin/api/posts',
      { method: post ? 'PUT' : 'POST', body: JSON.stringify(body) },
    )
    if (!response.ok) {
      showFormError(await errorMessage(response, 'Could not save the post. Try again.'))
      return undefined
    }
    const saved = (await response.json()) as AdminPost
    if (!post) history.replaceState(null, '', `?id=${saved.id}`)
    // Edits made while the request was in flight stay unsaved.
    const unchanged = snapshot() === requestSnapshot
    slug.value = saved.slug
    savedSnapshot = unchanged ? snapshot() : requestSnapshot
    savedAt = new Date()
    showPost(saved)
    return saved
  } catch {
    showFormError('Could not reach the CMS. Check your connection and try again.')
    return undefined
  } finally {
    setBusy(false)
  }
}

async function exclusive<T>(label: string, task: () => Promise<T>) {
  if (busy) return undefined
  setBusy(label)
  try {
    return await task()
  } finally {
    setBusy(false)
  }
}

const statusActions = mountStatusActions({
  current: () => post,
  saveIfNeeded: async () => (!post || isDirty() ? save() : post),
  exclusive,
  apply: showPost,
  showError: showFormError,
  discard() {
    savedSnapshot = snapshot()
  },
})

function createEditor(document: AdminPost['content'] | undefined) {
  editor = new Editor({
    element: content,
    extensions: editorExtensions,
    content: document ?? '',
    injectCSS: false,
    editorProps: {
      attributes: {
        class: 'prose-post post-prosemirror',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': 'post-content-label',
      },
      handleKeyDown(_view, event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault()
          linkDialog.open()
          return true
        }
        return false
      },
    },
    onUpdate: updateStatusline,
  })
  mountToolbar(toolbar, editor, { openLink: linkDialog.open })
}

async function load() {
  const id = Number(new URLSearchParams(location.search).get('id'))
  loading.hidden = false
  loadError.hidden = true
  form.hidden = true

  let existing: AdminPost | undefined
  if (id) {
    try {
      const response = await adminFetch(`/admin/api/posts/${id}`)
      if (response.status === 404 || response.status === 400) {
        loadMessage.textContent = 'This post no longer exists.'
        retry.hidden = true
        throw new Error('Missing post')
      }
      if (!response.ok) throw new Error('Post lookup failed')
      existing = (await response.json()) as AdminPost
    } catch {
      loading.hidden = true
      loadError.hidden = false
      return
    }
  }

  if (!editor) createEditor(existing?.content)
  else editor.commands.setContent(existing?.content ?? '')
  title.value = existing?.title ?? ''
  slug.value = existing?.slug ?? ''
  excerpt.value = existing?.excerpt ?? ''
  slugEdited = Boolean(existing)
  savedSnapshot = snapshot()
  if (existing) showPost(existing)
  else updateStatusline()

  loading.hidden = true
  form.hidden = false
  if (!existing) title.focus()
}

title.addEventListener('input', () => {
  if (!slugEdited && !slug.readOnly) slug.value = slugify(title.value)
  updateStatusline()
})
slug.addEventListener('input', () => {
  slugEdited = slug.value !== ''
  updateStatusline()
})
excerpt.addEventListener('input', updateStatusline)
form.addEventListener('submit', (event) => {
  event.preventDefault()
  void save()
})
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    if (!form.hidden) void save()
  }
})
window.addEventListener('beforeunload', (event) => {
  if (isDirty()) event.preventDefault()
})
retry.addEventListener('click', load)

mountAdminShell({ onReady: load })
