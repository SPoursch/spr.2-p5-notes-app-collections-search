import Link from 'next/link'

import type { Collection, Note } from '@/app/lib/db'
import {
  UNCOLLECTED,
  collectionHref,
  noteHref,
  type WorkspaceState,
} from '@/app/lib/workspace-url'

import { BrandHeader } from './BrandHeader'
import { displayTitle } from './NoteCard'
import { NewCollectionForm } from './NewCollectionForm'
import { SignOutButton } from './SignOutButton'

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
 *
 * Layout: the tree scrolls between a fixed brand block and a fixed footer. The
 * footer holds the tag filter, which puts it at the foot of the pane alongside
 * the "New note" form in the pane beside it.
 */

/** Sole inline icons; no icon library is introduced for this. */
function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="size-3 shrink-0 opacity-60 transition-transform duration-150 group-open:rotate-90"
    >
      <path d="M4 2.5 8 6l-4 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 opacity-70">
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
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0 opacity-60">
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

/** Shared by the collection rows and the "All notes" row. */
const ROW_BASE =
  'flex items-center gap-2.5 rounded-[10px] text-[15px] font-medium transition-colors'

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
  state,
}: {
  label: string
  groupKey: string
  notes: Note[]
  emptyLabel: string
  selectedNoteId: string | null
  activeCollection: string | null
  state: WorkspaceState
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
        className={`${ROW_BASE} cursor-pointer list-none pr-2.5 [&::-webkit-details-marker]:hidden ${
          isActive
            ? 'bg-sidebar-active text-sidebar-foreground'
            : 'text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-sidebar-foreground'
        }`}
      >
        <span className="pl-2.5">
          <ChevronIcon />
        </span>

        <Link
          href={collectionHref(state, groupKey)}
          aria-current={isActive ? 'page' : undefined}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-2"
        >
          <FolderIcon />
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </Link>

        <span className="shrink-0 text-[13px] font-normal tabular-nums text-sidebar-muted">
          {notes.length}
        </span>
      </summary>

      {/* Indentation plus a connector line, aligned under the folder icon. */}
      <div className="mt-0.5 ml-[1.6rem] border-l border-sidebar-border pl-2">
        {notes.length === 0 ? (
          <p className="px-2.5 py-1.5 text-[13px] italic text-sidebar-muted">
            {emptyLabel}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {notes.map((note) => {
              const selected = note.id === selectedNoteId

              return (
                <li key={note.id}>
                  <Link
                    href={noteHref(state, note.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={`flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[14px] transition-colors ${
                      selected
                        ? 'bg-sidebar-active font-medium text-sidebar-foreground'
                        : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
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
  state,
  tagFilter,
  userEmail,
}: {
  collections: Collection[]
  notes: Note[]
  loadFailed: boolean
  selectedNoteId: string | null
  activeCollection: string | null
  state: WorkspaceState
  tagFilter: React.ReactNode
  /** The signed-in user, shown above the sign-out control. */
  userEmail: string | null
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
      className="flex shrink-0 flex-col bg-sidebar text-sidebar-foreground md:h-full md:w-[264px]"
    >
      <BrandHeader />

      <nav className="min-h-0 flex-1 px-3 pb-3 md:overflow-y-auto">
        {/* Clears the filter, so the list pane shows every note again. */}
        <Link
          href={collectionHref(state, null)}
          aria-current={showingAll ? 'page' : undefined}
          className={`${ROW_BASE} px-2.5 py-2 ${
            showingAll
              ? 'bg-sidebar-active text-sidebar-foreground'
              : 'text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-sidebar-foreground'
          }`}
        >
          <FolderIcon />
          <span className="min-w-0 flex-1 truncate">All notes</span>
          <span className="shrink-0 text-[13px] font-normal tabular-nums text-sidebar-muted">
            {notes.length}
          </span>
        </Link>

        <h2 className="mt-5 mb-2 px-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
          Collections
        </h2>

        {loadFailed ? (
          <p className="rounded-[10px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
            Collections couldn&apos;t be loaded. Your notes are listed in full
            in the next pane.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {collections.map((collection) => (
              <CollectionGroup
                key={collection.id}
                groupKey={collection.id}
                label={collection.name}
                notes={byCollection.get(collection.id) ?? []}
                emptyLabel="No notes in this collection yet."
                selectedNoteId={selectedNoteId}
                activeCollection={activeCollection}
                state={state}
              />
            ))}

            <CollectionGroup
              groupKey={UNCOLLECTED}
              label="Uncollected"
              notes={uncollected}
              emptyLabel="Every note belongs to a collection."
              selectedNoteId={selectedNoteId}
              activeCollection={activeCollection}
              state={state}
            />

            {collections.length === 0 ? (
              <p className="mt-1 px-2.5 text-[13px] text-sidebar-muted">
                No collections yet. Create one below to start grouping your
                notes.
              </p>
            ) : null}
          </div>
        )}
      </nav>

      {/*
        Pinned footer. The tag filter sits here rather than above the tree so
        that its block ends at the foot of the pane, level with the "New note"
        form in the list pane beside it.
      */}
      <div className="shrink-0 border-t border-sidebar-border">
        {tagFilter}

        <div className="border-t border-sidebar-border px-4 py-4">
          <NewCollectionForm />
        </div>

        {/* Account block: who is signed in, and the way out (requirement 6). */}
        <div className="flex flex-col gap-2 border-t border-sidebar-border px-4 py-4">
          {userEmail ? (
            <p
              className="truncate text-[13px] text-sidebar-muted"
              title={userEmail}
            >
              Signed in as {userEmail}
            </p>
          ) : null}

          <SignOutButton />
        </div>
      </div>
    </aside>
  )
}
