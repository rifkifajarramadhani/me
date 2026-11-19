import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Response } from 'express'

const tokens = readFileSync(join(__dirname, '..', 'tokens.css'), 'utf8')
const styles = `
  * { box-sizing: border-box; }
  html { color-scheme: dark; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    align-content: center;
    padding: 1.5rem;
    background: var(--canvas);
    color: var(--ink);
    font: 1rem/1.7 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  main {
    width: min(100%, 36rem);
    margin-inline: auto;
    border: 1px solid var(--hairline);
    background: var(--surface-1);
  }
  header {
    padding: .625rem 1.25rem;
    border-bottom: 1px solid var(--hairline);
    background: var(--surface-2);
    color: var(--ink-muted);
    font-size: .8125rem;
  }
  section { padding: clamp(1.25rem, 5vw, 2rem); }
  h1 { margin: 0; font-size: clamp(1.25rem, 5vw, 1.75rem); line-height: 1.3; }
  h1 span { color: var(--primary); }
  p { margin: .75rem 0 1.5rem; color: var(--ink-muted); overflow-wrap: anywhere; }
  a, button {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: .5rem .875rem;
    border: 1px solid var(--hairline-strong);
    border-radius: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  a:hover, button:hover { color: var(--primary); border-color: var(--primary); }
  a:focus-visible, button:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; }
`

export function sendAdminPage(
  response: Response,
  status: number,
  title: string,
  description: string,
  action: 'sign-in' | 'sign-out',
) {
  const nonce = randomBytes(16).toString('base64')
  const control =
    action === 'sign-in'
      ? '<a href="/admin/auth/github">Sign in with GitHub</a>'
      : '<form method="post" action="/admin/logout"><button type="submit">Sign out</button></form>'

  response.set(
    'Content-Security-Policy',
    `default-src 'none'; style-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
  )
  response.status(status).type('html').send(`<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style nonce="${nonce}">${tokens}
${styles}</style>
  </head>
  <body>
    <main>
      <header>~/portfolio/admin</header>
      <section aria-labelledby="page-title">
        <h1 id="page-title"><span aria-hidden="true">&gt;</span> ${title}</h1>
        <p>${description}</p>
        ${control}
      </section>
    </main>
  </body>
</html>`)
}
