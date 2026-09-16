import Link from 'next/link'

import type { Note } from '@/app/lib/db'
import { noteHref } from '@/app/lib/workspace-url'

/**
 * One row in the note list pane.
 *
 * A Server Component: the row is a link that puts the note id in the URL, so
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
 * Date only, for the cramped second line of a row where the full timestamp
 * would crowd out the preview text.
 */
function formatRowDate(value: string | null): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(date)
}

export function NoteCard({
  note,
  selected,
  activeCollection,
}: {
  note: Note
  selected: boolean
  activeCollection: string | null
}) {
  const title = displayTitle(note.title)
  const body = note.body?.trim() ?? ''
  // `updated_at` is null until the note is first edited (a database trigger
  // sets it), so its presence alone identifies an edited note.
  const rowDate = formatRowDate(note.updated_at ?? note.created_at)

  return (
    <Link
      href={noteHref(activeCollection, note.id)}
      aria-current={selected ? 'true' : undefined}
      className={`block border-b border-divider px-4 py-2.5 transition-colors ${
        selected ? 'bg-selected' : 'hover:bg-black/[0.04] dark:hover:bg-white/5'
      }`}
    >
      <h3 className="truncate text-sm font-semibold">{title}</h3>

      <p className="mt-0.5 flex gap-2 text-xs text-muted">
        {rowDate ? <span className="shrink-0">{rowDate}</span> : null}
        <span className="min-w-0 flex-1 truncate">
          {body.length > 0 ? body : 'No additional text'}
        </span>
      </p>
    </Link>
  )
}
