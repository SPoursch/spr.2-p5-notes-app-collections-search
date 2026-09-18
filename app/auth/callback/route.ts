import { NextResponse } from 'next/server'

import { exchangeAuthCode } from '@/app/lib/db'

/**
 * OAuth callback (Part 6).
 *
 * Google sends the browser back here with a one-time authorization code. The
 * code is exchanged for a session server-side, and `@supabase/ssr` writes that
 * session to cookies on this response — which is why the exchange has to
 * happen in a route handler rather than in a Server Component, where cookies
 * cannot be set.
 *
 * No OAuth logic is implemented here: building the provider URL, the PKCE
 * verifier and the token exchange all belong to Supabase Auth. This handler
 * only passes the code along and decides where to send the browser next.
 *
 * The matching dashboard setting is the redirect allow-list, which must
 * contain this route's URL.
 */

/** Where a completed sign-in lands, and where a failed one reports back. */
const WORKSPACE_PATH = '/workspace'
const LOGIN_PATH = '/login'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  // Google reports a refusal — a cancelled consent screen, or an account that
  // is not on the test-user list — as an `error` parameter rather than a code.
  const providerError =
    searchParams.get('error_description') ?? searchParams.get('error')

  if (providerError) {
    console.error('[auth] Google returned an error:', providerError)

    return NextResponse.redirect(`${origin}${LOGIN_PATH}?error=google`)
  }

  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}${LOGIN_PATH}?error=google`)
  }

  const result = await exchangeAuthCode(code)

  if (!result.ok) {
    return NextResponse.redirect(`${origin}${LOGIN_PATH}?error=google`)
  }

  return NextResponse.redirect(`${origin}${WORKSPACE_PATH}`)
}
