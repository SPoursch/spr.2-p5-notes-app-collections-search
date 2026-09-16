# Reflection — Part 5 Review Evidence

Review record for **PR #1 "Add notes CRUD with centralized Supabase access"**
(branch `feature/scaffold-notes-crud`, open, not merged).

Every finding was **open** when this record was first written. One has since been fixed:
the nullable / two-clock timestamp design, resolved in commit `f79ecb4` (details under
"Resolution" in section 3b). All other findings below remain open.

## 1. Fresh-session Claude Code review

Required by CLAUDE.md: "At least one PR diff must be reviewed from a fresh Claude Code
session", so the review is done without the context that produced the code.

Findings:

- **CLAUDE.md project-state drift.** The "Current state" section did not match what was
  actually on disk — it described the notes CRUD as driven by Server Actions, when only
  create, update and delete are Server Actions and the list read happens directly in the
  `app/page.tsx` Server Component.
- **Nullable timestamp / two-clock design issue.** `created_at` was written by the Postgres
  `now()` default while `updated_at` was written by the application from the Node process
  clock. The two were then compared to decide whether a note had been edited, so the
  "edited" label depended on agreement between two independent clocks.
  **Resolved** in commit `f79ecb4` — see "Resolution" in section 3b.

## 2. `/code-review --level high`

Finding:

- **Partial-update data-loss path.** `UpdateNoteInput` distinguishes an absent `title` or
  `body` key ("leave the column alone") from a present one ("write this value"), but the
  distinction is made at runtime with an `in` check that a caller cannot see in the type.
  An update carrying an absent-but-present field therefore writes `null` and clears stored
  content.
- **Scope of exposure.** The shipped UI does not trigger this: `NoteForm` always submits
  both `title` and `body`, so the single caller passes both keys. The defensive API path
  was still unsafe — `app/lib/db.ts` is the designated single funnel for all writes, and
  any future caller performing a genuine partial update reaches the unsafe path.

## 3. Marketplace slash command

Required by CLAUDE.md: "At least one PR must be reviewed with a third-party slash command."

- **Exact command:** `/pr-review-toolkit:review-pr`
- **Registration:** run after restarting Claude Code, so the marketplace command was
  genuinely registered rather than improvised.
- **Scope reviewed:** `main...HEAD` — PR #1, HEAD `eef068f`.
- **Method:** the command launched its specialized review agents (general code review,
  comment accuracy, silent-failure hunting, type design) and the findings were then
  independently verified against the source rather than accepted as reported.
- **Not run:** the test-coverage agent, because the repository contains no test files and
  no test framework. Nothing in CLAUDE.md requires tests for this sprint.

### Most important findings

a. **Stale UI after update or delete when the row is missing.** `revalidatePath` is called
   only on the success path in `app/lib/actions/notes.ts`; the branches that handle a
   missing row return an error message and skip it. The user is told the note no longer
   exists while still looking at its card, which remains rendered until a manual reload.

b. **Nullable / two-clock timestamp design — FIXED in `f79ecb4`.** Independently reached by
   the fresh-session review (section 1). Because `updated_at` was written on create as well
   as on update, its presence carried no information, so the code compared the two clocks
   against a fixed tolerance. The label was wrong in both skew directions.

   **Resolution.** Postgres now owns both timestamps and the application writes neither:
   `created_at` is `not null` with `default now()`; `updated_at` is null until the first
   update, when the `notes_set_updated_at` trigger sets it on `UPDATE`. Null therefore
   means "never edited". The application-side `nowIso()` helper and the two-second
   `EDIT_THRESHOLD_MS` heuristic were removed, along with the timestamp comparison they
   supported.

   **Verified end to end.** A newly created note shows "Created" and its `updated_at` comes
   back null. After an update the trigger sets `updated_at`, the delta from `created_at`
   matched the real elapsed time between the two operations — confirming a single clock —
   and the note renders "Edited". The decisive regression case: a note edited 108 ms after
   creation correctly showed "Edited", where the old 2000 ms threshold would have shown
   "Created". `npx tsc --noEmit`, `npm run lint` and `npm run build` all pass. Temporary
   notes created for the check were deleted afterwards.

c. **`undefined`-vs-omitted `UpdateNoteInput` trap.** Independently reached by
   `/code-review` (section 2). `exactOptionalPropertyTypes` is not enabled, so an optional
   property that is present and `undefined` is indistinguishable by type from an absent
   one, while the runtime `in` check treats them oppositely.

d. **Duplicated Supabase select column lists.** The literal column list is repeated across
   the query functions in `app/lib/db.ts`, and each result is asserted with a cast rather
   than validated. Adding a column and missing one of the copies is not a compile error.

e. **Missing explicit server-only boundary in `app/lib/db.ts`.** The module is reached only
   from server code today, and the Supabase credentials are confirmed absent from the
   client bundle. Nothing enforces that. The credentials are read from `NEXT_PUBLIC_`
   variables, so a future client component importing a *value* from `db.ts` would cause
   Next.js to inline them into public JavaScript, with no build warning.

### Automated checks

`npx tsc --noEmit`, `npm run lint` and `npm run build` all passed. `.env.local` is
untracked and absent from git history, and no Supabase URL or key appears in the built
client bundle.

## 4. Reflection

**Layered review produced non-overlapping findings.** The three reviews were not redundant.
The fresh-session review, lacking the context that produced the code, was the one that
noticed the documentation had drifted from the code — a class of problem invisible to
anyone who already believes they know what the project contains. `/code-review` found the
partial-update path by reasoning about the API contract rather than about the shipped UI.
The marketplace command's specialized agents each found defects in their own dimension:
the stale-UI bug came from tracing error paths, the type traps from analysing the types in
isolation. Two findings were reached independently by more than one review, which raised
confidence in them; most were found exactly once.

**Passing typecheck, lint and build did not catch the real problems.** All three automated
checks were clean, and every significant finding above survived them. This is expected
rather than surprising: the defects are silent-failure and data-integrity problems, and the
tooling is not aimed at them. A skipped `revalidatePath` is valid TypeScript. A cast
asserting a row shape is valid precisely because a cast suppresses the check that would
have caught it. `{ title: undefined }` type-checks because the compiler was not told to
distinguish absent from undefined. Green checks establish that the code compiles and is
internally consistent, not that it behaves correctly or preserves data.

**Fix the schema and design foundations before Step 2.** The most consequential findings are
not local bugs but foundations that later steps will build on top of. The two-clock
timestamp decision had to be made again for `collections`, `tags` and `note_tags`, so
leaving it unresolved would have replicated a clock-dependent heuristic across four tables;
it was therefore fixed first, in `f79ecb4`, and the database-owned pattern is now the
precedent those tables will follow. The remaining findings are unchanged. The
`UpdateNoteInput` trap is latent only because the current UI submits every field; Step 2's
"assign a note to a collection" is by definition a partial update and is the first caller
that would actually reach it. The duplicated column lists and the missing server-only
boundary both get harder to correct as more tables and components accumulate. Each of these
is cheap to change now, while there is one table and a handful of call sites, and expensive
once collections and tags depend on them — so the foundations should be settled before
Step 2 begins rather than after.
