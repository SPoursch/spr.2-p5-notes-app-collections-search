'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { updatePasswordAction } from '@/app/lib/actions/auth'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'

import {
  ERROR_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  SUBMIT_CLASS,
} from './LoginForm'

/**
 * Sets a new password.
 *
 * A Client Component only for `useActionState`. It knows nothing about the
 * recovery token: by the time this renders, /auth/confirm has already verified
 * the token and turned it into a session cookie, so this form is an ordinary
 * authenticated write. Nothing here reads, parses or forwards a token, and no
 * password is stored anywhere on the client.
 *
 * There is no success state to render. `updatePasswordAction` redirects to the
 * workspace when the update succeeds, so the only message that can appear is a
 * failure.
 */
export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialNoteActionState,
  )

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={LABEL_CLASS}>
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            className={FIELD_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className={LABEL_CLASS}>
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Type it again"
            className={FIELD_CLASS}
          />
        </div>

        {state.message ? (
          <p role="alert" className={ERROR_CLASS}>
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={SUBMIT_CLASS}>
          {pending ? 'Saving…' : 'Save new password'}
        </button>
      </form>

      {/*
        A way out if the link was opened by mistake, or the wrong account is
        signed in. Signing out is its own action elsewhere; this is just a link.
      */}
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
