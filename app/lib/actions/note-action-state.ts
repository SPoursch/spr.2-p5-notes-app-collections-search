/**
 * Shared result contract between the notes Server Actions and the client
 * components that drive them with `useActionState`.
 *
 * This lives outside app/lib/actions/notes.ts deliberately. That file is a
 * `'use server'` module, so Next.js registers every value it exports as a
 * callable server reference and rejects anything that is not an async
 * function. The initial state is a plain object, so it belongs in an ordinary
 * module that both the server actions and the client components can import.
 */

export type NoteActionState = {
  ok: boolean
  message: string | null
  /** Distinguishes consecutive results so the client can react to each one. */
  at: number
}

export const initialNoteActionState: NoteActionState = {
  ok: false,
  message: null,
  at: 0,
}
