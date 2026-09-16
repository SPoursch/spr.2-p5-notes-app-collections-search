import type { Collection, Note, Tag } from '@/app/lib/db'
import type { WorkspaceState } from '@/app/lib/workspace-url'

import { NewNoteForm } from './NewNoteForm'
import { NoteCard } from './NoteCard'
import { SearchInput } from './SearchInput'

/**
 * Middle pane: the notes of the collection being viewed, as cards with the
 * selected one highlighted.
 *
 * A Server Component. Both the collection and the note are carried in the URL
 * by the links here and in the sidebar, so this pane holds no state. The
 * "New note" form pinned at the foot is the one Client Component.
 *
 * The pane is tinted and the cards are white, which is what separates the list
 * from the plain editor surface beside it. The footer is pinned so the "New
 * note" block sits level with the tag filter at the foot of the sidebar.
 */

/** Small tinted tile that marks the pane heading, as in the reference. */
function CollectionGlyph() {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-indigo-100 text-primary"
    >
      <svg viewBox="0 0 16 16" className="size-5">
        <path
          d="M1.5 4.5A1.5 1.5 0 0 1 3 3h2.6a1.5 1.5 0 0 1 1.06.44l.9.9H13a1.5 1.5 0 0 1 1.5 1.5v6.16A1.5 1.5 0 0 1 13 13.5H3a1.5 1.5 0 0 1-1.5-1.5v-7.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/** Shared shell for the pane's empty and error states. */
function ListMessage({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border-strong bg-card p-6 text-center">
      <h2 className="text-[15px] font-semibold">{heading}</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{children}</p>
    </div>
  )
}

export function NoteList({
  notes,
  collections,
  title,
  loadFailed,
  collectionMissing,
  selectedNoteId,
  activeCollection,
  tagsByNote,
  state,
  searchQuery,
  selectedTagCount,
}: {
  notes: Note[]
  collections: Collection[]
  title: string
  loadFailed: boolean
  collectionMissing: boolean
  selectedNoteId: string | null
  activeCollection: string | null
  tagsByNote: Map<string, Tag[]>
  state: WorkspaceState
  searchQuery: string
  selectedTagCount: number
}) {
  return (
    <section
      aria-label="Notes"
      className="flex shrink-0 flex-col border-b border-border bg-workspace md:h-full md:w-[360px] md:border-b-0 md:border-r"
    >
      <header className="shrink-0 px-4 pt-4 pb-3">
        {/* Requirement 11: search at the top of the workspace. */}
        <SearchInput query={searchQuery} />

        <div className="mt-4 flex items-center gap-3">
          <CollectionGlyph />
          <div className="min-w-0">
            <h1 className="truncate text-[19px] font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-[13px] text-muted">
              {loadFailed
                ? 'Unavailable'
                : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
            </p>
          </div>
        </div>
      </header>

      {/* Requirement 12: every branch here says something rather than going blank. */}
      <div className="min-h-0 flex-1 px-4 pb-4 md:overflow-y-auto">
        {loadFailed ? (
          <ListMessage heading="Couldn't load your notes">
            The database could not be reached. Your notes are safe — reload the
            page to try again.
          </ListMessage>
        ) : collectionMissing ? (
          <ListMessage heading="Collection not found">
            It may have been deleted. Pick another one from the sidebar.
          </ListMessage>
        ) : notes.length === 0 && searchQuery.length > 0 ? (
          <ListMessage heading="No matching notes">
            Nothing here matches &ldquo;{searchQuery}&rdquo;
            {selectedTagCount > 0
              ? ' with the selected tags. Try clearing a tag or changing the search.'
              : '. Try a different search.'}
          </ListMessage>
        ) : notes.length === 0 && selectedTagCount > 0 ? (
          <ListMessage heading="No notes with these tags">
            {selectedTagCount === 1
              ? 'No note here carries the selected tag. Clear it from the sidebar to see everything again.'
              : 'No note here carries all the selected tags. Clear one from the sidebar to widen the list.'}
          </ListMessage>
        ) : notes.length === 0 ? (
          <ListMessage heading="No notes at the moment">
            {activeCollection === null
              ? 'Use the New note box below to write your first one.'
              : 'This collection is empty. Add a note with the box below.'}
          </ListMessage>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {notes.map((note) => (
              <li key={note.id}>
                <NoteCard
                  note={note}
                  selected={note.id === selectedNoteId}
                  tags={tagsByNote.get(note.id) ?? []}
                  state={state}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/*
        Pinned to the foot of the pane so it sits level with the tag filter at
        the foot of the sidebar.
      */}
      <div className="shrink-0 border-t border-border bg-pane px-4 py-4">
        <NewNoteForm
          collections={collections}
          activeCollection={activeCollection}
        />
      </div>
    </section>
  )
}
