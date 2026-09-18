import { redirect } from 'next/navigation'

import { AuthShell } from '@/app/components/AuthShell'
import { ResetPasswordForm } from '@/app/components/ResetPasswordForm'
import { getAuthenticatedUser } from '@/app/lib/db'

/**
 * "Set a new password" page (Part 8 optional feature).
 *
 * Reached from a recovery link, after /auth/confirm has verified the token and
 * turned it into a session. That makes this an ordinary protected page: the
 * check below is the same server-side, signature-verifying check the workspace
 * uses, so arriving here without a valid session is not possible.
 *
 * Someone who opens this URL directly, or whose link has expired, is sent to
 * /forgot-password rather than to a form that could not work — the page there
 * explains why and issues a new link.
 *
 * The page never sees the recovery token. It was consumed by /auth/confirm and
 * exists only as a session cookie by this point.
 */
export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/forgot-password?error=recovery')
  }

  return (
    <AuthShell
      heading="Set a new password"
      description={
        user.email
          ? `Choose a new password for ${user.email}.`
          : 'Choose a new password for your account.'
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  )
}
