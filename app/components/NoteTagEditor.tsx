'use client'

import { useActionState } from 'react'

import {
  addTagToNoteAction,
  createTagAction,
  removeTagFromNoteAction,
} from '@/app/lib/actions/tags'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'
import type { Note, Tag } from '@/app/lib/db'

/**
 * Tag area for the note on screen (requirement 9).
 *
 * A Client Component only because `useActionState` supplies the inline
 * messages and pending states; all three actions run on the server and are the
 * only things that reach the database.
 *
 * Three small forms rather than one: removing is per-tag, and adding an
 * existing tag and creating a new one are separate submissions with different
 * validation. Each keeps its own message so a failure names what failed.
 */
export function NoteTagEditor({
  note,
  tags,
  allTags,
}: {
  note: Note
  tags: Tag[]
  allTags: Tag[]
}) {
  const [addState, addAction, addPending] = useActionState(
    addTagToNoteAction,
    initialNoteActionState,
  )
  const [createState, createAction, createPending] = useActionState(
    createTagAction,
    initialNoteActionState,
  )
  const [removeState, removeAction, removePending] = useActionState(
    removeTagFromNoteAction,
    initialNoteActionState,
  )

  const attached = new Set(tags.map((tag) => tag.id))
  const available = allTags.filter((tag) => !attached.has(tag.id))

  const message = removeState.message ?? addState.message ?? createState.message

  return (
    <section aria-label="Tags" className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wide opacity-60">
        Tags
      </h3>

      {tags.length === 0 ? (
        <p className="text-xs text-muted">No tags on this note yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag.id}>
              {/* One form per tag: the tag id has to travel with the submit. */}
              <form action={removeAction} className="contents">
                <input type="hidden" name="noteId" value={note.id} />
                <input type="hidden" name="tagId" value={tag.id} />
                <span className="inline-flex items-center gap-1 rounded-full border border-divider px-2 py-0.5 text-xs">
                  {tag.name}
                  <button
                    type="submit"
                    disabled={removePending}
                    aria-label={`Remove tag ${tag.name}`}
                    className="leading-none opacity-50 transition-opacity hover:opacity-100 disabled:cursor-not-allowed"
                  >
                    ×
                  </button>
                </span>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {available.length > 0 ? (
          <form action={addAction} className="flex items-center gap-2">
            <input type="hidden" name="noteId" value={note.id} />
            <label htmlFor={`add-tag-${note.id}`} className="sr-only">
              Add an existing tag
            </label>
            <select
              id={`add-tag-${note.id}`}
              name="tagId"
              defaultValue=""
              className="min-w-0 rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
            >
              <option value="">Add existing tag…</option>
              {available.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addPending}
              className="shrink-0 rounded-md border border-divider px-2 py-1 text-xs font-medium transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5"
            >
              {addPending ? 'Adding…' : 'Add'}
            </button>
          </form>
        ) : null}

        {/* Creating a tag attaches it to this note in the same submission. */}
        <form action={createAction} className="flex items-center gap-2">
          <input type="hidden" name="noteId" value={note.id} />
          <label htmlFor={`new-tag-${note.id}`} className="sr-only">
            Create a new tag
          </label>
          <input
            id={`new-tag-${note.id}`}
            name="name"
            type="text"
            maxLength={50}
            placeholder="New tag"
            className="min-w-0 flex-1 rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
          />
          <button
            type="submit"
            disabled={createPending}
            className="shrink-0 rounded-md border border-divider px-2 py-1 text-xs font-medium transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5"
          >
            {createPending ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      {message ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {message}
        </p>
      ) : null}
    </section>
  )
}
