'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  sendPasswordResetEmail,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  startGoogleSignIn,
  updatePassword,
} from '../db'
import { failure, success, type NoteActionState } from './note-action-state'
import { requireUser } from './require-auth'

/**
 * Server Actions for authentication (Part 6).
 *
 * These mirror the other action modules: they own input validation and the
 * mapping from a failure to a user-safe message, and they never touch
 * supabase-js. Every call is delegated to app/lib/db.ts, per CLAUDE.md.
 *
 * A Server Action is a public POST endpoint, so all input is treated as
 * untrusted. Passwords are forwarded to Supabase Auth and never stored,
 * logged or compared here.
 */

/** Where a signed-in user lands, and where a signed-out one is sent. */
const WORKSPACE_PATH = '/workspace'
const LOGIN_PATH = '/login'

/**
 * Where Supabase sends the browser after verifying a reset link.
 *
 * Deliberately bare, with no query string of its own: Supabase appends the
 * result of the verification to this URL, and a URL that already carries
 * parameters is one more thing that has to merge correctly. The confirm route
 * knows its own default destination, so nothing needs passing here. It also
 * means the value matches the Supabase redirect allow-list entry exactly.
 */
const CONFIRM_PATH = '/auth/confirm'

/** Supabase Auth's own minimum. Rejecting shorter input here saves a round trip. */
const MIN_PASSWORD_LENGTH = 6

type Credentials = { email: string; password: string }

/**
 * Reads and validates the two credential fields.
 *
 * The email is only checked for the shape of an address; Supabase Auth is the
 * authority on whether it is deliverable or already registered.
 */
function readCredentials(
  formData: FormData,
): { ok: true; value: Credentials } | { ok: false; message: string } {
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')

  if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
    return { ok: false, message: 'Enter an email address and a password.' }
  }

  const email = rawEmail.trim()

  if (email.length === 0) {
    return { ok: false, message: 'Enter your email address.' }
  }

  if (!email.includes('@') || email.length > 320) {
    return { ok: false, message: 'Enter a valid email address.' }
  }

  // Not trimmed: spaces are legitimate password characters, and trimming would
  // silently change what the user typed.
  if (rawPassword.length === 0) {
    return { ok: false, message: 'Enter your password.' }
  }

  return { ok: true, value: { email, password: rawPassword } }
}

/**
 * The origin this request arrived on, or null when it cannot be determined.
 *
 * Used to build the URLs Supabase redirects back to, so no host is hardcoded
 * and the flows work unchanged on localhost. A Server Action is a POST, so the
 * browser sends `Origin` and it already carries the scheme. `Host` is the
 * fallback and needs a scheme added: `x-forwarded-proto` behind a proxy,
 * otherwise http, which is what a localhost dev server actually serves.
 *
 * Whatever this returns must still appear in the Supabase redirect allow-list;
 * that is a dashboard setting and is what stops an arbitrary origin being used.
 */
async function requestOrigin(): Promise<string | null> {
  const requestHeaders = await headers()

  const origin = requestHeaders.get('origin')

  if (origin) {
    return origin
  }

  const host = requestHeaders.get('host')

  if (!host) {
    return null
  }

  const proto = requestHeaders.get('x-forwarded-proto') ?? 'http'

  return `${proto}://${host}`
}

/**
 * Signs in with an email address and password, then sends the user to the
 * workspace.
 *
 * `redirect` throws the framework's navigation signal, so it is called after
 * the sign-in has succeeded and outside any try/catch.
 */
export async function signInAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = readCredentials(formData)

  if (!parsed.ok) {
    return failure(parsed.message)
  }

  const result = await signInWithPassword(
    parsed.value.email,
    parsed.value.password,
  )

  if (!result.ok) {
    return failure(result.message ?? 'Could not sign in. Please try again.')
  }

  redirect(WORKSPACE_PATH)
}

/**
 * Registers a new account.
 *
 * When the project has email confirmation switched on, sign-up returns no
 * session; that case arrives here as a failed result carrying an explanatory
 * message, and the user stays on the form rather than being redirected to a
 * workspace they cannot yet reach.
 */
