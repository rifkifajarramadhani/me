import StarterKit from '@tiptap/starter-kit'

/**
 * Mirrors the CMS schema in `api/src/posts/post-extensions.ts`, which is
 * authoritative: the API rejects anything this editor might add beyond it.
 */
export const HEADING_LEVELS = [2, 3, 4] as const

export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [...HEADING_LEVELS] },
    link: {
      openOnClick: false,
      autolink: true,
      protocols: ['http', 'https', 'mailto'],
    },
  }),
]

/** Same rule as the API: web, mail, site-relative, or in-page links. */
export const SAFE_HREF = /^(?:(?:https?|mailto):|\/(?!\/)|#)/i
