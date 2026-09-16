'use client'

import { useActionState } from 'react'

import { deleteNoteAction } from '@/app/lib/actions/notes'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'

/**
 * Delete control for a single note.
 *
 * A Client Component so it can confirm before deleting and show a pending
 * state. The deletion itself runs in a Server Action.
 */
export function DeleteNoteButton({
  noteId,
  noteLabel,
}: {
  noteId: string
  noteLabel: string
}) {
  const [state, formAction, pending] = useActionState(
    deleteNoteAction,
    initialNoteActionState,
  )

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={noteId} />
      <button
        type="submit"
        disabled={pending}
        onClick={(event) => {
          if (!window.confirm(`Delete “${noteLabel}”? This cannot be undone.`)) {
            event.preventDefault()
          }
        }}
        className="rounded-md border border-black/15 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        {pending ? 'Deleting…' : 'Delete'}
      </button>

      {state.message ? (
        <span role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.message}
        </span>
      ) : null}
    </form>
  )
}
