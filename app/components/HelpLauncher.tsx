'use client'

import { useId, useRef, useState } from 'react'

import { HELP_SECTIONS } from '@/app/lib/help-content'

/**
 * Floating help control for the workspace, and the panel it opens.
 *
 * A Client Component because a panel has to open and close. It holds nothing
 * else: the content is the static array in app/lib/help-content.ts, imported
 * at build time, so this component makes no request of any kind and stores
 * nothing anywhere.
 *
 * The panel is a native <dialog> opened with `showModal()`. That is the reason
 * there is so little code here: the browser supplies the backdrop, Escape to
 * dismiss, the focus trap, making the workspace behind it inert, and returning
 * focus to this button on close. Hand-rolling those would be far more code and
 * worse. It also matches how the rest of the workspace is built — the
 * collections tree and "Edit note" are native <details>, not client state.
 *
 * Sections are <details> for the same reason, with the first one open, so the
 * panel opens compact instead of as a wall of text.
 */

/** Sole inline icons; no icon library is introduced for this. */
function QuestionMarkIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
      <path
        d="M7.4 7.5a2.6 2.6 0 1 1 3.3 2.5c-.6.2-1 .8-1 1.4v.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="9.75" cy="14.6" r="1.05" fill="currentColor" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path
        d="m4.5 4.5 7 7m0-7-7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Matches the disclosure marker used by the collections tree. */
function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="size-3 shrink-0 opacity-60 transition-transform duration-150 group-open:rotate-90"
    >
      <path
        d="M4 2.5 8 6l-4 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HelpLauncher() {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  return (
    <>
      {/*
        The conventional corner, at every width, and deliberately so.

        From `md` up nothing of the app's own is under it: the "New note" and
        "Sign out" blocks are pinned to the foot of the list pane and the
        sidebar, both of which end well to the left of this. Below `md` the
        panes stack and the document scrolls, so nothing is pinned to the
        bottom at all and whatever passes under this can be scrolled clear.
        Lifting the button higher would only move the overlap into the middle
        of the screen, where a focused field is more likely to sit.
      */}
      <button
        type="button"
        onClick={() => {
          dialogRef.current?.showModal()
          setOpen(true)
        }}
        aria-label="Open help and Q&A"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed right-5 bottom-5 z-50 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary-hover"
      >
        <QuestionMarkIcon />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        // The backdrop reports its clicks against the dialog itself, so this
        // tells "clicked outside the panel" from "clicked something in it".
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current.close()
          }
        }}
        /*
          `hidden open:flex`, not `flex`. The browser hides a closed dialog
          with `dialog:not([open]) { display: none }`, but that is a
          user-agent rule, and any author `display` beats it whatever the
          specificity. A bare `flex` therefore leaves the panel on screen
          permanently — covering this component's own launcher — and `close()`
          then clears the `open` attribute without anything disappearing.
          Pairing `hidden` with the `open:` variant puts the choice of
          `display` back under the attribute the dialog actually toggles.
        */
        className="fixed top-auto right-5 bottom-5 left-auto z-[60] m-0 hidden max-h-[min(560px,calc(100dvh-2.5rem))] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-pane p-0 text-foreground shadow-2xl backdrop:bg-slate-900/40 open:flex max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[82dvh] max-sm:w-auto max-sm:max-w-none max-sm:rounded-b-none"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[16px] font-bold tracking-tight">
              Help and Q&A
            </h2>
            <p className="text-[13px] text-muted">
              How NoteSpace works, in short answers.
            </p>
          </div>

          {/*
            First focusable element in the dialog, so `showModal()` lands the
            keyboard here on open without an explicit autofocus.
          */}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close help and Q&A"
            className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-border bg-pane text-muted transition-colors hover:bg-workspace hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {HELP_SECTIONS.map((section, index) => (
            <details
              key={section.id}
              open={index === 0}
              className="group border-b border-border last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-workspace [&::-webkit-details-marker]:hidden">
                <ChevronIcon />
                {section.heading}
              </summary>

              <dl className="px-2.5 pb-3 pl-[1.9rem]">
                {section.entries.map((entry) => (
                  <div key={entry.q} className="mt-2.5 first:mt-1">
                    <dt className="text-[14px] font-medium">{entry.q}</dt>
                    <dd className="mt-0.5 text-[13px] leading-relaxed text-muted">
                      {entry.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          ))}
        </div>
      </dialog>
    </>
  )
}
