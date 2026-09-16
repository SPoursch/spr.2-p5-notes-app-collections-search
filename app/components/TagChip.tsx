import { tagPalette } from '@/app/lib/tag-colors'

/**
 * Shared tag presentation.
 *
 * Every place a tag appears goes through here, so one name looks identical in
 * the sidebar filter, on a note row and in the editor. `surface` picks the
 * variant for the navy sidebar or for the light panes; the colour itself comes
 * from app/lib/tag-colors.ts and is the same either way.
 */

export type TagSurface = 'light' | 'dark'

/**
 * Classes for a tag pill, for callers that must supply their own element —
 * a Link in the filter, a form in the editor.
 */
export function tagChipClasses(
  name: string,
  surface: TagSurface,
  selected = false,
): string {
  const palette = tagPalette(name)
  const base =
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-medium leading-none transition-colors'
  const tone = surface === 'dark' ? palette.chipOnDark : palette.chip
  // The ring is the only selected signal, so the colour still identifies the
  // tag while the state says whether the filter is on.
  const state = selected
    ? surface === 'dark'
      ? 'ring-2 ring-white/40'
      : 'ring-2 ring-slate-900/25'
    : ''

  return `${base} ${tone} ${state}`.trim()
}

/** The dot that precedes a tag name. */
export function TagDot({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className={`size-2 shrink-0 rounded-full ${tagPalette(name).dot}`}
    />
  )
}

/** A plain, non-interactive tag pill. */
export function TagChip({
  name,
  surface = 'light',
}: {
  name: string
  surface?: TagSurface
}) {
  return (
    <span className={tagChipClasses(name, surface)}>
      <TagDot name={name} />
      {name}
    </span>
  )
}
