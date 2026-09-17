'use client'

import { useActionState } from 'react'

import {
  signInAction,
  signInWithGoogleAction,
  signUpAction,
} from '@/app/lib/actions/auth'
import { initialNoteActionState } from '@/app/lib/actions/note-action-state'

/**
 * Email/password and Google sign-in controls (Part 6, requirement 2).
 *
 * A Client Component only because `useActionState` is a hook: it supplies the
 * inline message and the pending state, matching how NewCollectionForm and the
 * note forms already work. Every credential is handled by the Server Actions,
 * so no password and no Supabase call reaches the browser bundle.
 *
 * Sign in and sign up share one set of fields and are told apart by which
 * button was pressed, via `formAction`. Two separate forms would mean asking
 * for the same email and password twice on one screen.
 */

/** Google's mark, inline: no icon library is introduced for one button. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="size-[18px] shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}

const FIELD_CLASS =
  'w-full rounded-[var(--radius-control)] border border-border-strong bg-pane px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-ring'

const LABEL_CLASS =
  'text-[13px] font-semibold uppercase tracking-[0.08em] text-muted'

export function LoginForm({ providerFailed }: { providerFailed: boolean }) {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialNoteActionState,
  )

  // Sign-up shares the fields but is its own action, so it needs its own
  // dispatch: `formAction` on a button takes a one-argument function, which is
  // exactly what useActionState returns.
  const [signUpState, dispatchSignUp, signUpPending] = useActionState(
    signUpAction,
    initialNoteActionState,
  )

  // Google sign-in is its own form: it carries no fields, and pressing it must
  // not run the credential validation that the email form's action performs.
  const [googleState, googleAction, googlePending] = useActionState(
    signInWithGoogleAction,
    initialNoteActionState,
  )

  /*
    A successful sign-in redirects, so `state.ok` is never rendered. The only
    message that can appear is a failure — either a validation message or
    whatever Supabase Auth reported, including the "check your email"
    confirmation notice that sign-up returns when the project requires it.
  */
  const message =
    state.message ??
    signUpState.message ??
    googleState.message ??
    (providerFailed
      ? 'Google sign-in did not complete. Please try again.'
      : null)

  /* Any in-flight action disables all three buttons, so two cannot race. */
  const busy = pending || signUpPending || googlePending

  // The confirmation notice is guidance, not a fault, so it is not styled as
  // an error even though it arrives on the failure channel.
  const isNotice = message?.startsWith('Account created')

  return (
    <div className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={LABEL_CLASS}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={FIELD_CLASS}
          />
        </div>

        {message ? (
          <p
            role="alert"
            className={`rounded-[var(--radius-control)] border px-3.5 py-2.5 text-[14px] ${
              isNotice
                ? 'border-selected-border bg-selected text-foreground'
                : 'border-red-200 bg-red-50 text-danger'
            }`}
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="rounded-[var(--radius-control)] bg-primary px-4 py-2.5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-[14px] text-muted">
          New to NoteSpace?{' '}
          <button
            type="submit"
            formAction={dispatchSignUp}
            disabled={busy}
            className="font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signUpPending ? 'Creating account…' : 'Create an account'}
          </button>
        </p>
      </form>

      {/* OR divider */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border-strong" />
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
          or
        </span>
        <span className="h-px flex-1 bg-border-strong" />
      </div>

      <form action={googleAction}>
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-control)] border border-border-strong bg-pane px-4 py-2.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-workspace disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon />
          {googlePending ? 'Redirecting…' : 'Sign in with Google'}
        </button>
      </form>
    </div>
  )
}
