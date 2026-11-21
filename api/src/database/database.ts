import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Database as SQLite } from 'bun:sqlite'
import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { MIGRATIONS } from './migrations'

const MEMORY = ':memory:'

function databasePath() {
  return process.env.CMS_DATABASE_PATH?.trim() || 'data/cms.sqlite'
}

function migrate(db: SQLite) {
  const { user_version: current } = db
    .query<{ user_version: number }, []>('PRAGMA user_version')
    .get()!
  if (current > MIGRATIONS.length) {
    throw new Error(
      `The CMS database is at version ${current}, newer than this build supports.`,
    )
  }

  for (const [index, sql] of MIGRATIONS.entries()) {
    const version = index + 1
    if (version <= current) continue
    db.transaction(() => {
      db.exec(sql)
      db.exec(`PRAGMA user_version = ${version}`)
    })()
  }
}

/** The CMS's single SQLite connection, migrated to the latest schema on start. */
@Injectable()
export class Database implements OnModuleDestroy {
  readonly connection: SQLite

  constructor() {
    const path = databasePath()
    if (path !== MEMORY) mkdirSync(dirname(path), { recursive: true })

    this.connection = new SQLite(path, { create: true, strict: true })
    this.connection.exec('PRAGMA journal_mode = WAL')
    this.connection.exec('PRAGMA foreign_keys = ON')
    this.connection.exec('PRAGMA busy_timeout = 5000')
    migrate(this.connection)
  }

  onModuleDestroy() {
    this.connection.close()
  }
}
