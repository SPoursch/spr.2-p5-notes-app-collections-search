import Image from 'next/image'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/app/components/LoginForm'
import { getAuthenticatedUser } from '@/app/lib/db'

/**
 * Sign-in page (Part 6, requirement 2).
 *
 * A Server Component: the session check happens here, and only the form
 * itself is a Client Component. Someone who is already signed in is sent
 * straight to the workspace rather than being shown a form they do not need.
 *
 * The visual language is the workspace's own — the navy brand panel, the same
 * tokens, the same radii — so this reads as the same product rather than a
 * bolted-on login screen.
 */
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const user = await getAuthenticatedUser()

  if (user) {
    redirect('/workspace')
  }

  // Set by the OAuth callback when Google did not complete the handshake.
  const { error } = await searchParams
  const providerFailed =
    (Array.isArray(error) ? error[0] : error) === 'google'

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Brand panel: the sidebar's navy, so the two screens share a surface. */}
      <aside className="flex shrink-0 flex-col justify-between bg-sidebar px-8 py-8 text-sidebar-foreground md:w-[42%] md:max-w-[520px] md:px-12 md:py-12">
        <div className="flex items-center gap-3">
          <Image
            src="/salesbound-logo.png"
            alt="SalesBound"
            width={80}
            height={80}
            priority
            className="size-10 shrink-0 rounded-xl object-contain"
          />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold leading-tight tracking-tight">
              SalesBound
            </p>
            <p className="truncate text-[13px] leading-tight text-sidebar-muted">
              NoteSpace
            </p>
          </div>
        </div>

        <div className="mt-10 md:mt-0">
          <h1 className="text-[30px] font-bold leading-tight tracking-tight md:text-[38px]">
            Your notes, organised.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-sidebar-muted">
            Collections, tags and search in one workspace. Sign in to pick up
            where you left off.
          </p>
        </div>

        {/*
          Deliberately says only what is true today: the workspace requires a
          sign-in. It makes no claim about notes being private per user, which
          the current row level security policies do not yet provide.
        */}
        <p className="mt-10 hidden text-[13px] text-sidebar-muted md:block">
          The workspace is available to signed-in users only.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold tracking-tight">Sign in</h2>
          <p className="mt-1.5 mb-7 text-[15px] text-muted">
            Use your email and password, or continue with Google.
          </p>

          <LoginForm providerFailed={providerFailed} />
        </div>
      </main>
    </div>
  )
}
