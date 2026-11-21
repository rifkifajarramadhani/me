import {
  complete,
  runCommand,
  type ShellData,
  type ShellEffect,
  type ShellLine,
  type ShellTheme,
} from '@/lib/terminal-shell'
import { mapRect, play, type WindowActionHandler } from './hero-window'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const LINE_CLASS: Record<ShellLine['kind'], string> = {
  out: 'text-ink',
  muted: 'text-ink-subtle',
  accent: 'text-primary',
  err: 'text-danger',
  link: 'text-ink',
}

interface ShellSession {
  /** Opens the shell and resolves once the visitor leaves it. */
  run(origin: HTMLElement, reduced: boolean): Promise<void>
}

function currentTheme(): ShellTheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function commonPrefix(values: string[]) {
  return values.reduce((prefix, value) => {
    let i = 0
    while (i < prefix.length && prefix[i] === value[i]) i += 1
    return prefix.slice(0, i)
  })
}

function renderLine(line: ShellLine) {
  const row = document.createElement('p')
  row.className = `whitespace-pre-wrap break-words ${LINE_CLASS[line.kind]}`
  if (line.kind === 'link' && line.href) {
    const anchor = document.createElement('a')
    anchor.href = line.href
    anchor.textContent = line.text
    anchor.className = 'underline decoration-hairline-strong underline-offset-4 hover:text-primary'
    if (!line.href.startsWith('mailto:')) {
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
    }
    row.append(anchor)
  } else {
    row.textContent = line.text
  }
  return row
}

function renderEcho(input: string) {
  const row = document.createElement('p')
  row.className = 'whitespace-pre-wrap break-words'
  const user = document.createElement('span')
  user.className = 'text-primary'
  user.textContent = 'visitor@portfolio'
  const path = document.createElement('span')
  path.className = 'text-ink-subtle'
  path.textContent = ':~$ '
  const command = document.createElement('span')
  command.className = 'text-ink'
  command.textContent = input
  row.append(user, path, command)
  return row
}

function createSession(dialog: HTMLDialogElement): ShellSession | undefined {
  const body = dialog.querySelector<HTMLElement>('[data-shell-body]')
  const log = dialog.querySelector<HTMLElement>('[data-shell-log]')
  const form = dialog.querySelector<HTMLFormElement>('[data-shell-form]')
  const input = dialog.querySelector<HTMLInputElement>('[data-shell-input]')
  const source = dialog.querySelector('[data-shell-data]')
  if (!body || !log || !form || !input || !source?.textContent) return undefined

  const data: ShellData = JSON.parse(source.textContent)
  const history: string[] = []
  let cursor = 0
  let leave: (() => void) | undefined

  const hasSelection = () =>
    input.selectionStart !== input.selectionEnd ||
    !!window.getSelection()?.toString()

  const print = (rows: HTMLElement[]) => {
    log.append(...rows)
    body.scrollTop = body.scrollHeight
  }

  const apply = (effect: ShellEffect) => {
    switch (effect.type) {
      case 'clear':
        log.replaceChildren()
        break
      case 'exit':
        leave?.()
        break
      case 'theme':
        // Reuse the nav toggle so its label and storage stay in sync.
        if (effect.theme !== currentTheme()) {
          document.querySelector<HTMLElement>('[data-theme-toggle]')?.click()
        }
        break
      case 'open':
        if (effect.href.startsWith('mailto:')) window.location.href = effect.href
        else window.open(effect.href, '_blank', 'noopener,noreferrer')
        break
    }
  }

  const submit = (value: string) => {
    print([renderEcho(value)])
    const trimmed = value.trim()
    if (trimmed && history.at(-1) !== trimmed) history.push(trimmed)
    cursor = history.length

    const result = runCommand(value, { data, history, theme: currentTheme() })
    print(result.lines.map(renderLine))
    if (result.effect) apply(result.effect)
  }

  const tabComplete = () => {
    const candidates = complete(input.value, data)
    if (candidates.length === 0) return
    if (candidates.length === 1) {
      const [only] = candidates
      input.value = only.includes(' ') ? only : `${only} `
      return
    }
    const prefix = commonPrefix(candidates)
    if (prefix.length > input.value.length) {
      input.value = prefix
      return
    }
    print([
      renderEcho(input.value),
      renderLine({
        kind: 'muted',
        text: candidates.map((candidate) => candidate.split(' ').at(-1)).join('  '),
      }),
    ])
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const value = input.value
    input.value = ''
    submit(value)
  })

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault()
      tabComplete()
    } else if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault()
      cursor = Math.max(0, cursor - 1)
      input.value = history[cursor]
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault()
      cursor = Math.min(history.length, cursor + 1)
      input.value = history[cursor] ?? ''
    } else if (event.ctrlKey && event.key === 'l') {
      event.preventDefault()
      log.replaceChildren()
    } else if (event.ctrlKey && event.key === 'c' && !hasSelection()) {
      // Ctrl+C copies when text is selected and interrupts otherwise.
      event.preventDefault()
      print([renderEcho(`${input.value}^C`)])
      input.value = ''
    }
  })

  // Clicking the empty part of the screen returns focus to the prompt.
  body.addEventListener('click', (event) => {
    if (event.target === body || event.target === log) {
      if (!window.getSelection()?.toString()) input.focus()
    }
  })

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault()
    leave?.()
  })
  for (const button of dialog.querySelectorAll('[data-shell-exit]')) {
    button.addEventListener('click', () => leave?.())
  }

  print([
    renderLine({ kind: 'accent', text: 'portfolio-sh 1.0' }),
    renderLine({
      kind: 'muted',
      text: 'Type `help` to see commands. Tab completes, Esc leaves.',
    }),
  ])

  return {
    async run(origin, reduced) {
      const root = document.documentElement
      root.style.overflow = 'hidden'
      dialog.showModal()
      input.focus()
      if (!reduced) {
        await play(
          dialog,
          [
            {
              transform: mapRect(dialog.getBoundingClientRect(), origin.getBoundingClientRect()),
              opacity: 0.4,
            },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 420, easing: EASE },
        )
      }

      await new Promise<void>((resolve) => {
        leave = resolve
      })
      leave = undefined

      if (!reduced) {
        await play(
          dialog,
          [
            { transform: 'none', opacity: 1 },
            {
              transform: mapRect(dialog.getBoundingClientRect(), origin.getBoundingClientRect()),
              opacity: 0,
            },
          ],
          { duration: 360, easing: EASE, fill: 'forwards' },
        ).then((animation) => {
          dialog.close()
          animation.cancel()
        })
      } else {
        dialog.close()
      }
      root.style.overflow = ''
    },
  }
}

let session: ShellSession | undefined | null = null

/** Maximize: the window becomes a working shell over the whole viewport. */
export const maximizeTerminal: WindowActionHandler = async (win) => {
  if (session === null) {
    const dialog = document.querySelector<HTMLDialogElement>('[data-hero-shell]')
    session = dialog ? createSession(dialog) : undefined
  }
  if (!session) return

  win.setState('maximized')
  win.announce('Interactive shell opened.')
  await session.run(win.terminal, win.reducedMotion())
  win.announce('Shell closed.')
}
