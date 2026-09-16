import { CollectionSidebar } from '@/app/components/CollectionSidebar'
import { NoteList } from '@/app/components/NoteList'
import { SelectedNote } from '@/app/components/SelectedNote'
import {
  listCollections,
  listNotes,
  type Collection,
  type Note,
} from '@/app/lib/db'
import { UNCOLLECTED } from '@/app/lib/workspace-url'

/**
 * Three-pane workspace: the collections tree, the notes of the collection
 * being viewed, and the editor for whichever note is selected.
 *
 * An async Server Component: both reads happen on the server at request time,
 * so app/lib/db.ts and the Supabase client never reach the browser bundle.
 * Notes are grouped and filtered in memory from the two arrays loaded here, so
 * neither the tree nor the collection filter costs an extra query.
 *
 * From `md` up the three panes fill the viewport and scroll independently.
 * Below that they stack into one scrolling column.
 *
 * `force-dynamic` opts out of static prerendering. Without it the lists would
 * be queried once at build time and baked into a static page.
 */
export const dynamic = 'force-dynamic'

/** Query values arrive as `string | string[]`; only the first one is used. */
function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ note?: string | string[]; collection?: string | string[] }>
}) {
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

  // Read separately rather than with Promise.all so that a failing collections
  // query degrades the sidebar only, leaving the notes workspace usable.
  let collections: Collection[] = []
  let collectionsFailed = false

  try {
    collections = await listCollections()
  } catch (error) {
    console.error('[collections] failed to load collections:', error)
    collectionsFailed = true
  }

  // Both selections come from the URL, so no client-side state is involved.
  const { note: noteParam, collection: collectionParam } = await searchParams
  const requestedNoteId = firstValue(noteParam)
  const activeCollection = firstValue(collectionParam)

  const selectedNote =
    notes.find((candidate) => candidate.id === requestedNoteId) ?? null

  // A `?note=` that matches nothing is reported rather than ignored: the row
  // may have been deleted, or the link may be stale.
  const selectionMissing = Boolean(requestedNoteId) && selectedNote === null

  // The named collection, if the parameter points at one. A parameter that
  // matches no row is a stale link and is reported in the list pane.
  const namedCollection =
    activeCollection !== null && activeCollection !== UNCOLLECTED
      ? (collections.find((entry) => entry.id === activeCollection) ?? null)
      : null

  const collectionMissing =
    activeCollection !== null &&
    activeCollection !== UNCOLLECTED &&
    namedCollection === null

  // The list pane shows one collection at a time; the sidebar tree keeps
  // showing every note, which is what requirement 6 describes.
  let visibleNotes: Note[]

  if (activeCollection === null) {
    visibleNotes = notes
  } else if (activeCollection === UNCOLLECTED) {
    visibleNotes = notes.filter((note) => note.collection_id === null)
  } else {
    visibleNotes = notes.filter(
      (note) => note.collection_id === activeCollection,
    )
  }

  const listTitle =
    activeCollection === null
      ? 'All notes'
      : activeCollection === UNCOLLECTED
        ? 'Uncollected'
        : (namedCollection?.name ?? 'Collection')

  return (
    <div className="flex w-full flex-col md:h-dvh md:flex-row md:overflow-hidden">
      <CollectionSidebar
        collections={collections}
        notes={notes}
        loadFailed={collectionsFailed}
        selectedNoteId={selectedNote?.id ?? null}
        activeCollection={activeCollection}
      />

      <NoteList
        notes={collectionMissing ? [] : visibleNotes}
        collections={collections}
        title={listTitle}
        loadFailed={loadFailed}
        collectionMissing={collectionMissing}
        selectedNoteId={selectedNote?.id ?? null}
        activeCollection={activeCollection}
      />

      <main
        aria-label="Note"
        className="flex min-w-0 flex-1 flex-col bg-pane md:h-full md:overflow-y-auto"
      >
        {selectionMissing ? (
          <p className="border-b border-divider px-8 py-3 text-sm text-muted">
            That note is no longer available. It may have been deleted.
          </p>
        ) : null}

        {selectedNote ? (
          <SelectedNote note={selectedNote} collections={collections} />
        ) : (
          /*
            Requirement 12: no blank pane. Creating a note lives in the list
            pane now, so this says what to do rather than repeating that form.
          */
          <section aria-label="No note selected" className="max-w-2xl px-8 py-6">
            <h2 className="text-2xl font-bold tracking-tight">No note selected</h2>
            <p className="mt-1 text-sm text-muted">
              Pick a note from the list to read and edit it, or add one with the
              New note box at the foot of that pane.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
