/**
 * Behaviour shared by every signed-in admin page: the sidebar and mobile
 * drawer, the session check, and sign-out. A page marks its own content with
 * `data-admin-content`; the shell reveals it once the owner is verified.
 */
const signInUrl = '/admin/login/'

export function byId<T extends HTMLElement = HTMLElement>(id: string) {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Missing #${id}`)
  return element as T
}

function mountNavigation() {
  const ownerLogin = byId('owner-login')
  const ownerAvatar = byId('owner-avatar')
  const sidebar = byId('admin-sidebar')
  const desktopNavigation = byId('desktop-navigation')
  const drawer = byId<HTMLDialogElement>('mobile-navigation')
  const openNavigation = byId<HTMLButtonElement>('open-navigation')
  const closeNavigation = byId<HTMLButtonElement>('close-navigation')
  const profile = byId<HTMLDetailsElement>('admin-profile')
  const profileTrigger = profile.querySelector('summary')!
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
      sidebar.querySelector<HTMLElement>('[aria-current="page"]')?.focus()
    }
  })

  document.addEventListener('click', (event) => {
    if (profile.open && !profile.contains(event.target as Node)) {
      profile.open = false
    }
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && profile.open) {
      event.preventDefault()
      profile.open = false
      profileTrigger.focus()
    }
  })

  return {
    setOwner(login: string) {
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

export interface AdminShellOptions {
  /** Runs each time the owner's session is verified. */
  onReady?: (login: string) => void | Promise<void>
}

export function mountAdminShell({ onReady }: AdminShellOptions = {}) {
  const navigation = mountNavigation()
  const checking = byId('checking-session')
  const unavailable = byId('session-unavailable')
  const retry = byId<HTMLButtonElement>('retry-session')
  const content = document.querySelector<HTMLElement>('[data-admin-content]')
  const signOut = byId<HTMLFormElement>('sign-out')
  const signOutError = byId('sign-out-error')
  const signOutButton = signOut.querySelector('button')!
  const signOutLabel = byId('sign-out-label')

  function show(panel: HTMLElement | null, login = '') {
    checking.hidden = panel !== checking
    unavailable.hidden = panel !== unavailable
    if (content) content.hidden = panel !== content
    navigation.setOwner(login)
  }

  async function checkSession() {
    show(checking)
    let login: unknown
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
      ;({ login } = await response.json())
      if (typeof login !== 'string' || !login) {
        throw new Error('Invalid session')
      }
    } catch {
      show(unavailable)
      return
    }
    show(content, login)
    await onReady?.(login)
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

/** Sends an owner API request. 401 means the session ended: go to sign-in. */
export async function adminFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
    ...init,
    headers: init.body
      ? { 'Content-Type': 'application/json', ...init.headers }
      : init.headers,
  })
  if (response.status === 401) {
    location.replace(signInUrl)
    throw new Error('Signed out')
  }
  return response
}
