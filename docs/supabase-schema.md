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

- **Row Level Security.** Supabase enables RLS on new tables created through the
  dashboard, which blocks access from the anon key until policies exist. Whether
  this project uses RLS policies or another approach is settled when the Supabase
  client is wired up, not here.
- Indexes are recorded here once they are deliberately chosen. None have been added
  beyond the primary key.
