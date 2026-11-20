import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common'
import type { CookieOptions, Request, Response } from 'express'
import { FLOW_COOKIE, readCookie, SESSION_COOKIE } from './admin-cookies'
import { CmsConfig } from './cms-config'
import { OwnerAuth, type SignInError } from './owner-auth'
import { PublicRoute, type OwnerRequest } from './owner.guard'

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
    private readonly auth: OwnerAuth,
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
    const result = this.auth.beginSignIn(
      readCookie(request.headers.cookie, FLOW_COOKIE),
    )
    if (result.status !== 'started') {
      signInFailed(response, result.status)
      return
    }

    response.cookie(FLOW_COOKIE, result.flowId, {
      ...this.cookieOptions,
      maxAge: result.maxAge,
    })
    redirect(response, result.authorizationUrl)
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
    const result = await this.auth.completeSignIn({
      flowId: readCookie(request.headers.cookie, FLOW_COOKIE),
      state,
      code,
      previousSessionId: readCookie(request.headers.cookie, SESSION_COOKIE),
    })
    if (result.status !== 'signed-in') {
      signInFailed(response, result.status)
      return
    }

    response.cookie(SESSION_COOKIE, result.sessionId, {
      ...this.cookieOptions,
      maxAge: result.maxAge,
    })
    redirect(response, '/admin/')
  }

  @Post('logout')
  logout(@Req() request: OwnerRequest, @Res() response: Response) {
    this.auth.signOut(readCookie(request.headers.cookie, SESSION_COOKIE))
    response.clearCookie(SESSION_COOKIE, this.cookieOptions)
    response.status(204).end()
  }
}
