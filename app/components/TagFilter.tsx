import Link from 'next/link'

import type { Tag } from '@/app/lib/db'
import {
  clearTagsHref,
  tagToggleHref,
  type WorkspaceState,
} from '@/app/lib/workspace-url'

import { TagDot, tagChipClasses } from './TagChip'

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
 *
 * Colours come from the shared tag palette, so a tag looks the same here as it
 * does on a note row and in the editor.
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
      <div className="px-4 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
          Tags
        </h2>
        <p className="mt-2 text-[13px] text-sidebar-muted">
          No tags yet. Add one to a note to filter by it here.
        </p>
      </div>
    )
  }

  const selected = new Set(state.tags)

  return (
    <div className="px-4 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
          Tags
        </h2>

        {selected.size > 0 ? (
          <Link
            href={clearTagsHref(state)}
            className="text-[13px] font-medium text-sidebar-muted underline underline-offset-2 transition-colors hover:text-sidebar-foreground"
          >
            Clear
          </Link>
        ) : null}
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const isSelected = selected.has(tag.id)

          return (
            <li key={tag.id}>
              <Link
                href={tagToggleHref(state, tag.id)}
                aria-pressed={isSelected}
                className={tagChipClasses(tag.name, 'dark', isSelected)}
              >
                <TagDot name={tag.name} />
                {tag.name}
              </Link>
            </li>
          )
        })}
      </ul>

      {selected.size > 1 ? (
        <p className="mt-2.5 text-[13px] text-sidebar-muted">
          Showing notes with all {selected.size} selected tags.
        </p>
      ) : null}
    </div>
  )
}
