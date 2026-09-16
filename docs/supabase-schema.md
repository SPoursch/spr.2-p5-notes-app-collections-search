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
| `created_at` | `timestamptz` | `now()` | no | Set by the database on insert |
| `updated_at` | `timestamptz` | — | yes | Null until the first update; set by the `notes_set_updated_at` trigger |

This satisfies core requirement 2, which asks for a `notes` table storing at
minimum `id`, `title`, `body`, `created_at` and `updated_at`.

### Timestamp ownership

Postgres owns both timestamps. The application never writes either one.

- `created_at` is `not null` with a `now()` default, set on insert.
- `updated_at` is null until the row is first updated. A `before update` trigger
  sets it to `now()`, so a null value means "never edited" and both timestamps
  come from the same clock.

```sql
create or replace function public.notes_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.notes_set_updated_at();
```

An earlier revision of `app/lib/db.ts` wrote `updated_at` from the application
on both insert and update. That put the application clock and the database clock
into the same row, and because `updated_at` was then populated at creation time
its presence no longer indicated an edit — so the UI had to compare the two
timestamps against a two-second tolerance to guess. That comparison was wrong in
both skew directions: a fast application clock labelled every new note "Edited",
a slow one labelled real edits "Created". Moving both timestamps onto the
database clock removes the comparison entirely.

When this change was applied, `updated_at` was set back to null for all existing
rows. Those were Part 5 CRUD test notes and are deliberately treated as never
edited; the old column value did not distinguish edited from unedited rows, so
it carried nothing worth preserving.

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

Combined with `USING (true)` and `WITH CHECK (true)`, this policy means that
anyone holding the project URL and the publishable key can read and write every
row in `notes`, straight against the REST API and bypassing the app entirely.

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` carries the `NEXT_PUBLIC_` prefix, which
marks a variable as client-exposed: Next.js inlines such a variable into the
browser bundle wherever client-side code references it. At present nothing does
— both variables are read only by `app/lib/supabase.ts`, which is reached solely
from server code, so the key is not currently in the browser bundle. The prefix
nonetheless makes that exposure one value-import away: a client component
importing a value (not just a type) from `app/lib/db.ts` would ship the key to
the browser, with no build warning.

The rule that follows is about which keys may carry the prefix at all. A
publishable (anon) key is designed to be public and is safe to expose, provided
RLS policies actually constrain what it can do — which is exactly what the
blanket policy above does not do. A secret or `service_role` key bypasses RLS
completely and must **never** be placed in a `NEXT_PUBLIC_` variable, or in any
value reachable from client code.

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
