import { expect, test } from 'bun:test'
import { serializeJsonLd } from './json-ld'

test('keeps author text from closing the script element', () => {
  const data = { headline: '</script><script>alert(1)</script> & more' }
  const serialized = serializeJsonLd(data)
  expect(serialized).not.toContain('<')
  expect(serialized).not.toContain('>')
  expect(serialized).not.toContain('&')
  expect(JSON.parse(serialized)).toEqual(data)
})