export async function signUpAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = readCredentials(formData)

  if (!parsed.ok) {
    return failure(parsed.message)
  }

  if (parsed.value.password.length < MIN_PASSWORD_LENGTH) {
    return failure(
      `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
    )
  }

  const result = await signUpWithPassword(
    parsed.value.email,
    parsed.value.password,
  )

  if (!result.ok) {
    return failure(result.message ?? 'Could not create the account.')
  }

  redirect(WORKSPACE_PATH)
}

/** Ends the session and returns to the login page. */
export async function signOutAction(): Promise<void> {
  await signOut()

  redirect(LOGIN_PATH)
}

/**
 * Begins Google sign-in by redirecting to the provider.
 *
 * The callback URL is built from the request's own origin rather than from a
 * configured value, so no new environment variable is needed and the flow
 * works unchanged on localhost. The origin must still be listed in the
 * Supabase redirect allow-list, which is a dashboard setting.
 */
export async function signInWithGoogleAction(): Promise<NoteActionState> {
  const baseUrl = await requestOrigin()

  if (!baseUrl) {
    return failure('Google sign-in is unavailable right now.')
  }

  const { url, message } = await startGoogleSignIn(`${baseUrl}/auth/callback`)

  if (!url) {
    return failure(message ?? 'Google sign-in is unavailable right now.')
  }

  redirect(url)
}

/**
 * Sends a password-reset email.
 *
 * Reports the same success whether or not the address has an account. Telling
 * the user "no account with that email" would make this form a way of testing
 * which addresses are registered, so the outcome is deliberately identical.
 * A genuine failure to *send* is still reported, since that is about the
 * service rather than about the address.
 *
 * The link Supabase emails points at /auth/confirm, which verifies the token
 * and forwards to the page that collects the new password.
 */
export async function requestPasswordResetAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const raw = formData.get('email')

  if (typeof raw !== 'string') {
    return failure('Enter your email address.')
  }

  const email = raw.trim()

  if (email.length === 0) {
    return failure('Enter your email address.')
  }

  if (!email.includes('@') || email.length > 320) {
    return failure('Enter a valid email address.')
  }

  const baseUrl = await requestOrigin()

  if (!baseUrl) {
    return failure('Password reset is unavailable right now.')
  }

  const result = await sendPasswordResetEmail(email, `${baseUrl}${CONFIRM_PATH}`)

  if (!result.ok) {
    // The underlying message is logged in app/lib/db.ts, not shown: a raw
    // Supabase error can name rate limits or delivery internals.
    return failure('Could not send the reset email. Please try again.')
  }

  return success()
}

/**
 * Sets a new password for the user the current session belongs to.
 *
 * Authorisation is the session, checked two ways. `requireUser()` verifies the
 * token's signature before anything else, so an unauthenticated POST to this
 * action is rejected outright rather than reaching Supabase. Beyond that,
 * `updateUser` acts only on the session's own user and takes no user id, so
 * even a valid session cannot change someone else's password.
 *
 * Reaching here normally means /auth/confirm has just verified a recovery
 * token and established the session it carried. A signed-in user changing
 * their own password uses the same path.
 */
export async function updatePasswordAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const denied = await requireUser()

  if (denied) {
    return failure(
      'That reset link is no longer valid. Request a new one and try again.',
    )
  }

  const raw = formData.get('password')

  if (typeof raw !== 'string' || raw.length === 0) {
    return failure('Enter a new password.')
  }

  // Not trimmed: spaces are legitimate password characters, and trimming would
  // silently change what the user typed.
  if (raw.length < MIN_PASSWORD_LENGTH) {
    return failure(
      `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
    )
  }

  const confirmation = formData.get('confirmPassword')

  if (typeof confirmation === 'string' && confirmation !== raw) {
    return failure('Those passwords do not match.')
  }

  const result = await updatePassword(raw)

  if (!result.ok) {
    // The underlying message is logged server-side in app/lib/db.ts rather
    // than shown: Supabase's text here can describe rate limits and password
    // policy internals.
    return failure('Could not update the password. Please try again.')
  }

  redirect(WORKSPACE_PATH)
}
