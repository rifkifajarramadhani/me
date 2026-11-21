import type { Editor } from '@tiptap/core'

interface ToolbarAction {
  run: (editor: Editor) => void
  /** Toggle buttons report their state with aria-pressed. */
  active?: (editor: Editor) => boolean
  enabled?: (editor: Editor) => boolean
}

function heading(level: 2 | 3 | 4): ToolbarAction {
  return {
    run: (editor) => editor.chain().focus().toggleHeading({ level }).run(),
    active: (editor) => editor.isActive('heading', { level }),
  }
}

function mark(name: 'bold' | 'italic' | 'underline' | 'strike' | 'code'): ToolbarAction {
  return {
    run: (editor) => editor.chain().focus().toggleMark(name).run(),
    active: (editor) => editor.isActive(name),
    enabled: (editor) => editor.can().toggleMark(name),
  }
}

/** Formatting toolbar with roving focus, as the ARIA toolbar pattern expects. */
export function mountToolbar(
  toolbar: HTMLElement,
  editor: Editor,
  { openLink }: { openLink: () => void },
) {
  const actions: Record<string, ToolbarAction> = {
    bold: mark('bold'),
    italic: mark('italic'),
    underline: mark('underline'),
    strike: mark('strike'),
    code: mark('code'),
    heading2: heading(2),
    heading3: heading(3),
    heading4: heading(4),
    bulletList: {
      run: (e) => e.chain().focus().toggleBulletList().run(),
      active: (e) => e.isActive('bulletList'),
    },
    orderedList: {
      run: (e) => e.chain().focus().toggleOrderedList().run(),
      active: (e) => e.isActive('orderedList'),
    },
    blockquote: {
      run: (e) => e.chain().focus().toggleBlockquote().run(),
      active: (e) => e.isActive('blockquote'),
    },
    codeBlock: {
      run: (e) => e.chain().focus().toggleCodeBlock().run(),
      active: (e) => e.isActive('codeBlock'),
    },
    link: { run: openLink, active: (e) => e.isActive('link') },
    horizontalRule: {
      run: (e) => e.chain().focus().setHorizontalRule().run(),
      enabled: (e) => e.can().setHorizontalRule(),
    },
    undo: {
      run: (e) => e.chain().focus().undo().run(),
      enabled: (e) => e.can().undo(),
    },
    redo: {
      run: (e) => e.chain().focus().redo().run(),
      enabled: (e) => e.can().redo(),
    },
  }

  const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>('[data-action]')]
  let current = 0

  function focusButton(index: number) {
    buttons[current].tabIndex = -1
    current = (index + buttons.length) % buttons.length
    buttons[current].tabIndex = 0
    buttons[current].focus()
  }

  function sync() {
    for (const button of buttons) {
      const action = actions[button.dataset.action!]
      if (action.active) {
        button.setAttribute('aria-pressed', String(action.active(editor)))
      }
      // aria-disabled keeps the button focusable for roving navigation.
      const enabled = action.enabled?.(editor) ?? true
      button.setAttribute('aria-disabled', String(!enabled))
    }
  }

  buttons.forEach((button, index) => {
    button.tabIndex = index === 0 ? 0 : -1
    // Keep the editor's focus and selection when a button is clicked.
    button.addEventListener('mousedown', (event) => event.preventDefault())
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return
      current = index
      actions[button.dataset.action!].run(editor)
    })
  })

  toolbar.addEventListener('keydown', (event) => {
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: buttons.length - 1,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    focusButton(moves[event.key])
  })

  editor.on('transaction', sync)
  editor.on('focus', sync)
  sync()
}
