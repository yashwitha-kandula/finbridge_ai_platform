export const inr = (n) => '₹' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-IN')

export const inrSigned = (n) => (Number(n) < 0 ? '-' : '') + inr(n)

const trim = (x) => String(x).replace(/\.0$/, '')

/** Compact axis label: ₹50K, ₹1L, ₹1.5L, ₹2Cr */
export function inrShort(n) {
  const v = Number(n) || 0
  const a = Math.abs(v)
  if (a >= 1e7) return '₹' + trim((v / 1e7).toFixed(1)) + 'Cr'
  if (a >= 1e5) return '₹' + trim((v / 1e5).toFixed(1)) + 'L'
  if (a >= 1e3) return '₹' + trim((v / 1e3).toFixed(0)) + 'K'
  return '₹' + v
}

export const firstName = (full) => (full || '').trim().split(/\s+/)[0] || ''

export const initials = (full) =>
  (full || 'U').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U'
