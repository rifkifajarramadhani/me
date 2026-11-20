import { observePageMotion } from './page-motion'

export type TerminalLine = { kind: 'cmd' | 'out' | 'ok'; text: string }

function createPlayback(
  root: HTMLElement,
  log: HTMLElement,
  script: TerminalLine[],
) {
  const caret = document.createElement('span')
  caret.className = 'term-backdrop__caret'

  let step = 0
  let timer: number | undefined
  let running = false

  // Lines can wrap, so trim by measured overflow rather than line count.
  const trim = () => {
    while (log.scrollHeight > log.clientHeight && log.childElementCount > 1)
      log.firstElementChild?.remove()
  }

  const newLine = (line: TerminalLine) => {
    const el = document.createElement('div')
    el.className = `term-backdrop__line is-${line.kind}`
    log.append(el)
    trim()
    return el
  }

  const schedule = (fn: () => void, ms: number) => {
    timer = window.setTimeout(() => {
      timer = undefined
      if (running) fn()
    }, ms)
  }

  const typeCommand = (el: HTMLElement, text: string, done: () => void) => {
    const prompt = document.createElement('span')
    prompt.className = 'term-backdrop__prompt'
    prompt.textContent = '$ '
    const node = document.createTextNode('')
    el.append(prompt, node, caret)

    let i = 0
    const tick = () => {
      i += 1
      node.data = text.slice(0, i)
      if (i < text.length) schedule(tick, 38 + Math.random() * 70)
      else schedule(done, 380 + Math.random() * 320)
    }
    schedule(tick, 60)
  }

  const next = () => {
    const line = script[step % script.length]
    step += 1

    if (line.kind === 'cmd') {
      const wipe = line.text === 'clear'
      typeCommand(newLine(line), line.text, () => {
        if (!wipe) return next()
        log.replaceChildren(caret)
        schedule(next, 1100)
      })
      return
    }

    const el = newLine(line)
    el.textContent = line.text
    log.append(caret)
    trim()
    const nextIsCmd = script[step % script.length].kind === 'cmd'
    schedule(
      next,
      nextIsCmd ? 700 + Math.random() * 900 : 120 + Math.random() * 180,
    )
  }

  const start = () => {
    if (running) return
    running = true
    schedule(next, 400)
  }

  const stop = () => {
    running = false
    window.clearTimeout(timer)
    timer = undefined
  }

  log.replaceChildren(caret)
  root.dataset.ready = ''

  return (active: boolean) => {
    if (active) start()
    else stop()
  }
}

export function mountTerminalBackdrop(
  root: HTMLElement,
  hero: HTMLElement | null,
) {
  const log = root.querySelector<HTMLElement>('[data-term-log]')
  // The CSS moves the transcript into the left margin at this width.
  const wide = window.matchMedia('(min-width: 80rem)')
  let active = false
  let setPlaying: ((active: boolean) => void) | undefined

  function syncPlayback() {
    setPlaying?.(active && (wide.matches || !root.hasAttribute('data-dim')))
  }

  if (log) {
    observePageMotion((motion, previous) => {
      if (!previous && !motion.reducedMotion) {
        const script: TerminalLine[] = JSON.parse(root.dataset.script ?? '[]')
        if (script.length > 0) setPlaying = createPlayback(root, log, script)
      }
      active = motion.visible && !motion.reducedMotion
      syncPlayback()
    })
    wide.addEventListener('change', syncPlayback)
  }

  // The static transcript also dims when the hero leaves the viewport.
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        root.toggleAttribute('data-dim', !entry.isIntersecting)
        syncPlayback()
      },
      { threshold: 0.35 },
    ).observe(hero)
  }
}
