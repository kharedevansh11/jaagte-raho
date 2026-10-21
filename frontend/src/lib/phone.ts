/** Strips spaces/dashes, adds the country code, and returns E.164 or null if it can't be valid. */
export function toE164(prefix: string, number: string): string | null {
  const digits = number.replace(/[^\d]/g, '')
  const cc = prefix.replace(/[^\d]/g, '')
  if (!cc) return null
  // A pasted number that already has the country code (e.g. 919876543210).
  const local = digits.length > 10 && digits.startsWith(cc) ? digits.slice(cc.length) : digits.replace(/^0+/, '')
  if (cc === '91' ? local.length !== 10 : local.length < 6 || local.length > 13) return null
  return `+${cc}${local}`
}

/** Splits "+919876543210" into a prefix and a readable local part, for editing. */
export function fromE164(e164: string | null): { prefix: string; number: string } {
  if (!e164) return { prefix: '+91', number: '' }
  if (e164.startsWith('+91')) return { prefix: '+91', number: e164.slice(3).replace(/(\d{5})(\d+)/, '$1 $2') }
  return { prefix: e164.slice(0, 3), number: e164.slice(3) }
}
