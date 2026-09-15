import type { Note } from '@/app/lib/db'

import { DeleteNoteButton } from './DeleteNoteButton'
import { NoteForm } from './NoteForm'

/**
 * Presentation for a single note. A Server Component: it renders the stored
 * values and delegates only the interactive parts (edit form, delete) to
 * Client Components.
 *
 * Edit mode uses a native <details> element rather than client-side state, so
 * the card itself never needs to become a Client Component.
 */

/**
 * Titles are nullable and may be blank, so fall back to "Untitled" rather than
 * rendering an empty heading.
 */
export function displayTitle(title: string | null): string {
  const trimmed = title?.trim()

  return trimmed && trimmed.length > 0 ? trimmed : 'Untitled'
}

function formatTimestamp(value: string | null): string | null {
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
 * Milliseconds by which `updated_at` must exceed `created_at` before the note
 * counts as edited.
 *
 * The two values come from different clocks — `created_at` from the database
 * default, `updated_at` from the application (see app/lib/db.ts) — so an exact
 * comparison would report a phantom edit whenever those clocks disagree by a
 * few milliseconds. A short tolerance absorbs that skew; anything longer is a
 * real edit, since edits are human actions.
 */
const EDIT_THRESHOLD_MS = 2000

/**
 * Reports whether a note has actually been edited since it was created.
 *
 * `updated_at` is written on create as well as on update, so its presence
 * alone proves nothing: every note would claim to have been edited the moment
 * it was created. The timestamps have to be compared instead.
 *
 * With no usable `created_at` there is nothing to compare against, so the sole
 * remaining timestamp is reported as an edit rather than invented as a
 * creation time.
 */
function wasEdited(createdAt: string | null, updatedAt: string | null): boolean {
  if (!updatedAt) {
    return false
  }

  const updated = new Date(updatedAt).getTime()

  if (Number.isNaN(updated)) {
    return false
  }

  if (!createdAt) {
    return true
  }

  const created = new Date(createdAt).getTime()

  if (Number.isNaN(created)) {
    return true
  }

  return updated - created > EDIT_THRESHOLD_MS
}

export function NoteCard({ note }: { note: Note }) {
  const title = displayTitle(note.title)
  const body = note.body?.trim() ?? ''
  const edited = formatTimestamp(note.updated_at)
  const created = formatTimestamp(note.created_at)
  const timestampLabel =
    wasEdited(note.created_at, note.updated_at) && edited
      ? `Edited ${edited}`
      : created
        ? `Created ${created}`
        : null

  return (
    <article className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <h3 className="text-base font-semibold">{title}</h3>

      {body.length > 0 ? (
        <p className="mt-2 whitespace-pre-wrap text-sm opacity-90">{body}</p>
      ) : (
        <p className="mt-2 text-sm italic opacity-50">No content yet.</p>
      )}

      {timestampLabel ? (
        <p className="mt-3 text-xs opacity-60">{timestampLabel}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <details className="grow">
          <summary className="cursor-pointer text-sm underline underline-offset-4 opacity-80 hover:opacity-100">
            Edit
          </summary>
          <div className="mt-3 border-t border-black/10 pt-3 dark:border-white/15">
            <NoteForm mode="edit" note={note} />
          </div>
        </details>

        <DeleteNoteButton noteId={note.id} noteLabel={title} />
      </div>
    </article>
  )
}
