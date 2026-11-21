import { wait, type HeroWindow, type WindowAction } from './hero-window'

const SEQUENCE: readonly WindowAction[] = ['close', 'minimize', 'maximize']
const WINDOW_MS = 60_000
const VISIBLE_MS = 6_000
const STORAGE_KEY = 'hero-achievement:window-manager'

function alreadyUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markUnlocked() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Private modes may refuse storage; the toast can show again then.
  }
}

async function showToast(toast: HTMLElement, reduced: boolean) {
  toast.hidden = false
  if (!reduced) {
    toast.animate(
      [
        { opacity: 0, transform: 'translateY(0.75rem)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    )
  }
  await wait(VISIBLE_MS)
  if (!reduced) {
    await toast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240 }).finished
  }
  toast.hidden = true
}

/**
 * Unlocks "window manager" when a visitor closes, minimizes, then maximizes
 * the terminal within a minute. Fires once per session.
 */
export function trackWindowAchievement() {
  const recent: { action: WindowAction; at: number }[] = []

  return (action: WindowAction, win: HeroWindow) => {
    const now = Date.now()
    recent.push({ action, at: now })
    if (recent.length > SEQUENCE.length) recent.shift()

    const matched =
      recent.length === SEQUENCE.length &&
      recent.every((entry, index) => entry.action === SEQUENCE[index]) &&
      now - recent[0].at <= WINDOW_MS
    if (!matched || alreadyUnlocked()) return

    const toast = document.querySelector<HTMLElement>('[data-hero-achievement]')
    if (!toast) return
    markUnlocked()
    recent.length = 0
    win.announce('Achievement unlocked: window manager.')
    void showToast(toast, win.reducedMotion())
  }
}
