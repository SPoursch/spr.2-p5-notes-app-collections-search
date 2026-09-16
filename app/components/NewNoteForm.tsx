'use client'

import { useActionState, useEffect, useRef } from 'react'

import { createNoteAction } from '@/app/lib/actions/notes'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'
import type { Collection } from '@/app/lib/db'

/**
 * "New note" control for the foot of the list pane.
 *
 * Mirrors NewCollectionForm: a single field with an Add button beside it, and
 * the same validation and pending treatment. The collection picker files the
 * new note directly (requirements 4 and 8), which is why a note created while
 * viewing a collection now lands in it rather than in "Uncollected".
 *
 * A Client Component only because `useActionState` is a hook. The options come
 * from the server on every render, so creating or removing a collection
 * refreshes this dropdown through the action's own `revalidatePath`.
 */
export function NewNoteForm({
  collections,
  activeCollection,
}: {
  collections: Collection[]
  activeCollection: string | null
}) {
  const [state, formAction, pending] = useActionState(
    createNoteAction,
    initialNoteActionState,
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the field after a successful save so the next note starts blank,
  // matching how the new-collection form behaves.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
    }
  }, [state.ok, state.at])

  // Default to the collection being viewed, so adding a note where you are
  // looking files it there. "Uncollected" and "All notes" default to none.
  const defaultCollectionId =
    activeCollection !== null &&
    collections.some((collection) => collection.id === activeCollection)
      ? activeCollection
      : ''

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <label
        htmlFor="new-note-title"
        className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted"
      >
        New note
      </label>

      <div className="flex items-center gap-2">
        <input
          id="new-note-title"
          name="title"
          type="text"
          maxLength={200}
          placeholder="Note title"
          className="min-w-0 flex-1 rounded-[10px] border border-border bg-pane px-3 py-2 text-[15px] outline-none placeholder:text-slate-400 focus:border-ring"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Create note"
          className="shrink-0 rounded-[10px] bg-primary px-3.5 py-2 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>

      <label
        htmlFor="new-note-collection"
        className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted"
      >
        Collection
      </label>

      {/*
        Remounted when the viewed collection changes: an uncontrolled <select>
        keeps whatever the reader last picked, so without the key the default
        would stop following the pane they are looking at.
      */}
      <select
        key={defaultCollectionId}
        id="new-note-collection"
        name="collectionId"
        defaultValue={defaultCollectionId}
        className="w-full rounded-[10px] border border-border bg-pane px-3 py-2 text-[15px] outline-none focus:border-ring"
      >
        <option value="">No collection</option>
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.name}
          </option>
        ))}
      </select>

      {state.message ? (
        <p role="alert" className="text-[13px] text-danger">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
