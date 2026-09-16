import { CollectionSidebar } from '@/app/components/CollectionSidebar'
import { NoteList } from '@/app/components/NoteList'
import { SelectedNote } from '@/app/components/SelectedNote'
import { TagFilter } from '@/app/components/TagFilter'
import {
  listCollections,
  listNotes,
  listTags,
  listTagsByNote,
  type Collection,
  type Note,
  type Tag,
} from '@/app/lib/db'
import { UNCOLLECTED, type WorkspaceState } from '@/app/lib/workspace-url'

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
  searchParams: Promise<{
    note?: string | string[]
    collection?: string | string[]
    tag?: string | string[]
    q?: string | string[]
  }>
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

  // Tags are read once for the whole page: one query for the tag list and one
  // for every pairing, then grouped in memory. Reading them per note would be
  // a query per row of the list pane.
  let allTags: Tag[] = []
  let tagsByNote = new Map<string, Tag[]>()

  try {
    allTags = await listTags()
    tagsByNote = await listTagsByNote()
  } catch (error) {
    // Degrade to "no tags" rather than blanking the workspace: the tables may
    // not exist yet, since their SQL is run by hand.
    console.error('[tags] failed to load tags:', error)
  }

  // Both selections come from the URL, so no client-side state is involved.
  const {
    note: noteParam,
    collection: collectionParam,
    tag: tagParam,
    q: queryParam,
  } = await searchParams
  const requestedNoteId = firstValue(noteParam)
  const activeCollection = firstValue(collectionParam)

  // `tag` may repeat; keep only ids that still exist so a stale link cannot
  // filter everything away with a tag that has since been deleted.
  const knownTagIds = new Set(allTags.map((tag) => tag.id))
  const requestedTags = (
    Array.isArray(tagParam) ? tagParam : tagParam ? [tagParam] : []
  ).filter((id) => knownTagIds.has(id))

  const searchQuery = (firstValue(queryParam) ?? '').trim()

  // The single object every link builder needs to preserve the other panes.
  const workspaceState: WorkspaceState = {
    collection: activeCollection,
    tags: requestedTags,
    query: searchQuery.length > 0 ? searchQuery : null,
    note: requestedNoteId,
  }

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

  // Requirement 10: AND logic — a note must carry every selected tag.
  if (requestedTags.length > 0) {
    visibleNotes = visibleNotes.filter((note) => {
      const noteTagIds = new Set(
        (tagsByNote.get(note.id) ?? []).map((tag) => tag.id),
      )

      return requestedTags.every((id) => noteTagIds.has(id))
    })
  }

  // Requirement 11: title and body, case-insensitive, applied after the tag
  // filter so search respects it rather than widening past it.
  //
  // Tag names are searched too, which is a superset of what requirement 11
  // asks for. It means one box finds a note either by what it says or by how
  // it is labelled, without having to hunt for the tag in the sidebar filter.
  // The sidebar filter is still the way to narrow by tag precisely, since it
  // ANDs the selected tags; this matches any one of them as text.
  //
  // Each field is matched on its own rather than concatenated into one string.
  // Joining them would let a query match across a boundary — "test reference"
  // hitting a note whose body ends "test" and whose first tag is "reference",
  // a phrase present in neither field.
  if (searchQuery.length > 0) {
    const needle = searchQuery.toLowerCase()

    visibleNotes = visibleNotes.filter((note) => {
      const fields = [
        note.title ?? '',
        note.body ?? '',
        ...(tagsByNote.get(note.id) ?? []).map((tag) => tag.name),
      ]

      return fields.some((field) => field.toLowerCase().includes(needle))
    })
  }

  const listTitle =
    activeCollection === null
      ? 'All notes'
      : activeCollection === UNCOLLECTED
        ? 'Uncollected'
        : (namedCollection?.name ?? 'Collection')

  return (
    <div className="flex w-full flex-col bg-workspace md:h-dvh md:flex-row md:overflow-hidden">
      <CollectionSidebar
        collections={collections}
        notes={notes}
        loadFailed={collectionsFailed}
        selectedNoteId={selectedNote?.id ?? null}
        activeCollection={activeCollection}
        state={workspaceState}
        tagFilter={<TagFilter tags={allTags} state={workspaceState} />}
      />

      <NoteList
        notes={collectionMissing ? [] : visibleNotes}
        collections={collections}
        title={listTitle}
        loadFailed={loadFailed}
        collectionMissing={collectionMissing}
        selectedNoteId={selectedNote?.id ?? null}
        activeCollection={activeCollection}
        tagsByNote={tagsByNote}
        state={workspaceState}
        searchQuery={searchQuery}
        selectedTagCount={requestedTags.length}
      />

      <main
        aria-label="Note"
        className="flex min-w-0 flex-1 flex-col bg-pane md:h-full md:overflow-y-auto"
      >
        {selectionMissing ? (
          <p className="border-b border-border bg-amber-50 px-8 py-3 text-[14px] text-amber-900">
            That note is no longer available. It may have been deleted.
          </p>
        ) : null}

        {selectedNote ? (
          <SelectedNote
            note={selectedNote}
            collections={collections}
            tags={tagsByNote.get(selectedNote.id) ?? []}
            allTags={allTags}
          />
        ) : (
          /*
            Requirement 12: no blank pane. Creating a note lives in the list
            pane now, so this says what to do rather than repeating that form.
          */
          <section
            aria-label="No note selected"
            className="w-full max-w-4xl px-6 py-6 md:px-8"
          >
            <div className="rounded-[var(--radius-card)] border border-dashed border-border-strong bg-pane px-6 py-10 text-center">
              <h2 className="text-[22px] font-bold tracking-tight">
                No note selected
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
                Pick a note from the list to read and edit it, or add one with
                the New note box at the foot of that pane.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
