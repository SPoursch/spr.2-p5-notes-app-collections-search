import Image from 'next/image'

/**
 * Page shell for the signed-out screens.
 *
 * A Server Component holding the layout the login page established: the navy
 * brand panel beside a centred content column, on the same tokens as the
 * workspace. The password-reset pages use it so they read as the same product
 * rather than as detached utility screens.
 *
 * `app/login/page.tsx` still carries its own copy of this markup. It was
 * written before there was a second signed-out page, and moving it here would
 * mean editing the login route as part of a password-reset change — worth
 * doing as its own tidy-up rather than folded into this one.
 */
export function AuthShell({
  heading,
  description,
  children,
}: {
  /** The content column's heading, e.g. "Reset your password". */
  heading: string
  /** One line under it saying what this screen is for. */
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Brand panel: the sidebar's navy, so every screen shares a surface. */}
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
            Collections, tags and search in one workspace.
          </p>
        </div>

        <p className="mt-10 hidden text-[13px] text-sidebar-muted md:block">
          The workspace is available to signed-in users only.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold tracking-tight">{heading}</h2>
          <p className="mt-1.5 mb-7 text-[15px] text-muted">{description}</p>

          {children}
        </div>
      </main>
    </div>
  )
}
