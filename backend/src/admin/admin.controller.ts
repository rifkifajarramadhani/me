import {
  Catch,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common'
import type { CookieOptions, Request, Response } from 'express'
import { sendAdminPage } from './admin-view'
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

@Catch(UnauthorizedException)
class RedirectToSignIn implements ExceptionFilter {
  catch(_exception: UnauthorizedException, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().redirect(303, '/admin/login')
  }
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

  @Get()
  @UseFilters(RedirectToSignIn)
  landing(@Req() request: OwnerRequest, @Res() response: Response) {
    sendAdminPage(
      response,
      200,
      'Portfolio admin',
      `Signed in as @${request.owner.login}.`,
      'sign-out',
    )
  }

  @Get('login')
  @PublicRoute()
  login(@Res() response: Response) {
    sendAdminPage(
      response,
      200,
      'Admin sign-in',
      'Sign in with the portfolio owner’s GitHub account.',
      'sign-in',
    )
  }

  @Get('auth/github')
  @PublicRoute()
  begin(@Req() request: Request, @Res() response: Response) {
    const flow = this.sessions.startSignIn(
      readCookie(request.headers.cookie, FLOW_COOKIE),
    )
    if (!flow) {
      sendAdminPage(
        response,
        503,
        'Sign-in unavailable',
        'Too many sign-ins are in progress. Try again in a few minutes.',
        'sign-in',
      )
      return
    }

    response.cookie(FLOW_COOKIE, flow.id, {
      ...this.cookieOptions,
      maxAge: FLOW_LIFETIME,
    })
    response.redirect(303, this.oauth.authorize(flow.state, flow.verifier))
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
      sendAdminPage(
        response,
        400,
        'Sign-in incomplete',
        'The sign-in request expired or was cancelled. Start a new sign-in.',
        'sign-in',
      )
      return
    }

    let account: GithubAccount
    try {
      account = await this.oauth.identify(code, verifier)
    } catch {
      sendAdminPage(
        response,
        502,
        'GitHub sign-in unavailable',
        'The CMS could not verify your GitHub account. Try again.',
        'sign-in',
      )
      return
    }
    if (account.id !== this.config.ownerId) {
      sendAdminPage(
        response,
        403,
        'Access denied',
        'Switch to the portfolio owner’s GitHub account and try again.',
        'sign-in',
      )
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
    response.redirect(303, '/admin/')
  }

  @Post('logout')
  logout(@Req() request: OwnerRequest, @Res() response: Response) {
    this.sessions.revoke(readCookie(request.headers.cookie, SESSION_COOKIE))
    response.clearCookie(SESSION_COOKIE, this.cookieOptions)
    response.redirect(303, '/admin/login')
  }
}
