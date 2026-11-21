export type WindowAction = 'close' | 'minimize' | 'maximize'

/** Every state but `open` disables the controls so actions never overlap. */
export type WindowState = 'open' | 'busy' | 'minimized' | 'maximized'

export interface HeroWindow {
  readonly root: HTMLElement
  readonly terminal: HTMLElement
  readonly controls: Readonly<Record<WindowAction, HTMLButtonElement>>
  reducedMotion(): boolean
  setState(next: WindowState): void
}

/**
 * Runs one action's whole cycle, such as minimize through restore. The window
 * stays `busy` (or whatever the handler sets) until the promise settles, then
 * returns to `open`.
 */
export type WindowActionHandler = (win: HeroWindow) => Promise<void>

const ACTIONS: readonly WindowAction[] = ['close', 'minimize', 'maximize']
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

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
  }
  setState('open')

  for (const action of ACTIONS) {
    win.controls[action].addEventListener('click', async () => {
      const handler = handlers[action]
      if (state !== 'open' || !handler) return

      setState('busy')
      try {
        await handler(win)
      } finally {
        setState('open')
      }
    })
  }
}
