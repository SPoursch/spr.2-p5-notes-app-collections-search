# CLAUDE.md

Project guidance for Claude Code. Read this before doing anything in this repository.

## Project

**Turing College — Build with AI, Sprint 2.**

- **Part 5 — "Notes App with Collections and Search".** Complete and merged.
- **Part 6 — authentication.** Complete and merged as PR #4.
- **Part 8 — per-user data ownership.** Active. Every collection, note and tag
  belongs to exactly one account, and a signed-in user sees only what they
  created. See "Ownership rules" and "Authentication rules" under
  "Architecture rules".

A brand-new, locally developed notes application. Notes are stored persistently in
Supabase and can be organised into collections, labelled with tags, and searched.

The codebase now exists and is under active development. It was started from an
empty directory; see "Current state" for what has been built so far.

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase — the database, and Supabase Auth for email/password and Google
  OAuth sign-in
- `supabase-js` for queries, and `@supabase/ssr` for the cookie-backed server
  session. Both are reached only through `app/lib/supabase.ts`.
- **Supabase Agent Skills, installed repository-local under `.agents/skills/`.**
  They are committed, so they travel with the repository rather than depending
  on a user-level install. `.claude/skills/` holds machine-local symlinks to
  them and is git-ignored.
- No Supabase MCP server is configured. All Supabase work is done manually
  (SQL in the Supabase dashboard / SQL editor, and `supabase-js` in application
  code). Migrations are kept as versioned files in `supabase/migrations/` and
  run by hand.

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

**Part 6 — authentication — is complete and merged** into `main` as **PR #4**,
merge commit `9ef1af0`. What it added:

- Supabase Auth for email/password sign-up, sign-in and sign-out, and for
  Google sign-in. The Google provider is configured in the Supabase dashboard
  and has been signed in with successfully.
- `/workspace` is protected on the server: a request with no authenticated user
  is redirected to `/login` before the page renders.
- Every mutation Server Action authorises the request itself, since an action is
  a public POST endpoint that the page guard does not cover.
- Manual end-to-end authentication testing passed.

**Part 8 — per-user data ownership — is in progress on `main`.** What it has
added so far:

- `user_id` on `collections`, `notes` and `tags`, and row level security
  policies that compare it against `auth.uid()`. This is the change that makes
  a user see only their own notes. Applied by
  `supabase/migrations/20260918120000_add_per_user_ownership.sql` and recorded
  in `docs/supabase-schema.md`.
- A profile menu in the top right of the workspace, showing the signed-in
  user's name, email and avatar from the verified session, with sign-out.
- Repository-local Supabase Agent Skills under `.agents/skills/`.
- The two-account isolation test has passed end to end: two accounts each see
  only their own notes, collections and tags.
- The Supabase Security Advisor reports 0 errors. The remaining warnings are
  known and deliberately deferred.
- **Password reset, as the Part 8 optional task.** `/forgot-password` requests
  a Supabase Auth recovery email, `/auth/confirm` turns the verified link into
  a server-side session, and `/reset-password` sets the new password. Built on
  `feature/password-reset` and open as **PR #5**, reviewed from a fresh Claude
  Code session; not merged yet. Manual validation is recorded in
  `docs/part8-password-reset-validation.md`.

The earlier Part 8 commits — everything above the password-reset entry — were
made directly on `main` rather than on a feature branch. That was a second
deliberate, time-constrained departure from "One Git branch per feature",
recorded here rather than left as silent drift. The password-reset work returns
to the branch workflow in "Workflow rules": it was developed on
`feature/password-reset` and goes to `main` through a reviewed pull request.

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
  `app/workspace/page.tsx` and `app/components/`. Reads happen in Server
  Components; only mutations, the search field and the profile menu are Client
  Components.
- Workspace state lives entirely in the URL (`collection`, `tag`, `q`, `note`),
  so filtering and selection hold no client-side state. Filtering and search run
  in memory over the already-loaded rows, adding no queries.
