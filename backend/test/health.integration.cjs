require('reflect-metadata')

const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createApp } = require('../dist/app')

test('serves a health check over HTTP', async (t) => {
  process.env.CMS_ORIGIN = 'https://cms.example.test'
  process.env.CMS_GITHUB_CLIENT_ID = 'test-client'
  process.env.CMS_GITHUB_CLIENT_SECRET = 'test-secret'
  process.env.CMS_GITHUB_OWNER_ID = '157324525'
  const app = await createApp(false)
  t.after(() => app.close())
  await app.listen(0, '127.0.0.1')

  const response = await fetch(`${await app.getUrl()}/healthz`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
})
