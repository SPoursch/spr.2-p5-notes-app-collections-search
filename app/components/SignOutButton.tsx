'use client'

import { useActionState } from 'react'

import { signOutAction } from '@/app/lib/actions/auth'

/**
 * Sign-out control for the workspace (Part 6, requirement 6).
 *
 * A Client Component only for the pending label; the action itself runs on the
 * server, clears the session cookies and redirects to /login.
 *
 * `className` exists so the profile dropdown can reuse this component on a
 * light surface rather than declaring a second sign-out button of its own.
 * There is one sign-out path in the application, and it is `signOutAction`.
 */

/** The sidebar's treatment, on the navy pane. */
const SIDEBAR_CLASS =
  'w-full rounded-[10px] border border-white/15 px-3 py-2 text-[14px] font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground disabled:cursor-not-allowed disabled:opacity-50'

export function SignOutButton({
  className = SIDEBAR_CLASS,
  onSignOut,
}: {
  className?: string
  /** Called as the action is submitted, so a menu can close itself. */
  onSignOut?: () => void
} = {}) {
  const [, formAction, pending] = useActionState(async () => {
    await signOutAction()
  }, undefined)

  return (
    <form action={formAction} onSubmit={onSignOut}>
      <button type="submit" disabled={pending} className={className}>
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </form>
  )
}
