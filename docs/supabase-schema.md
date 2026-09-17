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

RLS is **enabled** on all four tables — `public.collections`, `public.notes`,
`public.tags` and `public.note_tags` — and has deliberately been left on.

### Policies in place

Exactly one policy exists per table. There are no other policies — no additional
permissive policies, and no restrictive ones. Since Part 6 added authentication,
each policy applies to the **`authenticated`** role rather than `anon`:

| Policy | Table | Command | Role | `USING` | `WITH CHECK` |
|---|---|---|---|---|---|
| `anon full access to collections` | `collections` | `FOR ALL` | `authenticated` | `true` | `true` |
| `anon full access to notes` | `notes` | `FOR ALL` | `authenticated` | `true` | `true` |
| `anon full access to tags` | `tags` | `FOR ALL` | `authenticated` | `true` | `true` |
| `anon full access to note_tags` | `note_tags` | `FOR ALL` | `authenticated` | `true` | `true` |

The policy **names** still say `anon`: they were created in Part 5 and only
their role was changed in Part 6, so the name is now historical and does not
describe what the policy does. The role column above is what applies.

```sql
create policy "anon full access to notes"
  on public.notes
  for all
  to authenticated
  using (true)
  with check (true);
```

### Why these policies exist

Part 6 added Supabase Auth, so a signed-in request now reaches PostgREST as the
`authenticated` role. `anon` and `authenticated` are distinct Postgres roles and
`authenticated` does not inherit `anon`'s policies, so scoping each policy to
`authenticated` is what allows create, read, update and delete to work at all
once a user signs in. Scoping them to `anon` alone would leave a signed-in user
with an empty workspace and failing writes.

Without a matching policy, `INSERT` fails with `new row violates row-level
security policy for table "notes"`, and `SELECT` returns an empty result rather
than an error, which makes a blocked read look indistinguishable from an empty
table.

Dropping `anon` from these policies also means the data is no longer reachable
without a session: the publishable key on its own no longer grants access.

### Why this is limited to this learning project

The policies are still permissive. `USING (true)` and `WITH CHECK (true)` place
no condition on *which* rows a signed-in user may touch, so **every
authenticated user can read and write every row** in all four tables. Access is
gated by being signed in, not by who you are.

There is no per-user ownership. The tables carry no `user_id` column and no
policy references `auth.uid()`, so notes, collections and tags are shared across
all accounts rather than isolated per user.

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
RLS policies actually constrain what it can do. Since Part 6 the policies do
constrain it: with `anon` dropped, the key alone reaches no rows. A secret or
`service_role` key bypasses RLS completely and must **never** be placed in a
`NEXT_PUBLIC_` variable, or in any value reachable from client code.

Sharing every row between all authenticated users is an accepted, deliberate
trade-off for a local, single-developer learning project holding no real user
data. It is **not** a pattern to carry into anything shared or deployed for real
use: a production version would add a `user_id` column and scope policies to
`auth.uid()` rather than granting blanket access to every signed-in account.

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

## Tags

