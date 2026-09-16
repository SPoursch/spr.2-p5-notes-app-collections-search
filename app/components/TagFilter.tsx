import Link from 'next/link'

import type { Tag } from '@/app/lib/db'
import {
  clearTagsHref,
  tagToggleHref,
  type WorkspaceState,
} from '@/app/lib/workspace-url'

/**
 * Tag filter for the sidebar (requirement 10).
 *
 * A Server Component: each tag is a link that toggles itself in the `tag`
 * query parameter, so selecting and clearing filters needs no client state.
 * Selection is therefore always represented in the URL and survives a reload
 * or a shared link.
 *
 * Multiple selected tags narrow with AND logic — a note must carry all of
 * them — which is applied where the notes are filtered, in app/page.tsx.
 */
export function TagFilter({
  tags,
  state,
}: {
  tags: Tag[]
  state: WorkspaceState
}) {
  if (tags.length === 0) {
    return (
      <div className="px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wide opacity-60">
          Tags
        </h2>
        <p className="mt-1.5 text-xs text-muted">
          No tags yet. Add one to a note to filter by it here.
        </p>
      </div>
    )
  }

  const selected = new Set(state.tags)

  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide opacity-60">
          Tags
        </h2>

        {selected.size > 0 ? (
          <Link
            href={clearTagsHref(state)}
            className="text-xs underline underline-offset-2 opacity-70 transition-opacity hover:opacity-100"
          >
            Clear
          </Link>
        ) : null}
      </div>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const isSelected = selected.has(tag.id)

          return (
            <li key={tag.id}>
              <Link
                href={tagToggleHref(state, tag.id)}
                aria-pressed={isSelected}
                className={`inline-block rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  isSelected
                    ? 'border-transparent bg-selected font-medium'
                    : 'border-divider text-muted hover:bg-black/[0.04] dark:hover:bg-white/5'
                }`}
              >
                {tag.name}
              </Link>
            </li>
          )
        })}
      </ul>

      {selected.size > 1 ? (
        <p className="mt-2 text-xs text-muted">
          Showing notes with all {selected.size} selected tags.
        </p>
      ) : null}
    </div>
  )
}
