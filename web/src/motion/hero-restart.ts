import { play, wait, type WindowActionHandler } from './hero-window'

const TYPE_DELAY_MS = 70
const CRT_EASE_IN = 'cubic-bezier(0.7, 0, 0.84, 0)'
const CRT_EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

const crtOff: Keyframe[] = [
  { transform: 'scale(1, 1)', filter: 'brightness(1)', opacity: 1 },
  { transform: 'scale(1, 0.012)', filter: 'brightness(2.2)', opacity: 1, offset: 0.55 },
  { transform: 'scale(0, 0.012)', filter: 'brightness(3)', opacity: 0 },
]

const crtOn: Keyframe[] = [
  { transform: 'scale(0, 0.012)', filter: 'brightness(3)', opacity: 0 },
  { transform: 'scale(1, 0.012)', filter: 'brightness(2.2)', opacity: 1, offset: 0.4 },
  { transform: 'scale(1, 1)', filter: 'brightness(1)', opacity: 1 },
]

let restartCount = 0

function stamp(ms: number) {
  return `[${(ms / 1000).toFixed(3).padStart(8, ' ')}]`
}

function logLine(log: HTMLElement, elapsed: number, text: string, tone?: string) {
  const line = document.createElement('p')
  const time = document.createElement('span')
  time.className = 'text-ink-tertiary'
  time.textContent = `${stamp(elapsed)} `
  const message = document.createElement('span')
  message.className = tone ?? 'text-ink-muted'
  message.textContent = text
  line.append(time, message)
  log.append(line)
}

/** Clones an existing transcript row so Astro's scoped styles still apply. */
async function typeExit(transcript: HTMLElement, instant: boolean) {
  const row = transcript.querySelector('.hero-line')
  const command = row?.querySelector('.hero-command')
  if (!row || !command) return undefined

  const line = row.cloneNode(false) as HTMLElement
  line.removeAttribute('id')
  line.setAttribute('aria-hidden', 'true')
  const prompt = command.cloneNode(true) as HTMLElement
  const typed = prompt.lastElementChild as HTMLElement
  typed.textContent = instant ? 'exit' : ''
  line.append(prompt)
  transcript.append(line)

  if (!instant) {
    for (const char of 'exit') {
      typed.textContent += char
      await wait(TYPE_DELAY_MS)
    }
  }
  return line
}

/**
 * Close: the session exits and a supervisor restarts it, a quiet nod to
 * `Restart=always` and services that heal themselves.
 */
export const restartTerminal: WindowActionHandler = async (win) => {
  const { root, terminal } = win
  const transcript = terminal.querySelector<HTMLElement>('[data-hero-transcript]')
  const log = root.querySelector<HTMLElement>('[data-hero-restart-log]')
  if (!transcript || !log) return

  const reduced = win.reducedMotion()
  restartCount += 1
  win.announce('Terminal closed. Restarting.')

  const exitLine = await typeExit(transcript, reduced)
  let off: Animation | undefined
  if (!reduced) {
    await wait(220)
    off = await play(terminal, crtOff, {
      duration: 460,
      easing: CRT_EASE_IN,
      fill: 'forwards',
    })
  }

  terminal.style.visibility = 'hidden'
  off?.cancel()
  exitLine?.remove()

  const started = performance.now()
  const steps: [number, string, string?][] = [
    [0, 'portfolio.service: Main process exited, code=exited, status=0/SUCCESS'],
    [
      260,
      `portfolio.service: Scheduled restart job, restart counter is at ${restartCount}.`,
    ],
    [560, 'Starting portfolio.service - ~/portfolio…'],
  ]

  log.replaceChildren()
  log.hidden = false
  for (const [at, text, tone] of steps) {
    if (!reduced) await wait(Math.max(0, at - (performance.now() - started)))
    logLine(log, at, text, tone)
  }
  await wait(reduced ? 700 : 440)

  const elapsed = performance.now() - started
  logLine(
    log,
    elapsed,
    `✓ Started portfolio.service in ${(elapsed / 1000).toFixed(1)}s`,
    'text-primary',
  )
  await wait(reduced ? 500 : 380)

  log.hidden = true
  log.replaceChildren()
  terminal.style.visibility = ''
  if (!reduced) {
    await play(terminal, crtOn, { duration: 520, easing: CRT_EASE_OUT })
  }
  win.announce('Terminal restarted.')
}
