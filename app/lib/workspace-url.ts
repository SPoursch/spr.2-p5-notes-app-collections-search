/**
 * URL helpers for the workspace.
 *
 * Both the selected collection and the selected note live in the query string
 * rather than in client state, so every link has to carry the parameter it is
 * not changing. These helpers keep that from being rebuilt by hand in each
 * component, where it is easy to drop one and silently reset the other pane.
 */

/**
 * Stands in for "notes outside every collection" in the `collection`
 * parameter. Collection ids are UUIDs, so this can never collide with one.
 */
export const UNCOLLECTED = 'uncollected'

function build(params: Record<string, string | null>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== null) {
      search.set(key, value)
    }
  }

  const query = search.toString()

  return query.length > 0 ? `/?${query}` : '/'
}

/** Select a collection, dropping any note selection with it. */
export function collectionHref(collection: string | null): string {
  return build({ collection })
}

/** Select a note while staying inside the collection currently being viewed. */
export function noteHref(collection: string | null, noteId: string): string {
  return build({ collection, note: noteId })
}
