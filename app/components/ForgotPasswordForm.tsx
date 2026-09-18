'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { requestPasswordResetAction } from '@/app/lib/actions/auth'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'

import {
  ERROR_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  NOTICE_CLASS,
  SUBMIT_CLASS,
} from './LoginForm'

/**
 * Requests a password-reset email.
 *
 * A Client Component only because `useActionState` is a hook, matching every
 * other form in the app. The email address is submitted to a Server Action and
 * nothing is kept here: no token, no password, no browser storage.
 *
 * The success message deliberately does not say whether the address has an
 * account. The Server Action returns the same result either way, and repeating
 * that here is what keeps this form from being usable to test which addresses
 * are registered.
 */
export function ForgotPasswordForm({
  recoveryFailed,
}: {
  /** Set when /auth/confirm could not turn a recovery link into a session. */
  recoveryFailed: boolean
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialNoteActionState,
  )

  return (
    <div className="flex flex-col gap-5">
      {state.ok ? (
        /*
          The form is replaced rather than left on screen. There is nothing
          useful to do with it now, and leaving a filled field under a "check
          your email" message invites a second submission.
        */
        <div className={NOTICE_CLASS} role="status">
          <p className="font-semibold">Check your email</p>
          <p className="mt-1">
            If that address has an account, a link to reset the password is on
            its way. The link can only be used once, and expires shortly.
          </p>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={LABEL_CLASS}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              placeholder="you@example.com"
              className={FIELD_CLASS}
            />
          </div>

          {/*
            Deliberately not phrased as "expired". A recovery link also fails
            when it is opened somewhere other than the browser that asked for
            it, because the PKCE verifier is a cookie in that browser — see
            app/auth/confirm/route.ts. The server cannot tell the causes apart,
            so the message names all three rather than asserting the wrong one.
          */}
          {recoveryFailed ? (
            <p role="alert" className={ERROR_CLASS}>
              That reset link did not work. It may have expired, already been
              used, or been opened in a different browser or device from the one
              that requested it. Request a new link below, then open it in this
              browser.
            </p>
          ) : null}

          {state.message ? (
            <p role="alert" className={ERROR_CLASS}>
              {state.message}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className={SUBMIT_CLASS}>
            {pending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-center text-[14px] text-muted">
        <Link
          href="/login"
          className="font-medium underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
