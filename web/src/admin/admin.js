const signInUrl = '/admin/login/'
const signInError = document.getElementById('sign-in-error')

if (signInError) {
  const messages = new Map([
    ['busy', 'Too many sign-ins are in progress. Try again in a few minutes.'],
    [
      'incomplete',
      'The sign-in request expired or was cancelled. Start a new sign-in.',
    ],
    [
      'provider-unavailable',
      'The CMS could not verify your GitHub account. Try again.',
    ],
    [
      'access-denied',
      'Switch to the portfolio owner’s GitHub account and try again.',
    ],
  ])
  const message = messages.get(
    new URLSearchParams(location.search).get('error'),
  )
  if (message) {
    signInError.textContent = message
    signInError.hidden = false
  }
}

const signOut = document.getElementById('sign-out')

if (signOut) {
  const checking = document.getElementById('checking-session')
  const unavailable = document.getElementById('session-unavailable')
  const retry = document.getElementById('retry-session')
  const ownerPanel = document.getElementById('owner-panel')
  const ownerLogin = document.getElementById('owner-login')
  const signOutError = document.getElementById('sign-out-error')
  const signOutButton = signOut.querySelector('button')

  function show(panel) {
    checking.hidden = panel !== checking
    unavailable.hidden = panel !== unavailable
    ownerPanel.hidden = panel !== ownerPanel
    if (ownerPanel.hidden) ownerLogin.textContent = ''
  }

  async function checkSession() {
    show(checking)
    try {
      const response = await fetch('/admin/session', {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      })
      if (response.status === 401) {
        location.replace(signInUrl)
        return
      }
      if (!response.ok) throw new Error('Session lookup failed')
      const { login } = await response.json()
      if (typeof login !== 'string' || !login)
        throw new Error('Invalid session')
      ownerLogin.textContent = login
      show(ownerPanel)
    } catch {
      show(unavailable)
    }
  }

  retry.addEventListener('click', checkSession)
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) show(checking)
  })
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void checkSession()
  })
  signOut.addEventListener('submit', async (event) => {
    event.preventDefault()
    signOutError.hidden = true
    signOutButton.disabled = true
    try {
      const response = await fetch(signOut.action, {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
      })
      if (response.status !== 204 && response.status !== 401) {
        throw new Error('Sign-out failed')
      }
      show(checking)
      location.replace(signInUrl)
    } catch {
      signOutError.hidden = false
      signOutButton.disabled = false
    }
  })

  void checkSession()
}
