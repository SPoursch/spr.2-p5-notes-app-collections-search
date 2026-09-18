import { AuthShell } from '@/app/components/AuthShell'
import { ForgotPasswordForm } from '@/app/components/ForgotPasswordForm'

/**
 * "Forgot password" page (Part 8 optional feature).
 *
 * A Server Component; only the form is a Client Component. Deliberately
 * reachable while signed out, and left reachable while signed in too — someone
 * with a session may still want a reset link, and redirecting them away would
 * be surprising.
 */
export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  // Set by /auth/confirm when a recovery link could not be verified — usually
  // expired or already used. Landing here rather than on /login puts the
  // person straight in front of the form that issues a new one.
  const { error } = await searchParams
  const linkExpired = (Array.isArray(error) ? error[0] : error) === 'recovery'

  return (
    <AuthShell
      heading="Reset your password"
      description="Enter your email address and we'll send you a link to set a new one."
    >
      <ForgotPasswordForm linkExpired={linkExpired} />
    </AuthShell>
  )
}
