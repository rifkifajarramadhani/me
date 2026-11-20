import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { readCookie, SESSION_COOKIE } from './admin-cookies'
import { CmsConfig } from './cms-config'
import type { GithubAccount } from './github-oauth'
import { OwnerAuth } from './owner-auth'

const PUBLIC_ROUTE = Symbol('public route')
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS']

export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE, true)

export interface OwnerRequest extends Request {
  owner: GithubAccount
}

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: OwnerAuth,
    private readonly config: CmsConfig,
  ) {}

  canActivate(context: ExecutionContext) {
    if (this.reflector.get<boolean>(PUBLIC_ROUTE, context.getHandler()))
      return true

    const request = context.switchToHttp().getRequest<OwnerRequest>()
    const account = this.auth.findOwner(
      readCookie(request.headers.cookie, SESSION_COOKIE),
    )
    if (!account) throw new UnauthorizedException()

    if (
      !READ_METHODS.includes(request.method) &&
      request.headers.origin !== this.config.origin
    ) {
      throw new ForbiddenException()
    }

    request.owner = account
    return true
  }
}
