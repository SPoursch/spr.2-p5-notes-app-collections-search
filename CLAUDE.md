# CLAUDE.md

Project guidance for Claude Code. Read this before doing anything in this repository.

## Project

**Turing College — Build with AI, Sprint 2, Part 5: "Notes App with Collections and Search".**

A brand-new, locally developed notes application. Notes are stored persistently in
Supabase and can be organised into collections, labelled with tags, and searched.

The codebase now exists and is under active development. It was started from an
empty directory; see "Current state" for what has been built so far.

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase, accessed through `supabase-js`
- No Supabase MCP server is configured yet. All Supabase work is done manually
  (SQL in the Supabase dashboard / SQL editor, and `supabase-js` in application code).

## Current state

**Step 1 of the implementation sequence — scaffold app + notes CRUD — is
implemented and merged.** It was built on the branch `feature/scaffold-notes-crud`
and merged into `main` as PR #1, merge commit `522c082`.

What exists:

- A Next.js (App Router) + TypeScript + Tailwind CSS app at the repository root.
- Supabase client wiring in `app/lib/supabase.ts`, reading credentials from
  environment variables only, with `.env.local.example` as the committed template.
- The centralised data access module `app/lib/db.ts`. It is the only module that
  queries Supabase, and `app/lib/supabase.ts` is imported by nothing else.
- A `notes` table in Supabase (`id`, `title`, `body`, `created_at`, `updated_at`),
  documented in `docs/supabase-schema.md`.
- Create, read, update and delete for notes, driven by Server Actions in
  `app/lib/actions/notes.ts` and rendered by `app/page.tsx` and `app/components/`.

Core requirements 1 and 2 are satisfied. Requirement 12 is satisfied for the
notes workspace only; the collection, search and tag empty states arrive with
their own steps.

### Hard stops (do not do these yet)

Step 1 is done and merged, so its stops are lifted — including the one that held
step 2 back until PR #1 was merged. The stops that remain belong to later steps:

- Do **not** create the `tags` or `note_tags` tables before step 3, which owns
  them.
- Do **not** build the optional feature until all 12 core requirements work.

Step 2 owns the `collections` table and the `collection_id` column on `notes`, so
those are no longer barred.

The remaining stops are lifted one at a time, in the order given under
"Implementation sequence", and only when the user explicitly asks for that step.

## Data model

### Relationships

- A collection can contain many notes.
- A note belongs to zero or one collection.
- A note can have many tags.
- A tag can apply to many notes.
- `note_tags` is the join table connecting notes and tags.

### Tables

1. **collections** — named containers for notes.
2. **notes** — the note itself (title, body, optional collection reference).
3. **tags** — named labels.
4. **note_tags** — many-to-many join between `notes` and `tags`.

Exact columns, constraints, indexes and RLS policies are decided when the schema
step is actually reached — not before.
The `notes` table has reached that step; its columns and RLS policy are recorded
in `docs/supabase-schema.md`.

## Architecture rules

- **Single data access module.** Every Supabase read and write goes through one
  centralised helper module (for example `app/lib/db.ts`). No component, route
  handler or server action may call `supabase-js` directly. If a query is needed,
  add a function to the helper module and call that.
- **Credentials come from environment variables only.** Never hard-code a Supabase
  URL, anon key, service key, or any other secret in source files.
- **`.env.local` is never committed.** It must be listed in `.gitignore` before the
  first commit that could otherwise pick it up. Commit a `.env.local.example` with
  placeholder values instead.
- **Supabase queries follow the official Supabase documentation.** When writing a
  query, filter, join or auth call, check the official Supabase docs rather than
  guessing at the API surface.

## Workflow rules

- **Build one feature at a time.** Finish, verify and merge a feature before
  starting the next.
- **One Git branch per feature.** Never develop a feature directly on `main`.
- **Commit at every stable state** — whenever the app builds and the feature under
  construction is in a working, coherent condition.
- **Diff review before every merge.** Read the full diff of a PR before merging it.
- **At least one PR must be reviewed with a third-party slash command.**
- **At least one PR diff must be reviewed from a fresh Claude Code session**, so the
  review is done without the context that produced the code.
- **Keep the implementation aligned with this file.** If a decision contradicts
  CLAUDE.md, either change the approach or update CLAUDE.md deliberately — do not
  silently drift.

## Implementation sequence

Work through these in order. Do not start a step before the previous one is merged.

1. **Scaffold app + notes CRUD** — Next.js + TypeScript + Tailwind scaffold,
   Supabase client wiring, `app/lib/db.ts`, `notes` table, create/read/update/delete
   notes.
2. **Collections UI** — `collections` table, create and list collections, assign a
   note to a collection, view notes by collection.
3. **Tag system** — `tags` and `note_tags` tables, add and remove tags on a note,
   filter notes by tag.
4. **Search** — search across note titles and bodies.
5. **Optional feature** — only after everything above works.

## Scope discipline

**Do not build optional features until all 12 core requirements are working.**

### Core requirements

The 12 official requirements from the Turing College Sprint 2 Part 5 assignment,
quoted verbatim:

1. All data reads and writes go through supabase-js queries, centralised in a single helper module (for example, app/lib/db.ts).

2. A notes table in Supabase stores each document with at minimum: an id, title, body, created_at, and updated_at column.

3. A collections table stores named groups. Each collection has an id, name, and created_at column.

4. Notes can belong to one collection. The notes table has a collection_id column that points at a row in collections. The column accepts empty values so a note can sit outside any collection.

5. A tags table stores tag names. A separate note_tags table links tags to notes — each row connects one note to one tag, so a single note can carry several tags and a single tag can apply to many notes.

6. The sidebar shows collections as expandable groups. Clicking a collection expands it to reveal the notes it contains. Uncollected notes appear under a default "All notes" or "Uncollected" group.

7. A New collection control lets the user create a named collection from the sidebar. Clicking it prompts for a name and adds it immediately.

8. When viewing a note, the user can assign it to a collection from a dropdown or picker. The change persists in the database.

9. When viewing a note, the user can add or remove tags. Tags appear on the note card in the sidebar.

10. The sidebar has a tag filter: selecting one or more tags narrows the list to notes that carry all selected tags.

11. A search input at the top of the workspace queries across note titles and body content. Results update as the user types. The search respects any active tag filter.

12. Readable empty states throughout: no blank screens when a collection is empty, no search results are found, or no tags match.

Anything beyond this list is the "optional feature" in step 5 of the sequence.
