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
        className="rounded-[10px] border border-red-200 bg-pane px-4 py-2 text-[15px] font-semibold text-danger transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Deleting…' : 'Delete'}
      </button>

      {state.message ? (
        <span role="alert" className="text-[14px] text-danger">
          {state.message}
        </span>
      ) : null}
    </form>
  )
}
