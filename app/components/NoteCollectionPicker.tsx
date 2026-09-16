'use client'

import { useActionState } from 'react'

import { setNoteCollectionAction } from '@/app/lib/actions/collections'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'
import type { Collection, Note } from '@/app/lib/db'

/**
 * Collection picker for the note on screen (requirement 8).
 *
 * A Client Component only because `useActionState` is a hook, supplying the
 * inline message and the pending state; `setNoteCollectionAction` runs on the
 * server and is the only thing that reaches the database.
 *
 * A field with a button beside it, matching the two create forms, so the
 * change is explicit and the control still works without JavaScript. "No
 * collection" is a real choice, not a blank option: requirement 4 allows a
 * note to sit outside every collection.
 */
export function NoteCollectionPicker({
  note,
  collections,
}: {
  note: Note
  collections: Collection[]
}) {
  const [state, formAction, pending] = useActionState(
    setNoteCollectionAction,
    initialNoteActionState,
  )

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="noteId" value={note.id} />

      <label
        htmlFor={`collection-${note.id}`}
        className="text-xs font-medium uppercase tracking-wide opacity-60"
      >
        Collection
      </label>

      <div className="flex items-center gap-2">
        {/*
          Remounted when the stored collection changes, so the control shows
          what is saved rather than the value left behind by the last render.
        */}
        <select
          key={note.collection_id ?? ''}
          id={`collection-${note.id}`}
          name="collectionId"
          defaultValue={note.collection_id ?? ''}
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
        >
          <option value="">No collection</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-foreground px-2.5 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Moving…' : 'Move'}
        </button>
      </div>

      {state.message ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {state.message}
        </p>
      ) : null}

      {state.ok ? (
        <p aria-live="polite" className="text-xs text-muted">
          Moved.
        </p>
      ) : null}
    </form>
  )
}
