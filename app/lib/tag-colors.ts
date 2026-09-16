/**
 * Tag colour mapping.
 *
 * One tag name always produces one appearance, everywhere it is rendered: the
 * sidebar filter, the note rows and the editor all call `tagPalette` rather
 * than choosing colours themselves.
 *
 * Known names get a semantic colour. Everything else — including tags created
 * after this file was written — is hashed to a palette, so a new tag still
 * looks the same on every render and in every pane without anyone editing
 * this list.
 *
 * Class strings are written out in full rather than composed, because Tailwind
 * discovers utilities by scanning source text; a built-up string such as
 * `bg-${colour}-50` would never be generated.
 */

export type TagPalette = {
  /** Tinted pill for the light workspace panes. */
  chip: string
  /** Pill for the navy sidebar. */
  chipOnDark: string
  /** Solid dot, for places that need the colour without a filled pill. */
  dot: string
}

const RED: TagPalette = {
  chip: 'border-red-200 bg-red-50 text-red-700',
  chipOnDark: 'border-red-400/25 bg-red-500/15 text-red-200',
  dot: 'bg-red-500',
}

const AMBER: TagPalette = {
  chip: 'border-amber-200 bg-amber-50 text-amber-800',
  chipOnDark: 'border-amber-400/25 bg-amber-500/15 text-amber-200',
  dot: 'bg-amber-500',
}

const GREEN: TagPalette = {
  chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  chipOnDark: 'border-emerald-400/25 bg-emerald-500/15 text-emerald-200',
  dot: 'bg-emerald-500',
}

const BLUE: TagPalette = {
  chip: 'border-blue-200 bg-blue-50 text-blue-700',
  chipOnDark: 'border-blue-400/25 bg-blue-500/15 text-blue-200',
  dot: 'bg-blue-500',
}

const PURPLE: TagPalette = {
  chip: 'border-violet-200 bg-violet-50 text-violet-700',
  chipOnDark: 'border-violet-400/25 bg-violet-500/15 text-violet-200',
  dot: 'bg-violet-500',
}

const TEAL: TagPalette = {
  chip: 'border-teal-200 bg-teal-50 text-teal-700',
  chipOnDark: 'border-teal-400/25 bg-teal-500/15 text-teal-200',
  dot: 'bg-teal-500',
}

const PINK: TagPalette = {
  chip: 'border-pink-200 bg-pink-50 text-pink-700',
  chipOnDark: 'border-pink-400/25 bg-pink-500/15 text-pink-200',
  dot: 'bg-pink-500',
}

const ORANGE: TagPalette = {
  chip: 'border-orange-200 bg-orange-50 text-orange-700',
  chipOnDark: 'border-orange-400/25 bg-orange-500/15 text-orange-200',
  dot: 'bg-orange-500',
}

/** Every palette a hashed tag may land on. */
const FALLBACK_PALETTES: TagPalette[] = [
  BLUE,
  PURPLE,
  TEAL,
  AMBER,
  PINK,
  GREEN,
  ORANGE,
  RED,
]

/**
 * Names with an established meaning. Matching is on the normalised name, so
 * "In Progress" and "in  progress" resolve to the same entry.
 */
const SEMANTIC: Record<string, TagPalette> = {
  urgent: RED,
  important: RED,
  critical: RED,
  blocked: RED,

  'in progress': AMBER,
  doing: AMBER,
  wip: AMBER,
  todo: AMBER,
  pending: AMBER,

  completed: GREEN,
  complete: GREEN,
  done: GREEN,
  finished: GREEN,
  shipped: GREEN,

  reference: BLUE,
  docs: BLUE,
  documentation: BLUE,
  info: BLUE,

  ideas: PURPLE,
  idea: PURPLE,
  brainstorm: PURPLE,
  research: PURPLE,
}

function normalise(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Stable hash of the tag name. Any non-cryptographic spread will do; what
 * matters is that it never changes between renders, servers or sessions, so a
 * tag keeps its colour for good.
 */
function hash(value: string): number {
  let total = 0

  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % 100000
  }

  return total
}

/** The palette for a tag name. Never returns undefined. */
export function tagPalette(name: string): TagPalette {
  const key = normalise(name)
  const semantic = SEMANTIC[key]

  if (semantic) {
    return semantic
  }

  return FALLBACK_PALETTES[hash(key) % FALLBACK_PALETTES.length]
}
