import { play, wait, type WindowActionHandler } from './hero-window'

const DOCK_EASE = 'cubic-bezier(0.7, 0, 0.84, 0)'
const UNDOCK_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** The transform that moves and squashes `from` onto `to`. */
function collapseInto(from: DOMRect, to: DOMRect) {
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const sx = Math.max(to.width / from.width, 0.02)
  const sy = Math.max(to.height / from.height, 0.02)
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
}

function isShown(element: Element | null): element is HTMLElement {
  return !!element && element.getClientRects().length > 0
}

function inViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight
}

async function scrollIntoView(element: HTMLElement, reduced: boolean) {
  if (inViewport(element)) return
  element.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
  if (reduced) return
  await Promise.race([
    new Promise((resolve) =>
      window.addEventListener('scrollend', resolve, { once: true }),
    ),
    wait(900),
  ])
}

/** Resolves when one of the restore controls is activated. */
function waitForRestore(controls: HTMLElement[]) {
  return new Promise<void>((resolve) => {
    const restore = () => {
      for (const control of controls) control.removeEventListener('click', restore)
      resolve()
    }
    for (const control of controls) control.addEventListener('click', restore)
  })
}

/**
 * Minimize: the window docks into the desktop status bar like a stopped job.
 * `fg` in the hero, or the status-bar tab, brings it back.
 */
export const minimizeTerminal: WindowActionHandler = async (win) => {
  const { root, terminal } = win
  const stopped = root.querySelector<HTMLElement>('[data-hero-stopped]')
  const fg = root.querySelector<HTMLElement>('[data-hero-restore]')
  const dockTab = document.querySelector<HTMLElement>('[data-hero-dock]')
  if (!stopped || !fg) return

  const reduced = win.reducedMotion()
  win.setState('minimized')

  dockTab?.removeAttribute('hidden')
  const dock = isShown(dockTab) ? dockTab : undefined
  stopped.hidden = false

  const origin = terminal.getBoundingClientRect()
  const target = (dock ?? fg).getBoundingClientRect()
  if (!reduced) {
    stopped.style.opacity = '0'
    const off = await play(
      terminal,
      [
        { transform: 'none', opacity: 1 },
        { transform: collapseInto(origin, target), opacity: 0 },
      ],
      { duration: 460, easing: DOCK_EASE, fill: 'forwards' },
    )
    terminal.style.visibility = 'hidden'
    off.cancel()
    stopped.style.opacity = ''
    stopped.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 })
    if (dock) {
      const tokens = getComputedStyle(document.documentElement)
      dock.animate(
        [
          {
            backgroundColor: tokens.getPropertyValue('--primary'),
            color: tokens.getPropertyValue('--primary-foreground'),
          },
          {},
        ],
        { duration: 700, easing: 'ease-out' },
      )
    }
  } else {
    terminal.style.visibility = 'hidden'
  }

  win.announce(
    dock
      ? 'Terminal minimized to the status bar. Use fg to restore it.'
      : 'Terminal minimized. Use fg to restore it.',
  )
  fg.focus({ preventScroll: true })

  await waitForRestore(dock ? [fg, dock] : [fg])

  await scrollIntoView(root, reduced)
  const source = (dock ?? fg).getBoundingClientRect()
  stopped.hidden = true
  terminal.style.visibility = ''
  if (!reduced) {
    await play(
      terminal,
      [
        { transform: collapseInto(terminal.getBoundingClientRect(), source), opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 520, easing: UNDOCK_EASE },
    )
  }
  dockTab?.setAttribute('hidden', '')
  win.announce('Terminal restored.')
}
