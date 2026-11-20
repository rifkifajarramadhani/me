import { Injectable } from '@nestjs/common'

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Set ${name} before starting the CMS.`)
  return value
}

function readOrigin() {
  const value = required('CMS_ORIGIN')
  const origin = URL.parse(value)
  if (origin?.origin === value && origin.protocol === 'https:') return origin
  if (
    origin?.origin === value &&
    origin.protocol === 'http:' &&
    origin.hostname === '127.0.0.1' &&
    process.env.NODE_ENV !== 'production'
  ) {
    return origin
  }
  throw new Error(
    'CMS_ORIGIN must be an HTTPS origin or a local loopback HTTP origin in development.',
  )
}

function readOwnerId() {
  const value = required('CMS_GITHUB_OWNER_ID')
  const id = Number(value)
  if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(id)) {
    throw new Error('CMS_GITHUB_OWNER_ID must be a positive GitHub account ID.')
  }
  return id
}

@Injectable()
export class CmsConfig {
  private readonly url = readOrigin()
  readonly origin = this.url.origin
  readonly secureCookies = this.url.protocol === 'https:'
  readonly callbackUrl = new URL('/admin/auth/github/callback', this.url).href
  readonly clientId = required('CMS_GITHUB_CLIENT_ID')
  readonly clientSecret = required('CMS_GITHUB_CLIENT_SECRET')
  readonly ownerId = readOwnerId()
}
