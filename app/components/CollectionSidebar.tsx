import Link from 'next/link'

import type { Collection, Note } from '@/app/lib/db'
import { UNCOLLECTED, collectionHref, noteHref } from '@/app/lib/workspace-url'

import { displayTitle } from './NoteCard'
import { NewCollectionForm } from './NewCollectionForm'

/**
 * Collections navigation tree (requirement 6).
 *
 * A Server Component. Expand and collapse use native <details>/<summary>, so
 * the tree needs no client-side state and ships no JavaScript. Only the
 * "New collection" control below it is a Client Component.
 *
 * Clicking a collection name does two things at once: the native <summary>
 * expands the group in place, and the link inside it points the list pane at
 * that collection. Notes are grouped in memory from the two arrays the page
 * already loaded, so rendering the tree costs no additional queries.
 */

/** Sole inline icons; no icon library is introduced for this. */
function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="size-3 shrink-0 opacity-50 transition-transform duration-150 group-open:rotate-90"
    >
      <path d="M4 2.5 8 6l-4 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 opacity-60">
      <path
        d="M1.5 4.5A1.5 1.5 0 0 1 3 3h2.6a1.5 1.5 0 0 1 1.06.44l.9.9H13a1.5 1.5 0 0 1 1.5 1.5v6.16A1.5 1.5 0 0 1 13 13.5H3a1.5 1.5 0 0 1-1.5-1.5v-7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0 opacity-45">
      <path
        d="M4 1.5h5L12.5 5v9.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8.75 1.75V5.25h3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * One expandable group. Collection headers and the "Uncollected" group share
 * this treatment so the tree reads consistently.
 */
function CollectionGroup({
  label,
  groupKey,
  notes,
  emptyLabel,
  selectedNoteId,
  activeCollection,
}: {
  label: string
  groupKey: string
  notes: Note[]
  emptyLabel: string
  selectedNoteId: string | null
  activeCollection: string | null
}) {
  const isActive = activeCollection === groupKey

  // Open the group being viewed, and the group holding the selected note, so
  // that arriving directly on a URL reveals the highlighted entry.
  const holdsSelection =
    selectedNoteId !== null && notes.some((note) => note.id === selectedNoteId)
  const open = isActive || holdsSelection

  return (
    // The key forces a remount whenever the server-rendered `open` value
    // changes. Without it React would keep whatever state the native toggle
    // left behind, and a freshly selected collection could render collapsed.
    <details key={`${groupKey}-${open}`} className="group" open={open}>
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 rounded-md pr-2 text-sm font-medium transition-colors [&::-webkit-details-marker]:hidden ${
          isActive ? 'bg-selected' : 'hover:bg-black/[0.04] dark:hover:bg-white/5'
        }`}
      >
        <span className="pl-2">
          <ChevronIcon />
        </span>

        <Link
          href={collectionHref(groupKey)}
          aria-current={isActive ? 'page' : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5"
        >
          <FolderIcon />
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </Link>

        <span className="shrink-0 text-xs font-normal text-muted">
          {notes.length}
        </span>
      </summary>

      {/* Indentation plus a subtle connector line, aligned under the folder icon. */}
      <div className="ml-[1.35rem] border-l border-divider pl-2">
        {notes.length === 0 ? (
          <p className="px-2 py-1.5 text-xs italic text-muted">{emptyLabel}</p>
        ) : (
          <ul>
            {notes.map((note) => {
              const selected = note.id === selectedNoteId

              return (
                <li key={note.id}>
                  <Link
                    href={noteHref(groupKey, note.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors ${
                      selected
                        ? 'bg-selected font-medium'
                        : 'text-muted hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/5'
                    }`}
                  >
                    <NoteIcon />
                    <span className="min-w-0 flex-1 truncate">
                      {displayTitle(note.title)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </details>
  )
}

export function CollectionSidebar({
  collections,
  notes,
  loadFailed,
  selectedNoteId,
  activeCollection,
}: {
  collections: Collection[]
  notes: Note[]
  loadFailed: boolean
  selectedNoteId: string | null
  activeCollection: string | null
}) {
  // Each note appears exactly once: under its collection, or under
  // "Uncollected" when collection_id is null.
  const byCollection = new Map<string, Note[]>()
  const uncollected: Note[] = []

  for (const note of notes) {
    if (note.collection_id === null) {
      uncollected.push(note)
      continue
    }

    const group = byCollection.get(note.collection_id) ?? []
    group.push(note)
    byCollection.set(note.collection_id, group)
  }

  const showingAll = activeCollection === null

  return (
    <aside
      aria-label="Collections"
      className="flex shrink-0 flex-col border-b border-divider bg-sidebar md:h-full md:w-[240px] md:border-b-0 md:border-r"
    >
      <h2 className="shrink-0 px-4 py-3 text-sm font-semibold tracking-tight">
        Collections
      </h2>

      <nav className="min-h-0 flex-1 px-2 md:overflow-y-auto">
        {loadFailed ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            Collections couldn&apos;t be loaded. Your notes are listed in full on
            the right.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {/* Clears the filter, so the list pane shows every note again. */}
            <Link
              href={collectionHref(null)}
              aria-current={showingAll ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 pl-[1.4rem] text-sm font-medium transition-colors ${
                showingAll
                  ? 'bg-selected'
                  : 'hover:bg-black/[0.04] dark:hover:bg-white/5'
              }`}
            >
              <FolderIcon />
              <span className="min-w-0 flex-1 truncate">All notes</span>
              <span className="shrink-0 text-xs font-normal text-muted">
                {notes.length}
              </span>
            </Link>

            {collections.map((collection) => (
              <CollectionGroup
                key={collection.id}
                groupKey={collection.id}
                label={collection.name}
                notes={byCollection.get(collection.id) ?? []}
                emptyLabel="No notes in this collection yet."
                selectedNoteId={selectedNoteId}
                activeCollection={activeCollection}
              />
            ))}

            <CollectionGroup
              groupKey={UNCOLLECTED}
              label="Uncollected"
              notes={uncollected}
              emptyLabel="Every note belongs to a collection."
              selectedNoteId={selectedNoteId}
              activeCollection={activeCollection}
            />

            {collections.length === 0 ? (
              <p className="mt-1 px-2 text-xs text-muted">
                No collections yet. Create one below to start grouping your
                notes.
              </p>
            ) : null}
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-divider px-4 py-3">
        <NewCollectionForm />
      </div>
    </aside>
  )
}
