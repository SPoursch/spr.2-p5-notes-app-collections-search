import { getAuthenticatedUser } from '../db'
import { failure, type NoteActionState } from './note-action-state'

/**
 * Authentication guard for the mutation Server Actions.
 *
 * A Server Action is a public POST endpoint, not a page. The guard in
 * app/workspace/layout.tsx protects what is *rendered*; it does nothing to
 * stop an action from being *invoked* directly by anyone holding its id. So
 * every action that writes has to authorise the request itself, which is what
 * both the Next.js and Supabase docs require of a server function.
 *
 * The check is `getAuthenticatedUser`, which verifies the token signature
 * rather than trusting the session cookie as sent. No identity is ever read
 * from the submitted FormData: a client-supplied user id would be worth
 * nothing, since the client is what is being checked.
 *
 * This module is deliberately not a `'use server'` file — those may only
 * export async functions, and every export becomes a callable endpoint.
 * It is also deliberately separate from note-action-state.ts, which client
 * components import: pulling app/lib/db.ts in there would drag the Supabase
 * client and `next/headers` into the browser bundle.
 */

/** Shown when an action is invoked without a session. */
const SIGNED_OUT_MESSAGE = 'You need to be signed in.'

/**
 * Returns a failure state when nobody is signed in, or null to proceed.
 *
 * Shaped as "the reason to stop, or nothing" so a caller is one line:
 *
 *     const denied = await requireUser()
 *     if (denied) return denied
 *
 * Callers run this before validating input and before any write, so an
 * unauthenticated request cannot reach the database or learn anything from
 * the validation messages.
 */
export async function requireUser(): Promise<NoteActionState | null> {
  const user = await getAuthenticatedUser()

  if (user) {
    return null
  }

  return failure(SIGNED_OUT_MESSAGE)
}
