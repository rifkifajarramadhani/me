const assert = require('node:assert/strict')
const { after, before, beforeEach, test } = require('node:test')
const { origin, startCms } = require('./owner-session.cjs')

let cms
let cookie

const doc = (value = 'Hello world') => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }],
})

before(async () => {
  cms = await startCms()
})

beforeEach(async (t) => {
  cms.app
    .get(require('../dist/database/database').Database)
    .connection.exec('DELETE FROM posts')
  cookie = await cms.signIn(t)
})

after(async () => {
  await cms?.app.close()
})

function api(path, { method = 'GET', json, from = origin } = {}) {
  return cms.request(`/admin/api/posts${path}`, {
    cookie,
    method,
    json,
    refererOrigin: method === 'GET' ? undefined : from,
  })
}

async function create(fields = {}) {
  const response = await api('', {
    method: 'POST',
    json: { title: 'First post', content: doc(), ...fields },
  })
  assert.equal(response.status, 201, await response.clone().text())
  return response.json()
}

async function setStatus(post, status, extra = {}) {
  return api(`/${post.id}/status`, {
    method: 'PUT',
    json: { status, updatedAt: post.updatedAt, ...extra },
  })
}

test('requires the owner session and a same-origin write', async () => {
  const anonymous = await cms.request('/admin/api/posts')
  assert.equal(anonymous.status, 401)
  assert.equal(anonymous.headers.get('cache-control'), 'no-store')

  const crossOrigin = await api('', {
    method: 'POST',
    json: { title: 'x' },
    from: 'https://other.example.test',
  })
  assert.equal(crossOrigin.status, 403)
})

test('creates, reads, updates, lists, and deletes a draft', async () => {
  const post = await create({ excerpt: 'Short summary' })
  assert.equal(post.slug, 'first-post')
  assert.equal(post.status, 'draft')
  assert.equal(post.wordCount, 2)
  assert.equal(post.slugLocked, false)
  assert.deepEqual(post.nextStatuses, ['published', 'scheduled'])
  assert.equal(post.deletable, true)

  const again = await create()
  assert.equal(again.slug, 'first-post-2')

  const read = await (await api(`/${post.id}`)).json()
  assert.deepEqual(read.content, doc())

  const updated = await api(`/${post.id}`, {
    method: 'PUT',
    json: {
      title: 'Renamed',
      slug: 'renamed',
      excerpt: '',
      content: doc('Three words here'),
      updatedAt: post.updatedAt,
    },
  })
  assert.equal(updated.status, 200)
  const body = await updated.json()
  assert.equal(body.slug, 'renamed')
  assert.equal(body.wordCount, 3)
  assert.notEqual(body.updatedAt, post.updatedAt)

  const list = await (await api('?status=draft')).json()
  assert.equal(list.posts.length, 2)
  assert.equal(list.posts[0].content, undefined)
  assert.deepEqual(list.counts, {
    draft: 2,
    scheduled: 0,
    published: 0,
    archived: 0,
  })

  const removed = await api(`/${post.id}?updatedAt=${body.updatedAt}`, {
    method: 'DELETE',
  })
  assert.equal(removed.status, 204)
  assert.equal((await api(`/${post.id}`)).status, 404)
})

test('validates input', async () => {
  const cases = [
    [{ title: '' }, /Add a title/],
    [{ title: 'x', slug: 'Bad Slug' }, /Slug must use/],
    [{ title: 'x'.repeat(201) }, /200 characters/],
    [
      { title: 'x', content: { type: 'doc', content: [{ type: 'image' }] } },
      /does not support/,
    ],
    [
      {
        title: 'x',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'x',
                  marks: [
                    { type: 'link', attrs: { href: 'javascript:alert(1)' } },
                  ],
                },
              ],
            },
          ],
        },
      },
      /Links must start/,
    ],
  ]
  for (const [json, message] of cases) {
    const response = await api('', { method: 'POST', json })
    assert.equal(response.status, 400)
    assert.match((await response.json()).message, message)
  }
  assert.equal((await api('?status=live')).status, 400)
  assert.equal((await api('/abc')).status, 400)
})

test('rejects duplicate slugs and stale writes', async () => {
  const post = await create({ slug: 'taken' })
  const duplicate = await api('', {
    method: 'POST',
    json: { title: 'Other', slug: 'taken' },
  })
  assert.equal(duplicate.status, 409)

  const first = await api(`/${post.id}`, {
    method: 'PUT',
    json: { title: 'One', updatedAt: post.updatedAt },
  })
  assert.equal(first.status, 200)
  const stale = await api(`/${post.id}`, {
    method: 'PUT',
    json: { title: 'Two', updatedAt: post.updatedAt },
  })
  assert.equal(stale.status, 409)
  assert.match((await stale.json()).message, /another tab/)
  assert.equal(
    (await api(`/${post.id}?updatedAt=${post.updatedAt}`, { method: 'DELETE' }))
      .status,
    409,
  )
})

test('moves through statuses and locks the slug once published', async () => {
  let post = await create()
  assert.equal((await setStatus(post, 'archived')).status, 409)

  let response = await setStatus(post, 'published')
  assert.equal(response.status, 200)
  post = await response.json()
  assert.equal(post.status, 'published')
  assert.ok(post.publishedAt)
  assert.equal(post.slugLocked, true)
  assert.equal(post.deletable, false)
  const publishedAt = post.publishedAt

  const rename = await api(`/${post.id}`, {
    method: 'PUT',
    json: { title: 'x', slug: 'new-slug', updatedAt: post.updatedAt },
  })
  assert.equal(rename.status, 409)
  assert.match((await rename.json()).message, /locked/)

  const deleteLive = await api(`/${post.id}?updatedAt=${post.updatedAt}`, {
    method: 'DELETE',
  })
  assert.equal(deleteLive.status, 409)

  post = await (await setStatus(post, 'archived')).json()
  assert.equal(post.status, 'archived')
  assert.deepEqual(post.nextStatuses, ['draft', 'published'])

  post = await (await setStatus(post, 'published')).json()
  assert.equal(
    post.publishedAt,
    publishedAt,
    'restoring keeps the original date',
  )

  post = await (await setStatus(post, 'draft')).json()
  assert.equal(post.status, 'draft')
  assert.equal(post.publishedAt, null)
  assert.equal(post.slugLocked, true, 'a once-public slug stays locked')
})

test('schedules a post and publishes it when the time comes', async (t) => {
  let post = await create()
  const past = await setStatus(post, 'scheduled', {
    publishAt: new Date(Date.now() - 1000).toISOString(),
  })
  assert.equal(past.status, 400)
  assert.equal((await setStatus(post, 'scheduled')).status, 400)
  assert.equal(
    (
      await setStatus(post, 'published', {
        publishAt: new Date().toISOString(),
      })
    ).status,
    400,
  )

  const publishAt = new Date(Date.now() + 60_000).toISOString()
  post = await (await setStatus(post, 'scheduled', { publishAt })).json()
  assert.equal(post.status, 'scheduled')
  assert.equal(post.publishedAt, publishAt)
  assert.equal(post.slugLocked, false)

  t.mock.timers.enable({ apis: ['Date'], now: Date.parse(publishAt) + 1 })
  post = await (await api(`/${post.id}`)).json()
  assert.equal(post.status, 'published')
  assert.equal(post.slugLocked, true)
  assert.deepEqual(post.nextStatuses, ['draft', 'archived'])

  const archived = await setStatus(post, 'archived')
  assert.equal(archived.status, 200)
  assert.equal((await archived.json()).publishedAt, publishAt)
})