- Authentication: `/login`, `/auth/callback` for the OAuth code exchange, a
  server guard in `app/workspace/layout.tsx`, and `proxy.ts` refreshing the
  session cookie. Auth calls live in `app/lib/db.ts` alongside every other
  Supabase call.
- Password recovery: `/forgot-password` (request a link), `/auth/confirm` (the
  route handler that verifies what Supabase appends to the redirect and writes
  the resulting session to cookies) and `/reset-password` (guarded by the same
  `getAuthenticatedUser()` check the workspace uses). No custom SMTP is
  configured, so the flow runs on Supabase's built-in email service and its
  stock "Reset Password" template. `http://localhost:3000/auth/confirm` must be
  in the Supabase redirect allow-list alongside `/auth/callback`, or the link
  lands on the Site URL and the flow fails silently.

All 12 core requirements have an implementation. Requirements 10 and 11 add no
schema: tag filtering and search operate on rows already loaded per request.

### Hard stops (do not do these yet)

**Every Part 5 stop is lifted.** Steps 1 to 4 are implemented and merged, so the
schema stops are gone: `collections`, `notes.collection_id`, `tags` and
`note_tags` all exist and are documented in `docs/supabase-schema.md`. The stop
on the optional feature is gone as well: all 12 core requirements were confirmed
working before step 5 began, and step 5 merged as PR #3.

**The stops on Part 6 and Part 8 are lifted too.** Authentication is merged, and
per-user ownership is applied to the live database.

What remains is scope discipline for Part 8:

- Do **not** add features beyond what Part 8 asks for. Anything outside that
  scope is new scope the user has to ask for.
- Part 8 proceeds one lab step at a time, in the order the user gives. Do not
  run ahead of the step being asked for — in particular, do not change the
  database, install packages, or change Supabase dashboard or Google provider
  settings until the step that calls for it.
- **Database changes are applied by the user, not by this repository.** There is
  no CLI project and no MCP server, so a schema change means writing a migration
  file under `supabase/migrations/` and handing the user the SQL to run. Never
  report a migration as applied without verification output from the database.

## Data model

### Relationships

- A collection can contain many notes.
- A note belongs to zero or one collection.
- A note can have many tags.
- A tag can apply to many notes.
- `note_tags` is the join table connecting notes and tags.
- **Every collection, note and tag belongs to exactly one account**, through a
  `user_id` referencing `auth.users`.

### Tables

1. **collections** — named containers for notes. Has `user_id`.
2. **notes** — the note itself (title, body, optional collection reference).
   Has `user_id`.
3. **tags** — named labels. Has `user_id`.
4. **note_tags** — many-to-many join between `notes` and `tags`. Has **no**
   `user_id`: a pairing's owner is already a fact about its note and its tag, so
   storing it a third time would be duplicated state that can drift. Its policy
   derives ownership from those two relationships instead.

Exact columns, constraints, indexes and RLS policies are recorded in
`docs/supabase-schema.md`, which is kept in step with
`supabase/migrations/`.

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
- **Use the repository's Supabase Agent Skills.** Any Supabase or Postgres work —
  schema changes, migrations, RLS policies, client or SSR integration, auth,
  debugging a database error — loads the skills in `.agents/skills/` first, and
  the Postgres one specifically before writing or changing anything that lives
  in the database.
- **Nothing is persisted in the browser.** No `localStorage`, no
  `sessionStorage`, for the session or for application data. Notes live in
  Supabase; workspace state lives in the URL; the auth session lives in cookies
  managed by `@supabase/ssr`.

### Authentication rules

- **Use Supabase Auth for all sign-in and session handling** — never build custom
  auth or store passwords yourself.
- **Every page under `/workspace` requires a signed-in user.** Verify this on the
  server and redirect to `/login` if they are not signed in.
- **After a successful sign-in, redirect to `/workspace`.**
- **After sign-out, redirect to `/login`.**
- **If Google sign-in is implemented, use Supabase Auth's Google provider.** Do
  not implement custom OAuth or credential handling.
