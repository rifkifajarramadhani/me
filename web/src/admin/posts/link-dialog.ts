import type { Editor } from '@tiptap/core'
import { byId } from '../admin-shell'
import { SAFE_HREF } from './editor-extensions'

/** The link editor: one dialog shared by the toolbar and Ctrl/Cmd+K. */
export function mountLinkDialog(getEditor: () => Editor | undefined) {
  const dialog = byId<HTMLDialogElement>('link-dialog')
  const form = dialog.querySelector('form')!
  const input = byId<HTMLInputElement>('link-href')
  const error = byId('link-error')
  const remove = byId<HTMLButtonElement>('link-remove')
  const cancel = byId<HTMLButtonElement>('link-cancel')

  /**
   * Closing a modal dialog would otherwise drop focus on the body. Focus the
   * view synchronously: Tiptap's focus command waits a frame, and keystrokes
   * in that frame would be lost.
   */
  function close() {
    dialog.close()
    getEditor()?.view.focus()
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const editor = getEditor()
    if (!editor) return
    const href = input.value.trim()
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      close()
      return
    }
    if (!SAFE_HREF.test(href)) {
      error.hidden = false
      input.setAttribute('aria-invalid', 'true')
      input.focus()
      return
    }

    const chain = editor.chain().focus().extendMarkRange('link')
    if (editor.state.selection.empty && !editor.isActive('link')) {
      chain
        .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
        .run()
    } else {
      chain.setLink({ href }).run()
    }
    close()
  })
  remove.addEventListener('click', () => {
    getEditor()?.chain().focus().extendMarkRange('link').unsetLink().run()
    close()
  })
  cancel.addEventListener('click', close)
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault()
    close()
  })

  return {
    open() {
      const editor = getEditor()
      if (!editor) return
      const current: unknown = editor.getAttributes('link').href
      input.value = typeof current === 'string' ? current : ''
      remove.hidden = !editor.isActive('link')
      error.hidden = true
      input.removeAttribute('aria-invalid')
      dialog.showModal()
      input.select()
    },
  }
}
