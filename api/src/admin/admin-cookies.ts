export const FLOW_COOKIE = 'cms_oauth'
export const SESSION_COOKIE = 'cms_session'

export function readCookie(header: string | undefined, name: string) {
  const cookies = header?.split(';').map((cookie) => cookie.trim()) ?? []
  const matches = cookies.filter((cookie) => cookie.startsWith(`${name}=`))
  if (matches.length !== 1) return undefined

  const value = matches[0].slice(name.length + 1)
  return /^[\w-]{43}$/.test(value) ? value : undefined
}
