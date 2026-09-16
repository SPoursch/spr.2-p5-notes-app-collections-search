import Link from 'next/link'

import type { Note, Tag } from '@/app/lib/db'
import { noteHref, type WorkspaceState } from '@/app/lib/workspace-url'

import { TagChip } from './TagChip'

/**
 * One card in the note list pane.
 *
 * A Server Component: the card is a link that puts the note id in the URL, so
 * selection needs no client-side state. Editing and deleting live in the
 * editor pane on the right, which is where the selected note is rendered.
 */

/**
 * Titles are nullable and may be blank, so fall back to "Untitled" rather than
 * rendering an empty heading.
 */
export function displayTitle(title: string | null): string {
  const trimmed = title?.trim()

  return trimmed && trimmed.length > 0 ? trimmed : 'Untitled'
}

/** Shared with the selected-note workspace, which renders the same labels. */
export function formatTimestamp(value: string | null): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

/**
 * Date only, for the card's footer row where the full timestamp would crowd
 * out the tags beside it.
 */
function formatRowDate(value: string | null): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date)
}

export function NoteCard({
  note,
  selected,
  tags,
  state,
}: {
  note: Note
  selected: boolean
  tags: Tag[]
  state: WorkspaceState
}) {
  const title = displayTitle(note.title)
  const body = note.body?.trim() ?? ''
  // `updated_at` is null until the note is first edited (a database trigger
  // sets it), so its presence alone identifies an edited note.
  const rowDate = formatRowDate(note.updated_at ?? note.created_at)

  return (
    <Link
      href={noteHref(state, note.id)}
      aria-current={selected ? 'true' : undefined}
      className={`block rounded-[var(--radius-card)] border p-4 transition-colors ${
        selected
          ? 'border-selected-border bg-selected'
          : 'border-border bg-card hover:border-border-strong hover:bg-slate-50'
      }`}
    >
      <h3
        className={`truncate text-[16px] font-semibold leading-snug ${
          selected ? 'text-primary' : 'text-foreground'
        }`}
      >
        {title}
      </h3>

      {/* Two lines of preview: enough to recognise a note, short enough that
          the cards stay evenly scannable. */}
      <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-muted">
        {body.length > 0 ? body : 'No additional text'}
      </p>

      {/* Requirement 9: tags appear on the note's card in the list. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {tags.map((tag) => (
          <TagChip key={tag.id} name={tag.name} />
        ))}

        {rowDate ? (
          <span className="ml-auto shrink-0 text-[14px] text-muted">
            {rowDate}
          </span>
        ) : null}
      </div>
    </Link>
  )
}