**Status: created and verified in Supabase.** The statements below were run by
hand in the Supabase SQL Editor (no MCP server is configured) and the result was
verified against the live database: both tables were reachable by `anon` at the
time (they are reachable by `authenticated` since Part 6 — see "Row Level
Security"), `id`
and `created_at` take their defaults, `tags.name` rejects null (`23502`), the
composite primary key rejects a duplicate pairing (`23505`), an unknown
`tag_id` is rejected (`23503`), and both `on delete cascade` rules were
confirmed in each direction — deleting a tag or a note removes only the pairing
rows, never the row on the other side.

These satisfy core requirement 5: a `tags` table of names, and a `note_tags`
join table where each row connects one note to one tag.

### DDL to execute

```sql
-- 1. tags — names only, same column conventions as collections.
create table public.tags (
  id         uuid        not null default gen_random_uuid(),
  name       text        not null,
  created_at timestamptz not null default now(),
  constraint tags_pkey primary key (id)
);

-- 2. note_tags — one row per (note, tag) pair.
-- The composite primary key makes a duplicate pairing impossible at the
-- database level, so the application never has to de-duplicate.
-- Both foreign keys cascade: deleting a note or a tag removes only the
-- pairings, never the row on the other side.
create table public.note_tags (
  note_id uuid not null,
  tag_id  uuid not null,
  constraint note_tags_pkey primary key (note_id, tag_id),
  constraint note_tags_note_id_fkey foreign key (note_id)
    references public.notes (id) on delete cascade,
  constraint note_tags_tag_id_fkey foreign key (tag_id)
    references public.tags (id) on delete cascade
);

-- 3. Row Level Security. Tables created through the SQL Editor do not get RLS
-- enabled automatically, unlike dashboard-created tables, so this is explicit.
alter table public.tags      enable row level security;
alter table public.note_tags enable row level security;

-- 4. One permissive anon policy per table, matching notes and collections.
create policy "anon full access to tags"
  on public.tags
  for all
  to anon
  using (true)
  with check (true);

create policy "anon full access to note_tags"
  on public.note_tags
  for all
  to anon
  using (true)
  with check (true);
```

The two `create policy` statements above are the Part 5 originals, kept as the
record of what was executed at the time. **Their role has since changed.** Part 6
moved every policy from `anon` to `authenticated`; see "Row Level Security"
above for the current state, which is what the live database now has.

### Verification queries

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('tags', 'note_tags')
order by table_name, ordinal_position;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('tags', 'note_tags');

select conname, contype, confdeltype
from pg_constraint
where conrelid = 'public.note_tags'::regclass;
```

Expect: three columns on `tags` and two on `note_tags`, all `not null`; exactly
one `ALL`/`{authenticated}` policy per table (this read `{anon}` when the tables
were created, and became `{authenticated}` in Part 6); and on `note_tags` a
primary key plus two foreign keys with `confdeltype = 'c'` (cascade).

### Notes on this design

- `tags.name` has **no unique constraint**. Requirement 5 does not ask for one,
  and adding it would make "create a tag that already exists" a database error
  the UI would have to translate. Duplicate names are therefore possible.
- No index beyond the two primary keys. The `note_tags` primary key already
  indexes `(note_id, tag_id)`, which covers looking a note's tags up; the
  reverse direction (tag to notes) is unindexed and would matter only for the
  tag filtering in requirement 10.
- The permissive policy carries the same trade-off documented for `notes` above:
  now scoped to `authenticated`, but still `USING (true)`, so every signed-in
  user reaches every row. Acceptable for this local learning project, not for
  anything deployed.

## Tag filtering and search add no schema

Core requirements 10 (tag filtering) and 11 (search) are implemented without any
database change — no columns, no indexes, no full-text search configuration.

Both operate in memory in `app/page.tsx` on rows that request has already
loaded: `listNotes()`, `listCollections()`, `listTags()` and `listTagsByNote()`
run once per request, and the collection filter, the AND-combined tag filter and
the search are then applied to those arrays. Selected filters live in the URL
(`collection`, `tag`, `q`), so no query runs per keystroke and no query runs per
note.

Search covers a note's **title, its body, and each of its tag names**. Tag names
are included as the project's optional feature: it means one box finds a note
either by what it says or by how it is labelled, without having to locate the
tag in the sidebar filter. Requirement 11 asks only for titles and bodies, so
this is a superset of it, and the sidebar filter remains the precise way to
narrow by tag because it combines selected tags with AND.

Each field is matched separately rather than concatenated into one string. A
joined haystack would report a match for a query that merely spans the boundary
between two fields — "test reference" hitting a note whose body ends "test" and
whose first tag is "reference", a phrase present in neither. Matching per field
keeps substring search inside each value.

This is deliberate at this project's scale. It would stop being appropriate once
the note count outgrows a single request payload, at which point the honest
alternatives are `ilike` or `textSearch` filters pushed into Postgres for
requirement 11, an index on `note_tags(tag_id)` for the tag-to-notes direction,
and pagination. None of that is warranted yet, and adding it now would be
speculative.

## Not yet decided

- Indexes are recorded here once they are deliberately chosen. None have been added
  beyond the primary keys.
