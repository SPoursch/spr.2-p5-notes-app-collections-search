/**
 * Shared result contract between the notes and collections Server Actions and
 * the client components that drive them with `useActionState`.
 *
 * This lives outside the `'use server'` action modules deliberately. Those
 * files register every value they export as a callable server reference and
 * reject anything that is not an async function, so the initial state and the
 * result constructors — a plain object and two synchronous functions — belong
 * in an ordinary module that the actions and the client components can both
 * import.
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

/**
 * Builds a failed result carrying a message safe to show a user.
 *
 * Shared rather than redefined per action module so that every action returns
 * the same shape: a message-less failure renders as nothing at all in the
 * current consumers, so the two constructors are what keep that state from
 * occurring.
 */
export function failure(message: string): NoteActionState {
  return { ok: false, message, at: Date.now() }
}

/** Builds a successful result. Success carries no message. */
export function success(): NoteActionState {
  return { ok: true, message: null, at: Date.now() }
}
