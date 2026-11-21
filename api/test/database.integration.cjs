require('reflect-metadata')

const assert = require('node:assert/strict')
const { mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { test } = require('node:test')
const { Database } = require('../dist/database/database')
const { MIGRATIONS } = require('../dist/database/migrations')

function withDatabasePath(t, path) {
  const previous = process.env.CMS_DATABASE_PATH
  process.env.CMS_DATABASE_PATH = path
  t.after(() => {
    process.env.CMS_DATABASE_PATH = previous
  })
}

test('migrates a new database to the latest schema', (t) => {
  withDatabasePath(t, ':memory:')
  const database = new Database()
  t.after(() => database.onModuleDestroy())

  const { user_version } = database.connection
    .query('PRAGMA user_version')
    .get()
  assert.equal(user_version, MIGRATIONS.length)
  const columns = database.connection
    .query('SELECT name FROM pragma_table_info(?)')
    .all('posts')
    .map(({ name }) => name)
  assert.ok(columns.includes('content_json'))
  assert.ok(columns.includes('status'))
})

test('creates the database directory and keeps data across restarts', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'cms-db-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  withDatabasePath(t, join(root, 'nested', 'cms.sqlite'))

  const first = new Database()
  first.connection.exec(
    `INSERT INTO posts (slug, title, content_json, content_html, created_at, updated_at)
     VALUES ('hello', 'Hello', '{}', '', 'now', 'now')`,
  )
  first.onModuleDestroy()

  const second = new Database()
  t.after(() => second.onModuleDestroy())
  const row = second.connection.query('SELECT slug FROM posts').get()
  assert.deepEqual(row, { slug: 'hello' })
})

test('refuses a database from a newer build', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'cms-db-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  withDatabasePath(t, join(root, 'cms.sqlite'))

  const database = new Database()
  database.connection.exec(`PRAGMA user_version = ${MIGRATIONS.length + 1}`)
  database.onModuleDestroy()
  assert.throws(() => new Database(), /newer than this build supports/)
})
