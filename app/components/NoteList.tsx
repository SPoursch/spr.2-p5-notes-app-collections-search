import type { Collection, Note, Tag } from '@/app/lib/db'
import type { WorkspaceState } from '@/app/lib/workspace-url'

import { NewNoteForm } from './NewNoteForm'
import { NoteCard } from './NoteCard'
import { SearchInput } from './SearchInput'

/**
 * Middle pane: the notes of the collection being viewed, as compact rows with
 * the selected row highlighted.
 *
 * A Server Component. Both the collection and the note are carried in the URL
 * by the links here and in the sidebar, so this pane holds no state. The
 * "New note" form pinned at the foot is the one Client Component.
 */
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
      className="flex shrink-0 flex-col border-b border-divider bg-pane md:h-full md:w-[320px] md:border-b-0 md:border-r"
    >
      <header className="shrink-0 border-b border-divider px-4 py-3">
        <h1 className="truncate text-sm font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-muted">
          {loadFailed
            ? 'Unavailable'
            : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
        </p>

        {/* Requirement 11: search at the top of the workspace. */}
        <div className="mt-2">
          <SearchInput query={searchQuery} />
        </div>
      </header>

      {/* Requirement 12: every branch here says something rather than going blank. */}
      <div className="min-h-0 flex-1 md:overflow-y-auto">
        {loadFailed ? (
          <div className="p-6 text-center">
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">
              Couldn&apos;t load your notes
            </h2>
            <p className="mt-1.5 text-xs text-muted">
              The database could not be reached. Your notes are safe — reload
              the page to try again.
            </p>
          </div>
        ) : collectionMissing ? (
          <div className="p-6 text-center">
            <h2 className="text-sm font-semibold">Collection not found</h2>
            <p className="mt-1.5 text-xs text-muted">
              It may have been deleted. Pick another one from the sidebar.
            </p>
          </div>
        ) : notes.length === 0 && searchQuery.length > 0 ? (
          <div className="p-6 text-center">
            <h2 className="text-sm font-semibold">No matching notes</h2>
            <p className="mt-1.5 text-xs text-muted">
              Nothing here matches &ldquo;{searchQuery}&rdquo;
              {selectedTagCount > 0
                ? ' with the selected tags. Try clearing a tag or changing the search.'
                : '. Try a different search.'}
            </p>
          </div>
        ) : notes.length === 0 && selectedTagCount > 0 ? (
          <div className="p-6 text-center">
            <h2 className="text-sm font-semibold">No notes with these tags</h2>
            <p className="mt-1.5 text-xs text-muted">
              {selectedTagCount === 1
                ? 'No note here carries the selected tag. Clear it from the sidebar to see everything again.'
                : 'No note here carries all the selected tags. Clear one from the sidebar to widen the list.'}
            </p>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-6 text-center">
            <h2 className="text-sm font-semibold">No notes at the moment</h2>
            <p className="mt-1.5 text-xs text-muted">
              {activeCollection === null
                ? 'Use the New note box below to write your first one.'
                : 'This collection is empty. Add a note with the box below.'}
            </p>
          </div>
        ) : (
          <ul>
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

      {/* Pinned to the foot of the pane, matching "New collection" in the sidebar. */}
      <div className="shrink-0 border-t border-divider px-4 py-3">
        <NewNoteForm
          collections={collections}
          activeCollection={activeCollection}
        />
      </div>
    </section>
  )
}
