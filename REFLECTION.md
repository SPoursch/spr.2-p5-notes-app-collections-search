# Reflection — Sprint 2 Part 8

The Part 5 review evidence that used to live in this file has moved to
[`docs/part5-review-evidence.md`](docs/part5-review-evidence.md).

## 1. Persistent storage: what I consulted on, and what I built

I asked Claude Code to weigh two ways of keeping each account's notes separate:
filtering every query by the signed-in user's id in application code, or making
the database enforce it. I chose the database. The migration adds a `user_id`
column to `collections`, `notes` and `tags`, each referencing `auth.users(id)`
with `on delete cascade`, and a row level security policy on each of those three
tables compares that column against `auth.uid()`. Application code names the
owner on insert only — the three create functions in `app/lib/db.ts` read the
id from the verified session — and reads carry no user filter, because the policies
already restrict every statement to the caller's rows. Keeping the boundary in
one place means isolation cannot be lost by forgetting a filter in a single
query. Two decisions followed from the same reasoning: `note_tags` got no
`user_id`, since a pairing's owner is already a fact about its note and its tag,
and the Part 5 test rows were deleted rather than handed to an arbitrary
account. Nothing is persisted in the browser — notes live in Postgres,
workspace state lives in the URL, and the session lives in cookies.

## 2. An auth issue I caught and fixed

A security review of the authentication work found that the `/workspace` guard
protected rendering but not invocation. All eight mutation Server Actions —
creating notes, collections and tags, assigning a collection, adding and
removing tags — performed no identity check. A Server Action is a public POST
endpoint, not a page, so anyone holding an action id could have written data
without signing in. I added a `requireUser()` guard in
`app/lib/actions/require-auth.ts` and called it as the first statement in each
of the eight, ahead of input validation, so an unauthenticated caller reaches
neither the database nor the validation messages.

## 3. A prompt that was misread, and the redirection

I asked for the ownership migration as a script I could paste into the Supabase
SQL Editor. Claude Code returned it wrapped in explanatory prose, I copied the
whole reply, and Postgres answered `ERROR: 42601: syntax error at or near
"Here"`. The instruction had been read as "include the script in the response"
rather than "make the copyable block in the response be exactly the script". I
reported the error, and it was reissued as a single fenced block with every
explanation moved outside it. The lesson I took is that when output is meant to
be executed verbatim, the prompt has to say so — otherwise the helpful
surrounding commentary becomes part of what gets run.
