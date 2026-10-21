import type { Level } from '../lib/types'
import type { StateKind } from '../lib/status'

type Shape = StateKind | Level | 'none'

const toKind = (s: Shape): StateKind | 'none' =>
  s === 'RED' ? 'needs-call' : s === 'AMBER' ? 'tired' : s === 'GREEN' ? 'awake' : s === 'MISSED' ? 'missed' : s

/**
 * Status is always shape + colour (+ a word next to it), never colour alone,
 * so it still reads in greyscale and for colour-blind owners.
 */
export function StatusGlyph({ state, size = 12 }: { state: Shape; size?: number }) {
  const kind = toKind(state)
  const cls = `glyph glyph-${kind}`
  const common = { width: size, height: size, viewBox: '0 0 12 12', 'aria-hidden': true, className: cls }
  switch (kind) {
    case 'needs-call':
      return (
        <svg {...common}>
          <path d="M6 1.2 11.2 10.4H.8Z" fill="currentColor" />
        </svg>
      )
    case 'tired':
      return (
        <svg {...common}>
          <path d="M6 .8 11.2 6 6 11.2.8 6Z" fill="currentColor" />
        </svg>
      )
    case 'awake':
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="5" fill="currentColor" />
        </svg>
      )
    case 'missed':
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="4.3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.2 1.8" />
        </svg>
      )
    case 'calling':
      return (
        <span className="glyph-calling" style={{ width: size, height: size }} aria-hidden>
          <svg {...common}>
            <circle cx="6" cy="6" r="4" fill="currentColor" />
          </svg>
        </span>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="4.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
  }
}
