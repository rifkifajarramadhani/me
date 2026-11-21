// Shared harness for integration tests that need a running CMS and, optionally,
// a signed-in owner session. Not a test file itself (no `.integration` suffix).
require('reflect-metadata')

const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { createApp } = require('../dist/app')

const origin = 'https://cms.example.test'
const owner = { id: 157324525, login: 'rifkifajarramadhani' }
const requestFetch = globalThis.fetch

async function startCms() {
  Object.assign(process.env, {
    CMS_ORIGIN: origin,
    CMS_GITHUB_CLIENT_ID: 'test-client',
    CMS_GITHUB_CLIENT_SECRET: 'test-secret',
    CMS_GITHUB_OWNER_ID: String(owner.id),
  })
  const app = await createApp(false)
  await app.listen(0, '127.0.0.1')
  const address = await app.getUrl()

  function request(path, { cookie, refererOrigin, method = 'GET', json } = {}) {
    const headers = {}
    if (cookie) headers.Cookie = cookie
    if (refererOrigin) headers.Origin = refererOrigin
    if (json !== undefined) headers['Content-Type'] = 'application/json'
    return requestFetch(`${address}${path}`, {
      redirect: 'manual',
      method,
      headers,
      body: json === undefined ? undefined : JSON.stringify(json),
    })
  }

  async function beginSignIn() {
    const response = await request('/admin/auth/github')
    assert.equal(response.status, 303)
    const authorization = new URL(response.headers.get('location'))
    const flowCookie = getCookie(response, 'cms_oauth')
    assert.ok(flowCookie)
    return { authorization, cookie: flowCookie.split(';')[0], flowCookie }
  }

  function callback(
    { authorization, cookie },
    state = authorization.searchParams.get('state'),
  ) {
    const query = new URLSearchParams({ code: 'test-code' })
    if (state) query.set('state', state)
    return request(`/admin/auth/github/callback?${query}`, { cookie })
  }

  /** Signs the owner in and returns the session cookie pair. */
  async function signIn(t) {
    const flow = await beginSignIn()
    mockGitHub(t, owner, flow.authorization)
    const result = await callback(flow)
    t.mock.restoreAll()
    assert.equal(result.status, 303)
    return getCookie(result, 'cms_session').split(';')[0]
  }

  return { app, request, beginSignIn, callback, signIn }
}

function getCookie(response, name) {
  return response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${name}=`))
}

function mockGitHub(t, account, authorization) {
  return t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url === 'https://github.com/login/oauth/access_token') {
      assert.equal(options.method, 'POST')
      assert.equal(options.body.get('client_secret'), 'test-secret')
      assert.equal(options.body.get('code'), 'test-code')
      assert.equal(
        options.body.get('redirect_uri'),
        `${origin}/admin/auth/github/callback`,
      )
      const challenge = createHash('sha256')
        .update(options.body.get('code_verifier'))
        .digest('base64url')
      assert.equal(challenge, authorization.searchParams.get('code_challenge'))
      return Response.json({ access_token: 'provider-token' })
    }
    assert.equal(url, 'https://api.github.com/user')
    assert.equal(options.headers.Authorization, 'Bearer provider-token')
    return Response.json(account)
  })
}

module.exports = { origin, owner, startCms, getCookie, mockGitHub }
