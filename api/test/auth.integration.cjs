require('reflect-metadata')

const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { after, before, test } = require('node:test')
const { createApp } = require('../dist/app')
const { FLOW_LIFETIME, SESSION_LIFETIME } = require('../dist/admin/sessions')

const origin = 'https://cms.example.test'
const owner = { id: 157324525, login: 'rifkifajarramadhani' }
const requestFetch = globalThis.fetch
let app
let address

before(async () => {
  Object.assign(process.env, {
    CMS_ORIGIN: origin,
    CMS_GITHUB_CLIENT_ID: 'test-client',
    CMS_GITHUB_CLIENT_SECRET: 'test-secret',
    CMS_GITHUB_OWNER_ID: String(owner.id),
  })
  app = await createApp(false)
  await app.listen(0, '127.0.0.1')
  address = await app.getUrl()
})

after(async () => {
  await app?.close()
})

function request(path, { cookie, refererOrigin, method = 'GET' } = {}) {
  const headers = {}
  if (cookie) headers.Cookie = cookie
  if (refererOrigin) headers.Origin = refererOrigin
  return requestFetch(`${address}${path}`, {
    redirect: 'manual',
    method,
    headers,
  })
}

function getCookie(response, name) {
  return response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${name}=`))
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

function assertSignInFailure(response, error) {
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), `/admin/login/?error=${error}`)
  assert.equal(response.headers.get('content-type'), null)
  assert.equal(getCookie(response, 'cms_session'), undefined)
}

test('serves JSON for session requests and leaves admin pages to the web app', async () => {
  for (const path of ['/admin/', '/admin/login/']) {
    const page = await request(path)
    assert.equal(page.status, 404)
    assert.match(page.headers.get('content-type'), /^application\/json\b/)
  }

  const session = await request('/admin/session')
  assert.equal(session.status, 401)
  assert.match(session.headers.get('content-type'), /^application\/json\b/)
  assert.equal(session.headers.get('cache-control'), 'no-store')
  assert.equal(session.headers.get('x-robots-tag'), 'noindex')

  const logout = await request('/admin/logout', {
    method: 'POST',
    refererOrigin: origin,
  })
  assert.equal(logout.status, 401)
})

test('allows the owner, rotates the session, and invalidates it on sign-out', async (t) => {
  const flow = await beginSignIn()
  mockGitHub(t, owner, flow.authorization)
  assert.equal(flow.authorization.origin, 'https://github.com')
  assert.equal(flow.authorization.searchParams.get('scope'), '')
  assert.equal(
    flow.authorization.searchParams.get('code_challenge_method'),
    'S256',
  )
  assert.match(flow.flowCookie, /Path=\/admin;.*HttpOnly; Secure; SameSite=Lax/)

  const result = await callback(flow)
  assert.equal(result.status, 303)
  assert.equal(result.headers.get('location'), '/admin/')
  assert.equal(result.headers.get('referrer-policy'), 'no-referrer')
  const session = getCookie(result, 'cms_session')
  assert.match(
    session,
    /Max-Age=28800; Path=\/admin;.*HttpOnly; Secure; SameSite=Lax/,
  )
  assert.doesNotMatch(session, /provider-token/)
  const cookie = session.split(';')[0]

  const sessionResponse = await request('/admin/session', { cookie })
  assert.equal(sessionResponse.status, 200)
  assert.equal(sessionResponse.headers.get('referrer-policy'), 'same-origin')
  assert.equal(sessionResponse.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await sessionResponse.json(), { login: owner.login })

  const rejectedLogout = await request('/admin/logout', {
    cookie,
    method: 'POST',
    refererOrigin: 'https://other.example.test',
  })
  assert.equal(rejectedLogout.status, 403)
  assert.equal((await request('/admin/session', { cookie })).status, 200)

  const newFlow = await beginSignIn()
  t.mock.restoreAll()
  mockGitHub(t, { ...owner, login: 'renamed-owner' }, newFlow.authorization)
  const renewed = await callback({
    ...newFlow,
    cookie: `${newFlow.cookie}; ${cookie}`,
  })
  assert.equal(renewed.status, 303)
  const newCookie = getCookie(renewed, 'cms_session').split(';')[0]
  assert.notEqual(newCookie, cookie)
  assert.equal((await request('/admin/session', { cookie })).status, 401)
  const renewedSession = await request('/admin/session', { cookie: newCookie })
  assert.deepEqual(await renewedSession.json(), { login: 'renamed-owner' })

  const logout = await request('/admin/logout', {
    cookie: newCookie,
    method: 'POST',
    refererOrigin: origin,
  })
  assert.equal(logout.status, 204)
  assert.match(getCookie(logout, 'cms_session'), /^cms_session=;/)
  assert.equal((await request('/admin/session', { cookie: newCookie })).status, 401)
})

test('denies another GitHub account even if the username matches', async (t) => {
  const flow = await beginSignIn()
  mockGitHub(t, { id: owner.id + 1, login: owner.login }, flow.authorization)
  const result = await callback(flow)
  assertSignInFailure(result, 'access-denied')
})

test('rejects missing, wrong, expired, unbound, and replayed OAuth state', async (t) => {
  const provider = t.mock.method(globalThis, 'fetch', () => {
    assert.fail('Invalid state must be rejected before contacting GitHub')
  })
  assertSignInFailure(await callback(await beginSignIn(), ''), 'incomplete')

  const flow = await beginSignIn()
  assertSignInFailure(await callback({ ...flow, cookie: undefined }), 'incomplete')
  assertSignInFailure(await callback(flow, 'wrong-state'), 'incomplete')
  assertSignInFailure(await callback(flow), 'incomplete')

  t.mock.timers.enable({ apis: ['Date'] })
  const expired = await beginSignIn()
  t.mock.timers.tick(FLOW_LIFETIME)
  const result = await callback(expired)
  assertSignInFailure(result, 'incomplete')
  assert.equal(provider.mock.callCount(), 0)
})

test('an accepted OAuth state is single-use and the resulting session expires', async (t) => {
  t.mock.timers.enable({ apis: ['Date'] })
  const flow = await beginSignIn()
  const provider = mockGitHub(t, owner, flow.authorization)
  const accepted = await callback(flow)
  assert.equal(accepted.status, 303)
  const cookie = getCookie(accepted, 'cms_session').split(';')[0]
  assertSignInFailure(await callback(flow), 'incomplete')
  assert.equal(provider.mock.callCount(), 2)
  assert.equal((await request('/admin/session', { cookie })).status, 200)
  t.mock.timers.tick(SESSION_LIFETIME)
  assert.equal((await request('/admin/session', { cookie })).status, 401)
})

test('consumes the pending sign-in when the callback is missing a code', async (t) => {
  const provider = t.mock.method(globalThis, 'fetch', () => {
    assert.fail('An incomplete callback must not contact GitHub')
  })
  const flow = await beginSignIn()
  const query = new URLSearchParams({
    state: flow.authorization.searchParams.get('state'),
  })
  const result = await request(`/admin/auth/github/callback?${query}`, {
    cookie: flow.cookie,
  })
  assertSignInFailure(result, 'incomplete')
  assertSignInFailure(await callback(flow), 'incomplete')
  assert.equal(provider.mock.callCount(), 0)
})

test('reports a provider failure without issuing a session', async (t) => {
  const flow = await beginSignIn()
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 503 }),
  )
  const result = await callback(flow)
  assertSignInFailure(result, 'provider-unavailable')
})
