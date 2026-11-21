/**
 * Serializes structured data for a `<script type="application/ld+json">` body.
 * Escaping `<`, `>`, and `&` keeps author text such as `</script>` from
 * closing the element; JSON parsers read the escapes as the same characters.
 */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
