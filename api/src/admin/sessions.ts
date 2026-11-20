import { randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { GithubAccount } from './github-oauth'

export const FLOW_COOKIE = 'cms_oauth'
export const SESSION_COOKIE = 'cms_session'
export const FLOW_LIFETIME = 10 * 60 * 1000
export const SESSION_LIFETIME = 8 * 60 * 60 * 1000

interface Expiring {
  expiresAt: number
}

interface PendingSignIn extends Expiring {
  state: string
  verifier: string
}

interface Session extends Expiring {
  account: GithubAccount
}

function randomId() {
  return randomBytes(32).toString('base64url')
}

export function readCookie(header: string | undefined, name: string) {
  const cookies = header?.split(';').map((cookie) => cookie.trim()) ?? []
  const matches = cookies.filter((cookie) => cookie.startsWith(`${name}=`))
  if (matches.length !== 1) return undefined

  const value = matches[0].slice(name.length + 1)
  return /^[\w-]{43}$/.test(value) ? value : undefined
}

function removeExpired(entries: Map<string, Expiring>, now: number) {
  for (const [id, entry] of entries) {
    if (entry.expiresAt <= now) entries.delete(id)
  }
}

@Injectable()
export class Sessions {
  private readonly pending = new Map<string, PendingSignIn>()
  private readonly active = new Map<string, Session>()

  startSignIn(previousFlowId: string | undefined) {
    const now = Date.now()
    if (previousFlowId) this.pending.delete(previousFlowId)
    removeExpired(this.pending, now)
    if (this.pending.size >= 1024) return undefined

    const id = randomId()
    const state = randomId()
    const verifier = randomId()
    this.pending.set(id, { state, verifier, expiresAt: now + FLOW_LIFETIME })
    return { id, state, verifier }
  }

  finishSignIn(id: string | undefined, state: unknown) {
    if (!id) return undefined

    const flow = this.pending.get(id)
    this.pending.delete(id)
    if (flow && flow.expiresAt > Date.now() && flow.state === state) {
      return flow.verifier
    }
    return undefined
  }

  create(account: GithubAccount, previousSessionId: string | undefined) {
    const now = Date.now()
    this.revoke(previousSessionId)
    removeExpired(this.active, now)
    const oldest = this.active.keys().next().value
    if (this.active.size >= 32 && oldest) this.active.delete(oldest)

    const id = randomId()
    this.active.set(id, { account, expiresAt: now + SESSION_LIFETIME })
    return id
  }

  find(id: string | undefined) {
    if (!id) return undefined

    const session = this.active.get(id)
    if (session && session.expiresAt > Date.now()) return session.account

    this.active.delete(id)
    return undefined
  }

  revoke(id: string | undefined) {
    if (id) this.active.delete(id)
  }
}
