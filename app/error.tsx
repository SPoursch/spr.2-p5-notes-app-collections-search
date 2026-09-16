'use client'

/**
 * Route-level error boundary. Next.js requires this to be a Client Component.
 *
 * Expected failures (a database read or write that fails) are handled inline by
 * the page and the forms. This boundary is the backstop for genuinely
 * unexpected exceptions, so it shows a generic message rather than error
 * details.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm opacity-75">
        The notes workspace could not be displayed. This is usually temporary.
      </p>
      <div>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
