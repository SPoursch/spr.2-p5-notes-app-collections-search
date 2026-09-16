'use client'

import { useActionState, useEffect, useRef } from 'react'

import { createCollectionAction } from '@/app/lib/actions/collections'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'

/**
 * "New collection" control for the sidebar (requirement 7).
 *
 * A Client Component only because `useActionState` is a hook: it supplies the
 * inline validation message and the pending state. The action itself runs on
 * the server and is the only thing that reaches the database.
 */
export function NewCollectionForm() {
  const [state, formAction, pending] = useActionState(
    createCollectionAction,
    initialNoteActionState,
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the field after a successful save so the next name starts blank,
  // matching how the create-note form behaves.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
    }
  }, [state.ok, state.at])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <label
        htmlFor="new-collection-name"
        className="text-xs font-medium uppercase tracking-wide opacity-60"
      >
        New collection
      </label>

      <div className="flex items-center gap-2">
        <input
          id="new-collection-name"
          name="name"
          type="text"
          maxLength={100}
          placeholder="Collection name"
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Create collection"
          className="shrink-0 rounded-md bg-foreground px-2.5 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>

      {state.message ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