- **Verify the session; never trust the cookie as sent.** Identity comes from
  `getClaims()`, which verifies the token's signature, not from `getSession()`,
  which only decodes whatever the browser sent. A session cookie is
  attacker-supplied input. `getAuthenticatedUser()` in `app/lib/db.ts` is the
  single place this check lives.
- **A Server Action authorises itself.** An action is a public POST endpoint,
  not a page, so a page or layout guard does nothing to stop it being invoked
  directly. Every mutating action calls the guard in
  `app/lib/actions/require-auth.ts` before validating input or touching the
  database.
- **Password recovery is Supabase Auth's, and its token stays on the server.**
  The recovery link is verified in the `/auth/confirm` route handler, which is
  the only place able to write the resulting session cookie. No token is parsed
  in the browser, no recovery listener runs client-side, and no password is
  read back, compared or stored anywhere but Supabase Auth. Because the flow is
  PKCE, the link only works in the browser that requested it; the failure
  message says so rather than claiming the link expired.
- **Provider metadata is for display only.** A display name or avatar comes from
  `user_metadata`, which the user can edit, so it may be shown and must never be
  used for an access decision. Authorisation uses the verified `sub` claim.

### Ownership rules

- **Every collection, note and tag belongs to exactly one account; `note_tags`
  ownership is derived through its note and tag relationships.** `collections`,
  `notes` and `tags` each carry a `user_id` referencing `auth.users(id)`,
  `not null`, with `on delete cascade`.
- **RLS is the enforcement layer, not the application.** The policies restrict
  every statement to the caller's own rows, so isolation cannot be lost by
  forgetting a filter in one query. Application filtering is defence in depth;
  the database is the authority.
- **New rows derive `user_id` from the authenticated server session.** The
  create functions in `app/lib/db.ts` read the id through `requireUserId()` and
  send it explicitly.
- **Never accept a user id from client input.** No function in `app/lib/db.ts`
  takes a user id as an argument, and no Server Action reads one from a form
  field. A client-supplied owner would be worthless, since the client is what is
  being checked.
- **`note_tags` ownership is derived, not stored.** Its policy requires the
  caller to own the note, and additionally to own the tag when creating a
  pairing.

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

### Validation workflow

Run all four before every commit, and fix what they report rather than working
around it:

```bash
git diff --check     # whitespace errors and conflict markers
npx tsc --noEmit     # types
npm run lint         # ESLint
npm run build        # production build
```

Vendored third-party files under `.agents/skills/` are excluded from that rule:
they are upstream content and are not edited to satisfy a local check.

### Git workflow for future work

The Part 5 and Part 8 departures recorded under "Current state" are history, not
precedent. New work follows this order:

1. Branch from `main` — one feature branch per feature, never directly on `main`.
2. Implement, committing at each stable state.
3. Run the four validation commands above.
4. Review the complete diff, and confirm only intended files are staged.
5. Commit, push, and open a PR into `main`.
6. Review the PR diff in full before merging.

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
7. **Per-user data ownership (Part 8)** — `user_id` on `collections`, `notes`
   and `tags`, ownership RLS policies, and a profile menu. Governed by
   "Ownership rules" above.

Steps 1 to 5 are Part 5 and are all merged. Step 6 is Part 6 and is merged.
Step 7 is Part 8 and is the current work, so the sequence does not end at step
5.

## Scope discipline

**Do not build optional features until all 12 core requirements are working.**
That condition was satisfied during Part 5. The 12 requirements below are Part
5's list; they are recorded as history and all of them are implemented. Part 6
authentication and Part 8 ownership are additional scope on top of them — they
do not reopen, replace or wait on them.

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
Part 6 authentication and Part 8 ownership sit outside that list and are
separately authorised; see "Authentication rules", "Ownership rules", and steps
6 and 7 of the implementation sequence.
