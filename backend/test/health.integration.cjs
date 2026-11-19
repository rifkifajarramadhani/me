require('reflect-metadata')

const assert = require('node:assert/strict')
const { test } = require('node:test')
const { NestFactory } = require('@nestjs/core')
const { AppModule } = require('../dist/app.module')

test('serves a health check over HTTP', async (t) => {
  const app = await NestFactory.create(AppModule, { logger: false })
  t.after(() => app.close())
  await app.listen(0, '127.0.0.1')

  const response = await fetch(`${await app.getUrl()}/healthz`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
})
