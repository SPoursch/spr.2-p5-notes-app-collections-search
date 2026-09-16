'use client'

import { useActionState } from 'react'

import {
  addTagToNoteAction,
  createTagAction,
  removeTagFromNoteAction,
} from '@/app/lib/actions/tags'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'
import type { Note, Tag } from '@/app/lib/db'

import { TagDot, tagChipClasses } from './TagChip'

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
 *
 * Chips use the shared tag palette, so a tag looks the same here as it does on
 * its card in the list and in the sidebar filter.
 */
const CONTROL =
  'min-w-0 rounded-[10px] border border-border bg-pane px-3 py-1.5 text-[14px] outline-none placeholder:text-slate-400 focus:border-ring'
const CONTROL_BUTTON =
  'shrink-0 rounded-[10px] border border-border bg-pane px-3 py-1.5 text-[14px] font-semibold transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

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
    <section aria-label="Tags" className="flex flex-col gap-3">
      {tags.length === 0 ? (
        <p className="text-[14px] text-muted">No tags on this note yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              {/* One form per tag: the tag id has to travel with the submit. */}
              <form action={removeAction} className="contents">
                <input type="hidden" name="noteId" value={note.id} />
                <input type="hidden" name="tagId" value={tag.id} />
                <span className={tagChipClasses(tag.name, 'light')}>
                  <TagDot name={tag.name} />
                  {tag.name}
                  <button
                    type="submit"
                    disabled={removePending}
                    aria-label={`Remove tag ${tag.name}`}
                    className="ml-0.5 text-[15px] leading-none opacity-60 transition-opacity hover:opacity-100 disabled:cursor-not-allowed"
                  >
                    ×
                  </button>
                </span>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
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
              className={CONTROL}
            >
              <option value="">Add existing tag…</option>
              {available.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <button type="submit" disabled={addPending} className={CONTROL_BUTTON}>
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
            className={CONTROL}
          />
          <button
            type="submit"
            disabled={createPending}
            className={CONTROL_BUTTON}
          >
            {createPending ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      {message ? (
        <p role="alert" className="text-[13px] text-danger">
          {message}
        </p>
      ) : null}
    </section>
  )
}
