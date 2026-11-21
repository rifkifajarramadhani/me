const assert = require('node:assert/strict')
const { test } = require('node:test')
const {
  excerptFrom,
  InvalidPostContent,
  readingMinutes,
  renderPostContent,
} = require('../dist/posts/post-content')
const {
  canDelete,
  canTransition,
  effectiveStatus,
  POST_STATUSES,
} = require('../dist/posts/post-status')
const { postExtensions } = require('../dist/posts/post-extensions')
const { isValidSlug, slugify } = require('../dist/posts/slug')
const { getSchema } = require('@tiptap/core')

const doc = (...content) => ({ type: 'doc', content })
const paragraph = (...content) => ({ type: 'paragraph', content })
const text = (value, marks) => ({
  type: 'text',
  text: value,
  ...(marks && { marks }),
})
const link = (href) => [{ type: 'link', attrs: { href } }]

test('pins the StarterKit schema shared with the admin editor', () => {
  const schema = getSchema(postExtensions)
  assert.deepEqual(Object.keys(schema.nodes).sort(), [
    'blockquote',
    'bulletList',
    'codeBlock',
    'doc',
    'hardBreak',
    'heading',
    'horizontalRule',
    'listItem',
    'orderedList',
    'paragraph',
    'text',
  ])
  assert.deepEqual(Object.keys(schema.marks).sort(), [
    'bold',
    'code',
    'italic',
    'link',
    'strike',
    'underline',
  ])
})

test('renders escaped HTML and counts words', () => {
  const result = renderPostContent(
    doc(
      { type: 'heading', attrs: { level: 2 }, content: [text('Why <script>')] },
      paragraph(
        text('Shipping '),
        text('fast', [{ type: 'bold' }]),
        text(' matters.'),
      ),
    ),
  )
  assert.equal(
    result.html,
    '<h2>Why &lt;script&gt;</h2><p>Shipping <strong>fast</strong> matters.</p>',
  )
  assert.equal(result.wordCount, 5)
  assert.equal(result.json.type, 'doc')
})

test('rejects documents outside the schema', () => {
  for (const input of [
    null,
    'text',
    { type: 'paragraph' },
    doc({ type: 'image', attrs: { src: 'x' } }),
    doc({ type: 'heading', attrs: { level: 1 }, content: [text('Title')] }),
    doc(paragraph({ type: 'paragraph' })),
  ]) {
    assert.throws(() => renderPostContent(input), InvalidPostContent)
  }
})

test('allows only safe link targets', () => {
  for (const href of [
    'https://example.com',
    'mailto:a@b.co',
    '/blog/',
    '#top',
  ]) {
    assert.match(
      renderPostContent(doc(paragraph(text('x', link(href))))).html,
      /<a /,
    )
  }
  for (const href of [
    'javascript:alert(1)',
    'data:text/html,x',
    '//evil.test',
    ' vbscript:x',
  ]) {
    assert.throws(
      () => renderPostContent(doc(paragraph(text('x', link(href))))),
      InvalidPostContent,
    )
  }
})

test('builds excerpts and reading time', () => {
  assert.equal(excerptFrom('  Short\n\ntext '), 'Short text')
  const long = excerptFrom('word '.repeat(60))
  assert.ok(long.length <= 161)
  assert.ok(long.endsWith('word…'))
  assert.equal(readingMinutes(0), 1)
  assert.equal(readingMinutes(221), 2)
})

test('limits status transitions and deletion', () => {
  assert.ok(canTransition('draft', 'scheduled'))
  assert.ok(canTransition('published', 'archived'))
  assert.ok(!canTransition('draft', 'archived'))
  assert.ok(!canTransition('archived', 'scheduled'))
  for (const status of POST_STATUSES) assert.ok(!canTransition(status, status))
  assert.deepEqual(POST_STATUSES.filter(canDelete), ['draft', 'archived'])
})

test('treats a due scheduled post as published', () => {
  const now = new Date('2026-11-21T10:00:00.000Z')
  assert.equal(
    effectiveStatus('scheduled', '2026-11-21T09:59:59.000Z', now),
    'published',
  )
  assert.equal(
    effectiveStatus('scheduled', '2026-11-21T10:00:01.000Z', now),
    'scheduled',
  )
  assert.equal(
    effectiveStatus('draft', '2026-11-20T00:00:00.000Z', now),
    'draft',
  )
})

test('derives URL-safe slugs', () => {
  assert.equal(slugify('  Héllo, World! — Part 2 '), 'hello-world-part-2')
  assert.equal(slugify('!!!'), '')
  assert.ok(isValidSlug('hello-world-2'))
  assert.ok(!isValidSlug('Hello'))
  assert.ok(!isValidSlug('a--b'))
  assert.ok(!isValidSlug('a'.repeat(81)))
})
