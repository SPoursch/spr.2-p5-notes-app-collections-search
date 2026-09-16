import type { Collection, Note, Tag } from '@/app/lib/db'

import { DeleteNoteButton } from './DeleteNoteButton'
import { NoteCollectionPicker } from './NoteCollectionPicker'
import { NoteTagEditor } from './NoteTagEditor'
import { NoteForm } from './NoteForm'
import { displayTitle, formatTimestamp } from './NoteCard'

/**
 * Editor pane for the note selected via `?note=<id>`.
 *
 * A Server Component. It renders the same stored values as the list row and
 * reuses its title and timestamp helpers, but with document proportions. The
 * content column is capped for readability and sits against the left edge of
 * the pane, so the slack goes to the right rather than splitting either side.
 *
 * The interactive parts are the Client Components the app already uses, so
 * edit and delete behave exactly as before.
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
    ? `Edited ${edited}`
    : created
      ? `Created ${created}`
      : null

  return (
    <article aria-label="Selected note" className="max-w-2xl px-8 py-6">
      {timestampLabel ? (
        <p className="text-xs text-muted">{timestampLabel}</p>
      ) : null}

      <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance">
        {title}
      </h2>

      {/* Requirement 9: the tags area the metadata row reserved. */}
      <div className="mt-3">
        <NoteTagEditor note={note} tags={tags} allTags={allTags} />
      </div>

      {body.length > 0 ? (
        <p className="mt-5 whitespace-pre-wrap text-[15px]/7">{body}</p>
      ) : (
        <p className="mt-5 text-[15px] italic text-muted">
          This note has no content yet. Use Edit note below to add some.
        </p>
      )}

      {/* Requirement 8: reassign the note on screen without leaving the pane. */}
      <div className="mt-8 max-w-sm border-t border-divider pt-5">
        <NoteCollectionPicker note={note} collections={collections} />
      </div>

      <details className="mt-6">
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="rounded-md border border-divider px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5">
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
    </article>
  )
}
