'use client'

import { useActionState } from 'react'

import { signOutAction } from '@/app/lib/actions/auth'

/**
 * Sign-out control for the workspace sidebar (Part 6, requirement 6).
 *
 * A Client Component only for the pending label; the action itself runs on the
 * server, clears the session cookies and redirects to /login.
 */
export function SignOutButton() {
  const [, formAction, pending] = useActionState(async () => {
    await signOutAction()
  }, undefined)

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[10px] border border-white/15 px-3 py-2 text-[14px] font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </form>
  )
}
