import type { Collection, Note, Tag } from '@/app/lib/db'

import { DeleteNoteButton } from './DeleteNoteButton'
import { NoteCollectionPicker } from './NoteCollectionPicker'
import { NoteTagEditor } from './NoteTagEditor'
import { NoteForm } from './NoteForm'
import { displayTitle, formatTimestamp } from './NoteCard'

/**
 * Editor pane for the note selected via `?note=<id>`.
 *
 * A Server Component. It renders the same stored values as the list card and
 * reuses its title and timestamp helpers, but with document proportions: the
 * title, the tags and the body each sit on their own surface, which is what
 * gives the pane its layered reading.
 *
 * The content column is capped for readability and sits against the left edge
 * of the pane, so the slack goes to the right rather than splitting either
 * side. The interactive parts are the Client Components the app already uses,
 * so edit, delete, tagging and reassignment behave exactly as before.
 */
export function SelectedNote({
  note,
  collections,
  tags,
  allTags,
}: {
  note: Note
  collections: Collection[]
  tags: Tag[]
  allTags: Tag[]
}) {
  const title = displayTitle(note.title)
  const body = note.body?.trim() ?? ''
  const edited = formatTimestamp(note.updated_at)
  const created = formatTimestamp(note.created_at)
  const timestampLabel = edited
    ? `Last updated: ${edited}`
    : created
      ? `Created: ${created}`
      : null

  return (
    <article
      aria-label="Selected note"
      className="w-full max-w-4xl px-6 py-6 md:px-8"
    >
      <h2 className="rounded-[var(--radius-card)] border border-border bg-pane px-5 py-4 text-[26px] font-bold tracking-tight text-balance shadow-sm">
        {title}
      </h2>

      {/* Requirement 9: add and remove tags on the note being viewed. */}
      <div className="mt-4">
        <NoteTagEditor note={note} tags={tags} allTags={allTags} />
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-pane p-5 shadow-sm">
        {body.length > 0 ? (
          <p className="whitespace-pre-wrap text-[16px]/7">{body}</p>
        ) : (
          <p className="text-[16px] italic text-muted">
            This note has no content yet. Use Edit note below to add some.
          </p>
        )}
      </div>

      {timestampLabel ? (
        <p className="mt-3 text-right text-[13px] text-muted">
          {timestampLabel}
        </p>
      ) : null}

      <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-pane p-5 shadow-sm">
        {/* Requirement 8: reassign the note on screen without leaving the pane. */}
        <div className="max-w-sm">
          <NoteCollectionPicker note={note} collections={collections} />
        </div>

        <details className="mt-5 border-t border-border pt-5">
          <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <span className="rounded-[10px] border border-border bg-pane px-4 py-2 text-[15px] font-semibold transition-colors hover:bg-slate-50">
              Edit note
            </span>
          </summary>

          <div className="mt-4">
            <NoteForm mode="edit" note={note} />
          </div>
        </details>

        <div className="mt-4">
          <DeleteNoteButton noteId={note.id} noteLabel={title} />
        </div>
      </div>
    </article>
  )
}
