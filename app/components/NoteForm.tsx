'use client'

import { useActionState, useEffect, useRef } from 'react'

import { createNoteAction, updateNoteAction } from '@/app/lib/actions/notes'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'
import type { Note } from '@/app/lib/db'

/**
 * Create / edit form for a note.
 *
 * This is a Client Component only because `useActionState` is a hook: it gives
 * inline validation messages and a pending state while the Server Action runs.
 * The action itself executes on the server and is the only thing that reaches
 * the database.
 */

type NoteFormProps =
  | { mode: 'create'; note?: undefined }
  | { mode: 'edit'; note: Note }

export function NoteForm({ mode, note }: NoteFormProps) {
  const action = mode === 'create' ? createNoteAction : updateNoteAction
  const [state, formAction, pending] = useActionState(
    action,
    initialNoteActionState,
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the create form after a successful save so the next note starts
  // blank. The edit form keeps its values, which now match what was stored.
  useEffect(() => {
    if (state.ok && mode === 'create') {
      formRef.current?.reset()
    }
  }, [state.ok, state.at, mode])

  const idPrefix = mode === 'edit' ? `edit-${note.id}` : 'create'

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {mode === 'edit' ? <input type="hidden" name="id" value={note.id} /> : null}

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}-title`}
          className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted"
        >
          Title
        </label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          type="text"
          maxLength={200}
          // `?? ''` matters: a null value would make this an uncontrolled input.
          defaultValue={note?.title ?? ''}
          placeholder="Untitled"
          className="rounded-[10px] border border-border bg-pane px-3 py-2 text-[15px] outline-none placeholder:text-slate-400 focus:border-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}-body`}
          className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted"
        >
          Note
        </label>
        <textarea
          id={`${idPrefix}-body`}
          name="body"
          rows={mode === 'create' ? 3 : 5}
          maxLength={10000}
          defaultValue={note?.body ?? ''}
          placeholder="Write something…"
          className="resize-y rounded-[10px] border border-border bg-pane px-3 py-2 text-[15px] leading-relaxed outline-none placeholder:text-slate-400 focus:border-ring"
        />
      </div>

      {state.message ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[14px] text-danger"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[10px] bg-primary px-4 py-2 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? mode === 'create'
              ? 'Adding…'
              : 'Saving…'
            : mode === 'create'
              ? 'Add note'
              : 'Save changes'}
        </button>

        {state.ok && mode === 'edit' ? (
          <span aria-live="polite" className="text-[14px] text-muted">
            Saved.
          </span>
        ) : null}
      </div>
    </form>
  )
}
