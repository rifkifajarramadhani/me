import { adminFetch, byId } from '../admin-shell'
import {
  errorMessage,
  formatDateTime,
  type AdminPost,
  type PostStatus,
} from './post-types'

export interface StatusActionHost {
  /** The saved post, or undefined before the first save. */
  current(): AdminPost | undefined
  /** Saves pending edits first; resolves to undefined if saving failed. */
  saveIfNeeded(): Promise<AdminPost | undefined>
  /** Runs one request at a time, showing `label` in the status line. */
  exclusive<T>(label: string, task: () => Promise<T>): Promise<T | undefined>
  apply(post: AdminPost): void
  showError(message: string): void
  /** Called after a delete, before leaving the page. */
  discard(): void
}

interface Action {
  label: string
  /** Status-line text while the request runs. */
  progress: string
  /** Confirmation once it lands; the action's own name in the past tense. */
  done: (post: AdminPost) => string
}

function actionFor(from: PostStatus, to: PostStatus): Action {
  switch (to) {
    case 'published':
      return from === 'archived'
        ? { label: 'Restore to blog', progress: 'Restoring…', done: () => 'Restored to the blog.' }
        : { label: 'Publish now', progress: 'Publishing…', done: () => 'Published.' }
    case 'scheduled':
      return {
        label: 'Schedule…',
        progress: 'Scheduling…',
        done: (post) => `Scheduled for ${formatDateTime(post.publishedAt!)}.`,
      }
    case 'draft':
      return from === 'scheduled'
        ? { label: 'Cancel schedule', progress: 'Cancelling…', done: () => 'Schedule cancelled. The post is a draft again.' }
        : from === 'archived'
          ? { label: 'Move to drafts', progress: 'Moving…', done: () => 'Moved to drafts.' }
          : { label: 'Unpublish', progress: 'Unpublishing…', done: () => 'Unpublished. The post is a draft again.' }
    case 'archived':
      return { label: 'Archive', progress: 'Archiving…', done: () => 'Archived.' }
  }
}

/** `datetime-local` value for a date, in the browser's time zone. */
function localInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function mountStatusActions(host: StatusActionHost) {
  const container = byId('post-status-actions')
  const notice = byId('post-action-notice')
  const scheduleForm = byId('schedule-form')
  const scheduleAt = byId<HTMLInputElement>('schedule-at')
  const scheduleZone = byId('schedule-zone')
  const scheduleConfirm = byId<HTMLButtonElement>('schedule-confirm')
  const scheduleCancel = byId<HTMLButtonElement>('schedule-cancel')
  const deleteDialog = byId<HTMLDialogElement>('delete-dialog')
  const deleteTitle = byId('delete-post-title')
  const deleteConfirm = byId<HTMLButtonElement>('delete-confirm')
  const deleteCancel = byId<HTMLButtonElement>('delete-cancel')
  let scheduleTrigger: HTMLButtonElement | undefined

  scheduleZone.textContent = `Your time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`

  async function changeStatus(to: PostStatus, publishAt?: string) {
    notice.textContent = ''
    host.showError('')
    const saved = await host.saveIfNeeded()
    if (!saved) return
    const action = actionFor(saved.status, to)
    await host.exclusive(action.progress, async () => {
      try {
        const response = await adminFetch(`/admin/api/posts/${saved.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: to, publishAt, updatedAt: saved.updatedAt }),
        })
        if (!response.ok) {
          host.showError(await errorMessage(response, 'Could not change the status. Try again.'))
          return
        }
        const updated = (await response.json()) as AdminPost
        scheduleForm.hidden = true
        host.apply(updated)
        notice.textContent = action.done(updated)
      } catch {
        host.showError('Could not reach the CMS. Check your connection and try again.')
      }
    })
  }

  function openSchedule(trigger: HTMLButtonElement) {
    scheduleTrigger = trigger
    const soon = new Date(Date.now() + 60 * 60_000)
    soon.setMinutes(0, 0, 0)
    scheduleAt.min = localInputValue(new Date())
    scheduleAt.value ||= localInputValue(soon)
    scheduleForm.hidden = false
    scheduleAt.focus()
  }

  scheduleConfirm.addEventListener('click', () => {
    const when = scheduleAt.value ? new Date(scheduleAt.value) : undefined
    if (!when || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      host.showError('Choose a publish time in the future.')
      scheduleAt.focus()
      return
    }
    void changeStatus('scheduled', when.toISOString())
  })
  scheduleCancel.addEventListener('click', () => {
    scheduleForm.hidden = true
    scheduleTrigger?.focus()
  })

  deleteCancel.addEventListener('click', () => deleteDialog.close())
  deleteConfirm.addEventListener('click', async () => {
    const post = host.current()
    if (!post) return
    deleteDialog.close()
    await host.exclusive('Deleting…', async () => {
      try {
        const query = new URLSearchParams({ updatedAt: post.updatedAt })
        const response = await adminFetch(`/admin/api/posts/${post.id}?${query}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          host.showError(await errorMessage(response, 'Could not delete the post. Try again.'))
          return
        }
        host.discard()
        location.replace('/admin/posts/')
      } catch {
        host.showError('Could not reach the CMS. Check your connection and try again.')
      }
    })
  })

  function button(label: string, onClick: (button: HTMLButtonElement) => void, className = '') {
    const element = document.createElement('button')
    element.type = 'button'
    element.textContent = label
    if (className) element.className = className
    element.addEventListener('click', () => onClick(element))
    return element
  }

  /** Shows the actions the post's current status allows. */
  function render() {
    const post = host.current()
    // A new post can be published or scheduled; it saves first.
    const status = post?.status ?? 'draft'
    const next: readonly PostStatus[] = post?.nextStatuses ?? ['published', 'scheduled']
    const buttons = next.map((to) =>
      button(actionFor(status, to).label, (trigger) =>
        to === 'scheduled' ? openSchedule(trigger) : void changeStatus(to),
      ),
    )
    if (post?.deletable) {
      buttons.push(
        button(
          'Delete post',
          () => {
            deleteTitle.textContent = post.title
            deleteDialog.showModal()
          },
          'post-danger-quiet',
        ),
      )
    }
    container.replaceChildren(...buttons)
    if (!next.includes('scheduled')) scheduleForm.hidden = true
  }

  render()
  return { render }
}
