# Supabase Schema

Current state of the database for **Turing College BAI Sprint 2, Part 5 —
Notes App with Collections and Search**.

## References

Official documentation used for the schema and database work in this project:

- Supabase — Tables and Data: https://supabase.com/docs/guides/database/tables
- Supabase — Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- supabase-js — JavaScript client reference: https://supabase.com/docs/reference/javascript/introduction
- supabase-js — Fetch data (`select`): https://supabase.com/docs/reference/javascript/select

Per CLAUDE.md, Supabase-specific queries are written against the official Supabase
documentation rather than from memory.

## Project

| | |
|---|---|
| Supabase project name | `notes-app-collections-search` |
| Access method | `supabase-js` |
| Supabase MCP server | Not configured — schema changes are applied by hand in the Supabase SQL editor / dashboard |

## Tables created so far

### `notes`

Stores each note document. Verified against the Supabase dashboard.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | no | Primary key |
| `title` | `text` | — | yes | Note title |
| `body` | `text` | — | yes | Note content |
| `created_at` | `timestamptz` | `now()` | yes | Set by the database on insert |
| `updated_at` | `timestamptz` | — | yes | No default and no trigger — the application must set this on every update |

This satisfies core requirement 2, which asks for a `notes` table storing at
minimum `id`, `title`, `body`, `created_at` and `updated_at`.

## Row Level Security

RLS is **enabled** on `public.notes`. Supabase turns it on for tables created
through the dashboard, and it has deliberately been left on.

### Policies in place

Exactly one policy exists on `public.notes`. There are no other policies on the
table — no additional permissive policies, and no restrictive ones:

| Policy | Command | Role | `USING` | `WITH CHECK` |
|---|---|---|---|---|
| `anon full access to notes` | `FOR ALL` | `anon` | `true` | `true` |

```sql
create policy "anon full access to notes"
  on public.notes
  for all
  to anon
  using (true)
  with check (true);
```

### Why this policy exists

The app reaches Supabase with the publishable (anon) key and has no sign-in
flow, so every request arrives as the unauthenticated `anon` role. Part 5 does
not require authentication — none of the 12 core requirements in CLAUDE.md
mentions users, accounts or per-user data — so this single permissive policy is
what allows create, read, update and delete to work at all.

Without it, `INSERT` fails with `new row violates row-level security policy for
table "notes"`, and `SELECT` returns an empty result rather than an error, which
makes a blocked read look indistinguishable from an empty table.

### Why this is limited to this learning project

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is a `NEXT_PUBLIC_` variable, so it is
bundled into the browser JavaScript and readable by anyone who loads the page.
Combined with `USING (true)` and `WITH CHECK (true)`, that means anyone holding
the project URL and that key can read and write every row in `notes`.

That is an accepted, deliberate trade-off for a local, single-developer learning
project holding no real user data. It is **not** a pattern to carry into
anything shared or deployed for real use: a production version would
authenticate users and scope policies to `auth.uid()` rather than granting
blanket access to `anon`.

The same decision has to be made again for `collections`, `tags` and `note_tags`
when those tables are created in steps 2 and 3.

## Scope of this document

**This is the current schema only.** `notes` is the only table that exists at this
point in the project.

The following tables are **not yet created** and will be added later, in the order
given by the Part 5 implementation sequence in CLAUDE.md:

| Table | Added in step | Purpose |
|---|---|---|
| `collections` | Step 2 — Collections UI | Named groups of notes (`id`, `name`, `created_at`) |
| `tags` | Step 3 — Tag system | Tag names |
| `note_tags` | Step 3 — Tag system | Join table linking one note to one tag per row |

A `collection_id` column on `notes`, pointing at `collections` and accepting empty
values so a note can sit outside any collection, is also added in step 2 rather
than now.

This document is updated as each of those steps lands.

## Not yet decided

- Indexes are recorded here once they are deliberately chosen. None have been added
  beyond the primary key.
