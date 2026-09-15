import { NoteCard } from '@/app/components/NoteCard'
import { NoteForm } from '@/app/components/NoteForm'
import { listNotes, type Note } from '@/app/lib/db'

/**
 * Notes workspace.
 *
 * An async Server Component: notes are read on the server at request time and
 * rendered to HTML, so app/lib/db.ts and the Supabase client never reach the
 * browser bundle.
 *
 * `force-dynamic` opts out of static prerendering. Without it the list would be
 * queried once at build time and baked into a static page.
 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  let notes: Note[] = []
  let loadFailed = false

  // A thrown error and an empty result mean different things, so they are kept
  // apart here: the catch branch renders "couldn't load", not "no notes yet".
  try {
    notes = await listNotes()
  } catch (error) {
    console.error('[notes] failed to load notes:', error)
    loadFailed = true
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
        <p className="mt-1 text-sm opacity-70">
          {loadFailed
            ? 'Your notes are unavailable right now.'
            : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
        </p>
      </header>

      <section
        aria-label="Create a note"
        className="mb-10 rounded-lg border border-black/10 p-4 dark:border-white/15"
      >
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-70">
          New note
        </h2>
        <NoteForm mode="create" />
      </section>

      <section aria-label="Your notes">
        {loadFailed ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
            <h2 className="text-base font-semibold text-red-800 dark:text-red-200">
              Couldn&apos;t load your notes
            </h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              The database could not be reached. Your notes are safe — reload the
              page to try again.
            </p>
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/20 p-10 text-center dark:border-white/20">
            <h2 className="text-base font-semibold">No notes yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm opacity-70">
              Notes you create will appear here. Use the{' '}
              <span className="font-medium">New note</span> form above to write
              your first one.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {notes.map((note) => (
              <li key={note.id}>
                <NoteCard note={note} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
