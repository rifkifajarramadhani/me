import { createHash } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { CmsConfig } from './cms-config'

export interface GithubAccount {
  id: number
  login: string
}

@Injectable()
export class GithubOAuth {
  constructor(private readonly config: CmsConfig) {}

  authorize(state: string, verifier: string) {
    const url = new URL('https://github.com/login/oauth/authorize')
    url.search = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      scope: '',
      state,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
      allow_signup: 'false',
    }).toString()
    return url.href
  }

  async identify(code: string, verifier: string): Promise<GithubAccount> {
    const exchange = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.callbackUrl,
          code,
          code_verifier: verifier,
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(8_000),
      },
    )
    if (!exchange.ok) throw new Error('GitHub token exchange failed.')

    const token: { access_token?: unknown } | null = await exchange.json()
    if (typeof token?.access_token !== 'string' || !token.access_token) {
      throw new Error('GitHub returned no access token.')
    }

    const identity = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.access_token}`,
        'X-GitHub-Api-Version': '2026-03-10',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(8_000),
    })
    if (!identity.ok) throw new Error('GitHub account lookup failed.')

    const account: { id?: unknown; login?: unknown } | null =
      await identity.json()
    if (
      typeof account?.id !== 'number' ||
      !Number.isSafeInteger(account.id) ||
      account.id < 1 ||
      typeof account.login !== 'string' ||
      !/^[a-z\d-]{1,39}$/i.test(account.login)
    ) {
      throw new Error('GitHub returned an invalid account.')
    }
    return { id: account.id, login: account.login }
  }
}
