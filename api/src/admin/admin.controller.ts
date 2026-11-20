import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common'
import type { CookieOptions, Request, Response } from 'express'
import { CmsConfig } from './cms-config'
import { GithubOAuth, type GithubAccount } from './github-oauth'
import { PublicRoute, type OwnerRequest } from './owner.guard'
import {
  FLOW_COOKIE,
  FLOW_LIFETIME,
  readCookie,
  SESSION_COOKIE,
  SESSION_LIFETIME,
  Sessions,
} from './sessions'

type SignInError =
  'busy' | 'incomplete' | 'provider-unavailable' | 'access-denied'

function redirect(response: Response, location: string) {
  response.status(303).location(location).end()
}

function signInFailed(response: Response, error: SignInError) {
  redirect(response, `/admin/login/?error=${error}`)
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly config: CmsConfig,
    private readonly oauth: GithubOAuth,
    private readonly sessions: Sessions,
  ) {}

  private get cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.secureCookies,
      sameSite: 'lax',
      path: '/admin',
    }
  }

  @Get('session')
  session(@Req() request: OwnerRequest) {
    return { login: request.owner.login }
  }

  @Get('auth/github')
  @PublicRoute()
  begin(@Req() request: Request, @Res() response: Response) {
    const flow = this.sessions.startSignIn(
      readCookie(request.headers.cookie, FLOW_COOKIE),
    )
    if (!flow) {
      signInFailed(response, 'busy')
      return
    }

    response.cookie(FLOW_COOKIE, flow.id, {
      ...this.cookieOptions,
      maxAge: FLOW_LIFETIME,
    })
    redirect(response, this.oauth.authorize(flow.state, flow.verifier))
  }

  @Get('auth/github/callback')
  @PublicRoute()
  async callback(
    @Req() request: Request,
    @Res() response: Response,
    @Query('state') state: unknown,
    @Query('code') code: unknown,
  ) {
    response.set('Referrer-Policy', 'no-referrer')
    response.clearCookie(FLOW_COOKIE, this.cookieOptions)
    const verifier = this.sessions.finishSignIn(
      readCookie(request.headers.cookie, FLOW_COOKIE),
      state,
    )
    if (!verifier || typeof code !== 'string' || !code || code.length > 1024) {
      signInFailed(response, 'incomplete')
      return
    }

    let account: GithubAccount
    try {
      account = await this.oauth.identify(code, verifier)
    } catch {
      signInFailed(response, 'provider-unavailable')
      return
    }
    if (account.id !== this.config.ownerId) {
      signInFailed(response, 'access-denied')
      return
    }

    const session = this.sessions.create(
      account,
      readCookie(request.headers.cookie, SESSION_COOKIE),
    )
    response.cookie(SESSION_COOKIE, session, {
      ...this.cookieOptions,
      maxAge: SESSION_LIFETIME,
    })
    redirect(response, '/admin/')
  }

  @Post('logout')
  logout(@Req() request: OwnerRequest, @Res() response: Response) {
    this.sessions.revoke(readCookie(request.headers.cookie, SESSION_COOKIE))
    response.clearCookie(SESSION_COOKIE, this.cookieOptions)
    response.status(204).end()
  }
}
