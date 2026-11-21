import { getSchema, type JSONContent } from '@tiptap/core'
import { Node, type Mark } from '@tiptap/pm/model'
import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string'
import {
  HEADING_LEVELS,
  LINK_PROTOCOLS,
  postExtensions,
} from './post-extensions'

const schema = getSchema(postExtensions)
const WORDS_PER_MINUTE = 220
const EXCERPT_LENGTH = 160
const SAFE_HREF = new RegExp(
  `^(?:(?:${LINK_PROTOCOLS.join('|')}):|/(?!/)|#)`,
  'i',
)

export class InvalidPostContent extends Error {}

export interface RenderedPostContent {
  json: JSONContent
  html: string
  text: string
  wordCount: number
}

/** Attribute rules ProseMirror's schema cannot express on its own. */
function assertSupportedAttributes(doc: Node) {
  doc.descendants((node) => {
    if (
      node.type.name === 'heading' &&
      !HEADING_LEVELS.includes(node.attrs.level as never)
    ) {
      throw new InvalidPostContent(
        'Headings must be level 2, 3, or 4. The post title is the only level 1 heading.',
      )
    }
    node.marks.forEach((mark: Mark) => {
      if (mark.type.name !== 'link') return
      const href: unknown = mark.attrs.href
      if (typeof href !== 'string' || !SAFE_HREF.test(href.trim())) {
        throw new InvalidPostContent(
          'Links must start with http://, https://, mailto:, / or #.',
        )
      }
    })
  })
}

function parse(input: unknown) {
  if (
    typeof input !== 'object' ||
    input === null ||
    (input as { type?: unknown }).type !== 'doc'
  ) {
    throw new InvalidPostContent('Content must be a Tiptap document.')
  }
  try {
    const doc = Node.fromJSON(schema, input)
    doc.check()
    return doc
  } catch (error) {
    throw new InvalidPostContent(
      error instanceof Error
        ? `Content uses formatting the blog does not support: ${error.message}`
        : 'Content uses formatting the blog does not support.',
    )
  }
}

export function countWords(text: string) {
  return text.split(/\s+/u).filter(Boolean).length
}

export function readingMinutes(wordCount: number) {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))
}

/** The first sentence-sized slice of the text, cut at a word boundary. */
export function excerptFrom(text: string) {
  const flat = text.replace(/\s+/gu, ' ').trim()
  if (flat.length <= EXCERPT_LENGTH) return flat
  const cut = flat.slice(0, EXCERPT_LENGTH + 1)
  const boundary = cut.lastIndexOf(' ')
  return `${cut.slice(0, boundary > 0 ? boundary : EXCERPT_LENGTH).trimEnd()}…`
}

/**
 * Validates editor JSON against the blog schema and renders the HTML the public
 * site prints. Output contains only markup produced by known nodes and marks.
 */
export function renderPostContent(input: unknown): RenderedPostContent {
  const doc = parse(input)
  assertSupportedAttributes(doc)
  const text = doc.textBetween(0, doc.content.size, '\n\n', '\n')
  return {
    json: doc.toJSON() as JSONContent,
    html: renderToHTMLString({ extensions: postExtensions, content: doc }),
    text,
    wordCount: countWords(text),
  }
}

/** Plain text of an already-validated stored document. */
export function plainText(json: JSONContent) {
  const doc = Node.fromJSON(schema, json)
  return doc.textBetween(0, doc.content.size, '\n\n', '\n')
}

export const EMPTY_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}
