'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { WORKSPACE_PATH } from '@/app/lib/workspace-url'

/**
 * Search box for the top of the notes pane (requirement 11).
 *
 * Matches note titles, bodies and tag names, so a tag can be found by typing
 * it rather than only by picking it out of the sidebar filter.
 *
 * The one place live typing forces a Client Component. It holds only the text
 * currently in the field; the search itself stays in the `q` query parameter,
 * so the URL remains the source of truth and the filtering happens on the
 * server in app/page.tsx against notes already loaded there. No query runs per
 * keystroke.
 *
 * Every other parameter is copied from the current URL rather than rebuilt, so
 * typing never drops the selected collection, tag filters or open note.
 */
const DEBOUNCE_MS = 200

export function SearchInput({ query }: { query: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(query)
  const [lastQuery, setLastQuery] = useState(query)
  const currentParams = searchParams.toString()

  // Keep the field in step when `q` changes from outside this component — a
  // Clear link, or the back button. Adjusting during render rather than in an
  // effect is React's own pattern for reacting to a changed prop: it avoids a
  // second render pass, and it avoids resetting via `key`, which would remount
  // the input mid-typing and drop focus.
  if (query !== lastQuery) {
    setLastQuery(query)
    setValue(query)
  }

  useEffect(() => {
    // Already in the URL: nothing to push, and this is what stops the effect
    // from firing again on the re-render that follows its own navigation.
    if (value === query) {
      return
    }

    const timer = setTimeout(() => {
      const next = new URLSearchParams(currentParams)

      if (value.trim().length > 0) {
        next.set('q', value)
      } else {
        next.delete('q')
      }

      const search = next.toString()

      router.replace(
        search.length > 0 ? `${WORKSPACE_PATH}?${search}` : WORKSPACE_PATH,
        { scroll: false },
      )
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [value, query, currentParams, router])

  return (
    <div className="relative">
      <label htmlFor="workspace-search" className="sr-only">
        Search notes and tags
      </label>

      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
      >
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <input
        id="workspace-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search notes and tags…"
        className="w-full rounded-[12px] border border-border bg-pane py-2.5 pr-3 pl-9 text-[15px] shadow-sm outline-none placeholder:text-slate-400 focus:border-ring"
      />
    </div>
  )
}
