import { NextResponse } from 'next/server'

import { exchangeAuthCode, verifyEmailToken } from '@/app/lib/db'

/**
 * Password-recovery landing route (Part 8 — password reset).
 *
 * This is where Supabase sends the browser after it has verified a reset link.
 * It establishes the session on the server and forwards to the page that
 * collects the new password. No token is parsed, generated or validated here:
 * Supabase Auth owns all of that.
 *
 * WHY IT ACCEPTS TWO SHAPES
 *
 * The hosted project cannot edit its email templates without custom SMTP, so
 * the default "Reset Password" template is what we get. That template links to
 * Supabase's own `/auth/v1/verify` endpoint, which consumes the token and then
 * redirects here — and what it appends depends on how the reset was requested:
 *
 * - `?code=…` when the request carried a PKCE code challenge. `@supabase/ssr`
 *   sets `flowType: 'pkce'`, and `resetPasswordForEmail` sends a challenge on
 *   that flow, so this is the shape this project actually receives.
 * - `?token_hash=…&type=recovery` if a custom template is ever configured to
 *   emit `{{ .TokenHash }}` directly. Supported here so that switching to a
 *   custom template later needs no code change.
 *
 * Both paths end in a server-side session written to cookies. Neither exposes
 * a token to client-side JavaScript, and neither needs a browser-side recovery
 * listener.
 *
 * KNOWN LIMITATION
 *
 * The PKCE code exchange needs the code verifier stored when the reset was
 * requested, and that verifier is a cookie in the browser that submitted the
 * form. Opening the email on a different browser or device therefore fails,
 * and lands on the retry page. That is inherent to PKCE with the default
 * template, not something this route can work around.
 */

/**
 * Where a failed confirmation reports back to.
 *
 * The forgot-password page rather than the login page: a link that failed is
 * almost always expired, already used, or opened on another device, and that
 * page both explains it and issues a new one.
 */
const RETRY_PATH = '/forgot-password?error=recovery'

/** Used when the link carries no usable `next`. */
const DEFAULT_NEXT = '/reset-password'

/**
 * The only token type this route accepts.
 *
 * Restricting it means the route cannot be repurposed by putting a different
 * `type` in the query string — an invite or email-change token presented here
 * is rejected rather than silently consumed.
 */
const ACCEPTED_TYPE = 'recovery'

/**
 * Returns `candidate` when it is a safe same-origin path, otherwise the
 * default.
 *
 * `next` arrives from a URL, so it is untrusted. Checking only for a leading
 * "/" is not enough: `//evil.example` is a protocol-relative URL that browsers
 * resolve to another host, and a backslash is treated as a slash by some
 * browsers. Both are rejected here, so this route cannot be used to bounce
 * someone off-site.
 */
function safeNext(candidate: string | null): string {
  if (!candidate) {
    return DEFAULT_NEXT
  }

  const isRelative =
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !candidate.startsWith('/\\') &&
    !candidate.includes('\\')

  return isRelative ? candidate : DEFAULT_NEXT
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const next = safeNext(searchParams.get('next'))
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  // The PKCE shape, which is what the default hosted template produces here.
  if (code) {
    const exchanged = await exchangeAuthCode(code)

    return NextResponse.redirect(
      exchanged.ok ? `${origin}${next}` : `${origin}${RETRY_PATH}`,
    )
  }

  // The custom-template shape. Kept so a future SMTP/template change needs no
  // code change; `type` is still pinned to recovery.
  if (tokenHash && type === ACCEPTED_TYPE) {
    const verified = await verifyEmailToken(tokenHash, ACCEPTED_TYPE)

    return NextResponse.redirect(
      verified.ok ? `${origin}${next}` : `${origin}${RETRY_PATH}`,
    )
  }

  // Neither shape present. This also covers an implicit-flow link, whose
  // tokens arrive in a URL fragment the server never receives — there is
  // nothing to verify, so it is treated as a failed link rather than guessed
  // at with client-side JavaScript.
  return NextResponse.redirect(`${origin}${RETRY_PATH}`)
}
