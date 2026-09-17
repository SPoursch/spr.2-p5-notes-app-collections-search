# CLAUDE.md

Project guidance for Claude Code. Read this before doing anything in this repository.

## Project

**Turing College — Build with AI, Sprint 2.**

- **Part 5 — "Notes App with Collections and Search".** Complete and merged.
- **Part 6 — authentication.** Active. Sign-in, session handling and a protected
  `/workspace` area are now in scope. See "Authentication rules" under
  "Architecture rules".

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

**Steps 1 to 4 of the implementation sequence are implemented and merged.**
Step 1 (scaffold + notes CRUD) was merged into `main` as PR #1, merge commit
`522c082`. Steps 2, 3 and 4 — collections, the tag system, and tag filtering
plus search — were built on `feature/collections` and merged into `main` as
PR #2. `main` is at merge commit `f9494ef`.

**Step 5, the optional feature, is implemented and merged.** Tag-name search —
the workspace search also matching a note's tag names, alongside a final visual
pass — was built on `feature/tag-search` and merged into `main` as **PR #3**,
merge commit `e301457`, after its pre-merge diff review.

**Part 5 is therefore complete, and Part 6 — authentication — is implemented on
`feature/add-auth`,** which is not yet merged. The rules that govern it are
"Authentication rules" under "Architecture rules", and it is step 6 of the
implementation sequence.

What Part 6 adds:

- Supabase Auth for email/password sign-up, sign-in and sign-out, and for
  Google sign-in. The Google provider is configured in the Supabase dashboard
  and has been signed in with successfully.
- `/workspace` is protected on the server: a request with no authenticated user
  is redirected to `/login` before the page renders.
- Row level security on `collections`, `notes`, `tags` and `note_tags` is now
  restricted to the `authenticated` role.
- Manual end-to-end authentication testing has passed.
- The Supabase Security Advisor reports 0 errors and 6 warnings. Those warnings
  are known and deliberately deferred; none of them blocks this Part 6
  checkpoint.

Steps 3 and 4 were developed on the same branch as step 2 rather than one branch
each, and step 2 was not merged before step 3 began. That is a deliberate,
time-constrained departure from "Build one feature at a time" and "One Git
branch per feature" under "Workflow rules", recorded here rather than left as
silent drift.

What exists:

- A Next.js (App Router) + TypeScript + Tailwind CSS app at the repository root.
- Supabase client wiring in `app/lib/supabase.ts`, reading credentials from
  environment variables only, with `.env.local.example` as the committed template.
- The centralised data access module `app/lib/db.ts`. It is the only module that
  queries Supabase, and `app/lib/supabase.ts` is imported by nothing else.
- Four tables in Supabase — `notes`, `collections`, `tags` and `note_tags` —
  documented in `docs/supabase-schema.md`.
- A three-pane workspace: the collections tree, the note list for the collection
  being viewed, and an editor pane for the selected note.
- Notes CRUD, collection create/assign, tag create/add/remove, tag filtering and
  search, driven by Server Actions in `app/lib/actions/` and rendered by
  `app/page.tsx` and `app/components/`. Reads happen in Server Components; only
  mutations and the search field are Client Components.
- Workspace state lives entirely in the URL (`collection`, `tag`, `q`, `note`),
  so filtering and selection hold no client-side state. Filtering and search run
  in memory over the already-loaded rows, adding no queries.

All 12 core requirements have an implementation. Requirements 10 and 11 add no
schema: tag filtering and search operate on rows already loaded per request.

### Hard stops (do not do these yet)

**Every Part 5 stop is lifted.** Steps 1 to 4 are implemented and merged, so the
schema stops are gone: `collections`, `notes.collection_id`, `tags` and
`note_tags` all exist and are documented in `docs/supabase-schema.md`. The stop
on the optional feature is gone as well: all 12 core requirements were confirmed
working before step 5 began, and step 5 merged as PR #3.

**The stop on working past step 5 is lifted.** The user has explicitly
authorised Part 6, so authentication work is in scope and work no longer stops
after step 5.

What remains is scope discipline for Part 6:

- Do **not** add features beyond Part 6 authentication. Anything outside that
  scope is new scope the user has to ask for.
- Part 6 proceeds one lab step at a time, in the order the user gives. Do not
  run ahead of the step being asked for — in particular, do not create a branch,
  write auth code, change the database, install packages, or change Supabase
  dashboard or Google provider settings until the step that calls for it.

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

### Authentication rules

- **Use Supabase Auth for all sign-in and session handling** — never build custom
  auth or store passwords yourself.
- **Every page under `/workspace` requires a signed-in user.** Verify this on the
  server and redirect to `/login` if they are not signed in.
- **After a successful sign-in, redirect to `/workspace`.**
- **After sign-out, redirect to `/login`.**
- **If Google sign-in is implemented, use Supabase Auth's Google provider.** Do
  not implement custom OAuth or credential handling.

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
6. **Authentication (Part 6)** — Supabase Auth sign-in and session handling, a
   `/login` route, and a server-protected `/workspace` area. Governed by
   "Authentication rules" above.

Steps 1 to 5 are Part 5 and are all merged. Step 6 is Part 6 and is the current
work, so the sequence does not end at step 5.

## Scope discipline

**Do not build optional features until all 12 core requirements are working.**
That condition was satisfied during Part 5. The 12 requirements below are Part
5's list; they are recorded as history and all of them are implemented. Part 6
authentication is additional scope on top of them — it does not reopen, replace
or wait on them.

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
Part 6 authentication sits outside that list and is separately authorised; see
"Authentication rules" and step 6 of the implementation sequence.
