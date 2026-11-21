import StarterKit from '@tiptap/starter-kit'

/**
 * The Tiptap schema the CMS accepts. Keep it in step with the admin editor's
 * `web/src/admin/posts/editor-extensions.ts`; this copy is authoritative and
 * rejects anything outside it. H1 is reserved for the post title.
 */
export const HEADING_LEVELS = [2, 3, 4] as const
export const LINK_PROTOCOLS = ['http', 'https', 'mailto'] as const

export const postExtensions = [
  StarterKit.configure({
    heading: { levels: [...HEADING_LEVELS] },
    link: {
      openOnClick: false,
      autolink: true,
      protocols: [...LINK_PROTOCOLS],
    },
  }),
]
