import { Injectable } from '@nestjs/common'
import { CmsConfig } from './cms-config'
import { GithubOAuth, type GithubAccount } from './github-oauth'
import { FLOW_LIFETIME, SESSION_LIFETIME, Sessions } from './sessions'

export type SignInError =
  | 'busy'
  | 'incomplete'
  | 'provider-unavailable'
  | 'access-denied'

interface SignInCallback {
  flowId: string | undefined
  state: unknown
  code: unknown
  previousSessionId: string | undefined
}

@Injectable()
export class OwnerAuth {
  constructor(
    private readonly config: CmsConfig,
    private readonly oauth: GithubOAuth,
    private readonly sessions: Sessions,
  ) {}

  beginSignIn(previousFlowId: string | undefined) {
    const flow = this.sessions.startSignIn(previousFlowId)
    if (!flow) return { status: 'busy' } as const

    return {
      status: 'started',
      flowId: flow.id,
      authorizationUrl: this.oauth.authorize(flow.state, flow.verifier),
      maxAge: FLOW_LIFETIME,
    } as const
  }

  async completeSignIn({
    flowId,
    state,
    code,
    previousSessionId,
  }: SignInCallback) {
    const verifier = this.sessions.finishSignIn(flowId, state)
    if (!verifier || typeof code !== 'string' || !code || code.length > 1024) {
      return { status: 'incomplete' } as const
    }

    let account: GithubAccount
    try {
      account = await this.oauth.identify(code, verifier)
    } catch {
      return { status: 'provider-unavailable' } as const
    }
    if (!this.isOwner(account)) return { status: 'access-denied' } as const

    return {
      status: 'signed-in',
      sessionId: this.sessions.create(account, previousSessionId),
      maxAge: SESSION_LIFETIME,
    } as const
  }

  findOwner(sessionId: string | undefined) {
    const account = this.sessions.find(sessionId)
    return account && this.isOwner(account) ? account : undefined
  }

  signOut(sessionId: string | undefined) {
    this.sessions.revoke(sessionId)
  }

  private isOwner(account: GithubAccount) {
    return account.id === this.config.ownerId
  }
}
