/**
 * Ordered schema migrations. Each entry runs once, in a transaction, and its
 * position (1-based) becomes the database's `user_version`. Append only.
 */
export const MIGRATIONS: readonly string[] = [
  `CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    content_json TEXT NOT NULL,
    content_html TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    published_at TEXT,
    first_published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (status NOT IN ('scheduled', 'published') OR published_at IS NOT NULL)
  );
  CREATE INDEX posts_status_published_at ON posts (status, published_at);`,
]
