'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Search box for the top of the notes pane (requirement 11).
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

      router.replace(search.length > 0 ? `/?${search}` : '/', { scroll: false })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [value, query, currentParams, router])

  return (
    <div className="relative">
      <label htmlFor="workspace-search" className="sr-only">
        Search notes
      </label>
      <input
        id="workspace-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search notes…"
        className="w-full rounded-md border border-divider bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:focus:border-white/50"
      />
    </div>
  )
}
