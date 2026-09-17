/**
 * URL helpers for the workspace.
 *
 * The whole workspace state — selected collection, selected tags, search text
 * and selected note — lives in the query string rather than in client state,
 * so every link has to carry the parameters it is not changing. These helpers
 * keep that from being rebuilt by hand in each component, where it is easy to
 * drop one and silently reset another pane.
 */

/**
 * Stands in for "notes outside every collection" in the `collection`
 * parameter. Collection ids are UUIDs, so this can never collide with one.
 */
export const UNCOLLECTED = 'uncollected'

/**
 * The route every workspace link is rooted at. The workspace moved from "/" to
 * "/workspace" in Part 6 so that one protected subtree could be guarded in one
 * place; defining the base here keeps that move to a single line.
 */
export const WORKSPACE_PATH = '/workspace'

/** Everything the three panes need to reproduce the current view. */
export type WorkspaceState = {
  collection: string | null
  tags: string[]
  query: string | null
  note: string | null
}

function build(state: WorkspaceState): string {
  const search = new URLSearchParams()

  if (state.collection !== null) {
    search.set('collection', state.collection)
  }

  // Repeated `tag` parameters rather than one comma-joined value: the browser
  // and URLSearchParams both handle repetition natively, so nothing has to
  // escape a separator out of an id.
  for (const tag of state.tags) {
    search.append('tag', tag)
  }

  if (state.query !== null && state.query.length > 0) {
    search.set('q', state.query)
  }

  if (state.note !== null) {
    search.set('note', state.note)
  }

  const query = search.toString()

  return query.length > 0 ? `${WORKSPACE_PATH}?${query}` : WORKSPACE_PATH
}

/**
 * Select a collection. The note selection is dropped, since the note may not
 * be in the collection being opened, but tag filters and search text persist:
 * requirement 10 has the two filters working together.
 */
export function collectionHref(
  state: WorkspaceState,
  collection: string | null,
): string {
  return build({ ...state, collection, note: null })
}

/** Select a note, leaving the collection, tag filters and search untouched. */
export function noteHref(state: WorkspaceState, noteId: string): string {
  return build({ ...state, note: noteId })
}

/**
 * Add a tag to the filter, or remove it when already selected. The note stays
 * selected so that narrowing the list does not close what is being read.
 */
export function tagToggleHref(state: WorkspaceState, tagId: string): string {
  const tags = state.tags.includes(tagId)
    ? state.tags.filter((id) => id !== tagId)
    : [...state.tags, tagId]

  return build({ ...state, tags })
}

/** Drop every tag filter, keeping the collection, search text and note. */
export function clearTagsHref(state: WorkspaceState): string {
  return build({ ...state, tags: [] })
}
