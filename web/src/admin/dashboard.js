const signInUrl = '/admin/login/'

function mountNavigation() {
  const ownerLogin = document.getElementById('owner-login')
  const ownerAvatar = document.getElementById('owner-avatar')
  const sidebar = document.getElementById('admin-sidebar')
  const desktopNavigation = document.getElementById('desktop-navigation')
  const drawer = document.getElementById('mobile-navigation')
  const openNavigation = document.getElementById('open-navigation')
  const closeNavigation = document.getElementById('close-navigation')
  const profile = document.getElementById('admin-profile')
  const profileTrigger = profile.querySelector('summary')
  const desktop = matchMedia('(min-width: 48rem)')

  function closeDrawer() {
    drawer.close()
    profile.open = false
    desktopNavigation.append(sidebar)
    openNavigation.setAttribute('aria-expanded', 'false')
  }

  openNavigation.addEventListener('click', () => {
    drawer.append(sidebar)
    drawer.showModal()
    openNavigation.setAttribute('aria-expanded', 'true')
  })
  closeNavigation.addEventListener('click', closeDrawer)
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) closeDrawer()
  })
  drawer.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeDrawer()
  })
  desktop.addEventListener('change', () => {
    profile.open = false
    if (desktop.matches && drawer.open) {
      closeDrawer()
      sidebar.querySelector('[aria-current="page"]').focus()
    }
  })

  document.addEventListener('click', (event) => {
    if (profile.open && !profile.contains(event.target)) profile.open = false
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && profile.open) {
      event.preventDefault()
      profile.open = false
      profileTrigger.focus()
    }
  })

  return {
    setOwner(login) {
      sidebar.hidden = !login
      openNavigation.hidden = !login
      ownerLogin.textContent = login ? `@${login}` : ''
      ownerAvatar.textContent = login ? login.slice(0, 2).toUpperCase() : ''
      if (!login) {
        if (drawer.open) closeDrawer()
        profile.open = false
      }
    },
    restoreProfileFocus() {
      if (profile.open && document.activeElement === document.body) {
        profileTrigger.focus()
      }
    },
  }
}

function mountSession(navigation) {
  const checking = document.getElementById('checking-session')
  const unavailable = document.getElementById('session-unavailable')
  const retry = document.getElementById('retry-session')
  const ownerPanel = document.getElementById('owner-panel')
  const signOut = document.getElementById('sign-out')
  const signOutError = document.getElementById('sign-out-error')
  const signOutButton = signOut.querySelector('button')
  const signOutLabel = document.getElementById('sign-out-label')

  function show(panel, login = '') {
    checking.hidden = panel !== checking
    unavailable.hidden = panel !== unavailable
    ownerPanel.hidden = panel !== ownerPanel
    navigation.setOwner(login)
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
      show(ownerPanel, login)
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
    if (signOutButton.disabled) return
    signOutError.hidden = true
    signOutButton.disabled = true
    signOutLabel.textContent = 'Signing out…'
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
      navigation.restoreProfileFocus()
    } finally {
      signOutButton.disabled = false
      signOutLabel.textContent = 'Sign out'
    }
  })

  void checkSession()
}

mountSession(mountNavigation())
