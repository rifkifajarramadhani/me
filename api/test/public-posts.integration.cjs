const assert = require('node:assert/strict')
const { after, before, test } = require('node:test')
const { origin, startCms } = require('./owner-session.cjs')

let cms

before(async () => {
  cms = await startCms()
})

after(async () => {
  await cms?.app.close()
})

test('serves only published and due scheduled posts', async (t) => {
  const cookie = await cms.signIn(t)
  const write = (path, method, json) =>
    cms.request(`/admin/api/posts${path}`, {
      cookie,
      method,
      json,
      refererOrigin: origin,
    })
  const create = async (title, text) =>
    (
      await write('', 'POST', {
        title,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        },
      })
    ).json()
  const setStatus = async (post, status, publishAt) =>
    (
      await write(`/${post.id}/status`, 'PUT', {
        status,
        publishAt,
        updatedAt: post.updatedAt,
      })
    ).json()

  await create('Draft only', 'Hidden')
  const live = await setStatus(
    await create('Live post', 'Visible <b>'),
    'published',
  )
  const publishAt = new Date(Date.now() + 60_000).toISOString()
  await setStatus(await create('Later', 'Soon'), 'scheduled', publishAt)
  await setStatus(
    await setStatus(await create('Old', 'Gone'), 'published'),
    'archived',
  )

  const list = await cms.request('/api/posts')
  assert.equal(list.status, 200)
  const { posts } = await list.json()
  assert.deepEqual(
    posts.map((post) => post.slug),
    ['live-post'],
  )
  assert.equal(posts[0].excerpt, 'Visible <b>')
  assert.equal(posts[0].readingMinutes, 1)
  assert.equal(posts[0].html, undefined)

  const article = await (await cms.request('/api/posts/live-post')).json()
  assert.equal(article.html, '<p>Visible &lt;b&gt;</p>')
  assert.equal(article.publishedAt, live.publishedAt)
  for (const slug of ['draft-only', 'later', 'old', 'missing']) {
    assert.equal((await cms.request(`/api/posts/${slug}`)).status, 404)
  }

  t.mock.timers.enable({ apis: ['Date'], now: Date.parse(publishAt) })
  const due = await (await cms.request('/api/posts')).json()
  assert.deepEqual(
    due.posts.map((post) => post.slug),
    ['later', 'live-post'],
  )
  assert.equal((await cms.request('/api/posts/later')).status, 200)
})
