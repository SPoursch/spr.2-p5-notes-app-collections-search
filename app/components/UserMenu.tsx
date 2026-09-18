'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { SignOutButton } from './SignOutButton'

/**
 * Profile control for the top right of the workspace.
 *
 * A Client Component because a dropdown needs open/closed state and has to
 * notice clicks outside itself. It holds no identity of its own: every value
 * is a prop, read on the server from the verified session in
 * app/workspace/page.tsx. Nothing here fetches, stores or infers who the user
 * is, so there is no second source of truth to drift from the session.
 *
 * `name` and `avatarUrl` come from provider metadata the user can edit, so
 * they are shown and never trusted — see the AuthUser docs in app/lib/db.ts.
 */

/** Everything the control displays. All of it arrives from the server. */
export type UserMenuProps = {
  email: string | null
  name: string | null
  avatarUrl: string | null
  provider: string | null
}

/**
 * Up to two initials, preferring the display name and falling back to the
 * email's local part. Returns a person-shaped glyph substitute rather than an
 * empty circle when neither is usable.
 */
function initialsFrom(name: string | null, email: string | null): string {
  const source = name ?? email?.split('@')[0] ?? ''

  const words = source
    .split(/[\s._-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0)

  if (words.length === 0) {
    return '?'
  }

  const letters =
    words.length === 1
      ? words[0].slice(0, 2)
      : `${words[0][0]}${words[words.length - 1][0]}`

  return letters.toUpperCase()
}

/** "google" -> "Google", so the provider reads as a word rather than a key. */
function providerLabel(provider: string | null): string | null {
  if (!provider) {
    return null
  }

  if (provider === 'email') {
    return 'Email and password'
  }

  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

/**
 * The avatar, or initials when there is no usable image.
 *
 * `onError` is what keeps a broken image off the screen: a metadata URL can
 * 404 or be blocked long after sign-in, and without this the control would
 * render the browser's broken-image glyph. Failing over to initials means the
 * control always shows something deliberate.
 */
function Avatar({
  src,
  initials,
  size,
}: {
  src: string | null
  initials: string
  size: 'sm' | 'lg'
}) {
  const [failed, setFailed] = useState(false)

  const box = size === 'sm' ? 'size-8' : 'size-11'
  const text = size === 'sm' ? 'text-[12px]' : 'text-[15px]'

  if (src && !failed) {
    return (
      // A plain <img>, not next/image: the host is whatever the identity
      // provider uses, which is not knowable at build time, and next/image
      // requires every remote host to be whitelisted in next.config.ts. That
      // would make adding a second social provider a config change.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${box} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`${box} ${text} flex shrink-0 items-center justify-center rounded-full bg-selected font-semibold text-primary`}
    >
      {initials}
    </span>
  )
}

export function UserMenu({ email, name, avatarUrl, provider }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const initials = initialsFrom(name, email)
  const primaryLine = name ?? email ?? 'Signed in'
  const signedInWith = providerLabel(provider)

  // Close on an outside click and on Escape. `pointerdown` rather than
  // `click` so the menu closes on press, matching how native menus feel, and
  // so a click that lands on another control is not swallowed by a late close.
  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="flex max-w-[13rem] items-center gap-2 rounded-full border border-border bg-card py-1 pr-1 pl-1 transition-colors hover:bg-workspace sm:pl-3"
      >
        {/*
          Below `sm` only the avatar shows. A full name or email in the header
          would either wrap the row or be truncated to nothing useful on a
          narrow screen, and the same text is one tap away in the dropdown.
        */}
        <span className="hidden min-w-0 truncate text-[14px] font-medium text-foreground sm:block">
          {primaryLine}
        </span>

        <Avatar src={avatarUrl} initials={initials} size="sm" />

        <span className="sr-only">Account menu</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute top-full right-0 z-50 mt-2 w-[17rem] overflow-hidden rounded-[var(--radius-card)] border border-border bg-pane shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <Avatar src={avatarUrl} initials={initials} size="lg" />

            <div className="min-w-0">
              {name ? (
                <p className="truncate text-[15px] font-semibold text-foreground">
                  {name}
                </p>
              ) : null}

              {/*
                `break-all` rather than `truncate`: an email is the one thing a
                user may need to read in full to tell two accounts apart, so it
                wraps instead of being cut off.
              */}
              <p className="text-[13px] break-all text-muted">
                {email ?? 'No email on this account'}
              </p>
            </div>
          </div>

          {signedInWith ? (
            <dl className="border-b border-border px-4 py-3">
              <dt className="text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">
                Signed in with
              </dt>
              <dd className="mt-0.5 text-[14px] text-foreground">
                {signedInWith}
              </dd>
            </dl>
          ) : null}

          <div className="p-2">
            <SignOutButton
              onSignOut={() => setOpen(false)}
              className="w-full rounded-[var(--radius-control)] px-3 py-2 text-left text-[14px] font-medium text-foreground transition-colors hover:bg-workspace disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
