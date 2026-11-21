export const SLUG_MAX_LENGTH = 80
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(title: string) {
  return title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, '')
}

export function isValidSlug(value: string) {
  return value.length <= SLUG_MAX_LENGTH && SLUG.test(value)
}
