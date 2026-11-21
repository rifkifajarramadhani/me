export type WindowAction = 'close' | 'minimize' | 'maximize'

/** Every state but `open` disables the controls so actions never overlap. */
export type WindowState = 'open' | 'busy' | 'minimized' | 'maximized'

export interface HeroWindow {
  readonly root: HTMLElement
  readonly terminal: HTMLElement
  readonly controls: Readonly<Record<WindowAction, HTMLButtonElement>>
  reducedMotion(): boolean
  setState(next: WindowState): void
  /** Sends a message to the polite screen-reader status region. */
  announce(message: string): void
}

/**
 * Runs one action's whole cycle, such as minimize through restore. The window
 * stays `busy` (or whatever the handler sets) until the promise settles, then
 * returns to `open` and focuses the returned element, or the action's button.
 */
export type WindowActionHandler = (
  win: HeroWindow,
) => Promise<HTMLElement | void>

const ACTIONS: readonly WindowAction[] = ['close', 'minimize', 'maximize']
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

export const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/** The transform that moves and scales the `from` box onto the `to` box. */
export function mapRect(from: DOMRect, to: DOMRect) {
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const sx = Math.max(to.width / from.width, 0.02)
  const sy = Math.max(to.height / from.height, 0.02)
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
}

/** Plays a Web Animation and resolves once it finishes or is cancelled. */
export async function play(
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) {
  const animation = element.animate(keyframes, options)
  try {
    await animation.finished
  } catch {
    // A cancelled animation rejects; the caller has already moved on.
  }
  return animation
}

export function mountHeroWindow(
  root: HTMLElement,
  handlers: Partial<Record<WindowAction, WindowActionHandler>>,
) {
  const terminal = root.querySelector<HTMLElement>('[data-hero-terminal]')
  const buttons = ACTIONS.map((action) =>
    root.querySelector<HTMLButtonElement>(`[data-window-action="${action}"]`),
  )
  if (!terminal || buttons.some((button) => !button)) return

  const [close, minimize, maximize] = buttons as HTMLButtonElement[]
  const status = root.querySelector<HTMLElement>('[data-hero-status]')
  let state: WindowState = 'open'
  const setState = (next: WindowState) => {
    state = next
    root.dataset.windowState = next
    for (const button of [close, minimize, maximize]) {
      button.disabled = next !== 'open'
    }
  }

  const win: HeroWindow = {
    root,
    terminal,
    controls: { close, minimize, maximize },
    reducedMotion: () => reducedMotionQuery.matches,
    setState,
    announce: (message) => {
      if (!status) return
      // Clearing first makes repeated messages announce again.
      status.textContent = ''
      window.requestAnimationFrame(() => {
        status.textContent = message
      })
    },
  }
  setState('open')

  for (const action of ACTIONS) {
    win.controls[action].addEventListener('click', async () => {
      const handler = handlers[action]
      if (state !== 'open' || !handler) return

      setState('busy')
      let focusTarget: HTMLElement | void = undefined
      try {
        focusTarget = await handler(win)
      } finally {
        setState('open')
        ;(focusTarget ?? win.controls[action]).focus({ preventScroll: true })
      }
    })
  }
}
