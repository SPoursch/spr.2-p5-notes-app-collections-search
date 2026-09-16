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
        className="text-[13px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted"
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
          className="min-w-0 flex-1 rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-[15px] text-sidebar-foreground outline-none placeholder:text-sidebar-muted focus:border-ring"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Create collection"
          className="shrink-0 rounded-[10px] bg-indigo-500 px-3.5 py-2 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>

      {state.message ? (
        <p role="alert" className="text-[13px] text-red-300">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
