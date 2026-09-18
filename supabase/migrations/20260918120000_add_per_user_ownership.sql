-- Part 8 — per-user data ownership.
--
-- Goal: "A user sees only the notes they created — not notes belonging to
-- other accounts." Until now every signed-in user shared one dataset, because
-- the Part 6 policies were `to authenticated using (true) with check (true)`:
-- being signed in granted access to every row.
--
-- This migration adds ownership and makes the database enforce it. Application
-- filtering is defence in depth only; the policies below are the boundary.
--
-- HOW TO RUN
-- No Supabase CLI project or MCP server is configured for this repository
-- (see CLAUDE.md), so this file is executed by hand in the Supabase SQL Editor
-- and kept here as the versioned record of what was run. Run it as one script,
-- in order, inside a single transaction — the SQL Editor wraps statements in a
-- transaction already, so a failure in step 2 rolls the whole thing back.
--
-- BEFORE YOU RUN IT, read step 2. It will deliberately fail unless you have
-- decided what happens to the existing Part 5/6 test rows.

-- ---------------------------------------------------------------------------
-- 1. Ownership columns
--
-- Added nullable first. `not null` is applied in step 3, after every existing
-- row has an owner — adding it as `not null` immediately would fail against a
-- non-empty table, and adding it with a blanket default would silently hand
-- all existing data to whichever account ran the migration.
--
-- `references auth.users (id) on delete cascade`: deleting an account removes
-- its data rather than leaving rows pointing at a user that no longer exists.
--
-- `default auth.uid()` is a backstop, not the mechanism. The application
-- inserts `user_id` explicitly (app/lib/db.ts); the default means that a write
-- path which forgets to still produces a correctly owned row instead of a
-- constraint violation. It can never be used to forge ownership, because the
-- `with check` clauses in step 4 reject any row whose `user_id` is not the
-- caller.
-- ---------------------------------------------------------------------------

alter table public.collections
  add column if not exists user_id uuid default auth.uid()
    references auth.users (id) on delete cascade;

alter table public.notes
  add column if not exists user_id uuid default auth.uid()
    references auth.users (id) on delete cascade;

alter table public.tags
  add column if not exists user_id uuid default auth.uid()
    references auth.users (id) on delete cascade;

-- `note_tags` deliberately gets NO user_id. Ownership of a pairing is a fact
-- about its note and its tag, so storing it a third time would be duplicated
-- state that can drift out of agreement with the rows it describes. Step 4
-- derives it instead.

-- ---------------------------------------------------------------------------
-- 2. Existing rows — DECIDE, do not default
--
-- The Part 5/6 test data has no owner. Assigning it to an arbitrary account is
-- not safe, so nothing is assigned unless you say so. Pick one option.
--
-- First, find the account id you want:
--
--     select id, email, created_at from auth.users order by created_at;
--
-- Note: an account created with Google sign-in and one created with
-- email/password are DIFFERENT rows in auth.users, even for the same person.
-- Whichever you choose, the other account starts empty — which is the point of
-- this migration, and is what the two-account isolation test verifies.
--
-- OPTION A — keep the existing data and give it to one account.
--   Replace `null` below with that account's id, e.g.
--     legacy_owner uuid := 'a1b2c3d4-....'::uuid;
--
-- OPTION B — discard the test data instead. Leave `legacy_owner` as null and
--   run this first, on its own:
--
--     delete from public.note_tags;
--     delete from public.notes;
--     delete from public.tags;
--     delete from public.collections;
--
--   This is the cleaner choice if the existing rows are only CRUD scratch
--   notes, since it leaves no ambiguity about who owns what. It is destructive
--   and cannot be undone.
--
-- If rows still have no owner when this block finishes, it raises and the
-- whole migration rolls back. That is intentional: a half-applied ownership
-- model is worse than none.
-- ---------------------------------------------------------------------------

do $$
declare
  legacy_owner uuid := null;  -- <== Option A: put an auth.users.id here.
  unowned bigint;
begin
  if legacy_owner is not null then
    if not exists (select 1 from auth.users where id = legacy_owner) then
      raise exception 'legacy_owner % is not an existing auth.users.id', legacy_owner;
    end if;

    update public.collections set user_id = legacy_owner where user_id is null;
    update public.notes        set user_id = legacy_owner where user_id is null;
    update public.tags         set user_id = legacy_owner where user_id is null;
  end if;

  select
    (select count(*) from public.collections where user_id is null)
  + (select count(*) from public.notes       where user_id is null)
  + (select count(*) from public.tags        where user_id is null)
  into unowned;

  if unowned > 0 then
    raise exception
      '% row(s) across collections/notes/tags still have no owner', unowned
      using hint =
        'Set legacy_owner to an auth.users.id (Option A), or delete the legacy rows (Option B), then run this migration again.';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. Enforce that every row has an owner
--
-- Safe to run only because step 2 either filled or removed every unowned row.
-- ---------------------------------------------------------------------------

alter table public.collections alter column user_id set not null;
alter table public.notes       alter column user_id set not null;
alter table public.tags        alter column user_id set not null;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--
-- The Part 5/6 policies are dropped by name and replaced. Their names still
-- said "anon full access ..." after Part 6 moved them to `authenticated`,
-- which no longer described what they did; the replacements are named for what
-- they enforce.
--
-- One `for all` policy per table. Postgres applies `using` to SELECT, UPDATE
-- and DELETE, and `with check` to INSERT and UPDATE, so a single policy covers
-- all four requirements:
--   SELECT — `using`      → only your rows are visible
--   INSERT — `with check` → the new row must be yours
--   UPDATE — both         → you may only change your rows, and may not hand
--                           one to someone else
--   DELETE — `using`      → you may only delete your rows
--
-- `(select auth.uid())` rather than a bare `auth.uid()`: the subquery form is
-- evaluated once per statement instead of once per row, which is the
-- difference between a constant and a per-row function call on a large scan.
-- ---------------------------------------------------------------------------

alter table public.collections enable row level security;
alter table public.notes       enable row level security;
alter table public.tags        enable row level security;
alter table public.note_tags   enable row level security;

drop policy if exists "anon full access to collections" on public.collections;
drop policy if exists "anon full access to notes"       on public.notes;
drop policy if exists "anon full access to tags"        on public.tags;
drop policy if exists "anon full access to note_tags"   on public.note_tags;

create policy "collections are private to their owner"
  on public.collections
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Notes carry a second condition. `collection_id` is a foreign key, and
-- foreign key validation does not consult RLS, so without this a user could
-- file their own note inside another user's collection by supplying that id.
-- The `exists` runs under the collections policy above, so it can only ever
-- see collections the caller owns.
create policy "notes are private to their owner"
  on public.notes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      collection_id is null
      or exists (
        select 1
        from public.collections c
        where c.id = notes.collection_id
          and c.user_id = (select auth.uid())
      )
    )
  );

create policy "tags are private to their owner"
  on public.tags
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- `note_tags` has no owner column, so ownership is derived.
--
-- `using`: the note's owner owns the pairing. Reading, and removing a tag from
-- a note, follow the note.
--
-- `with check`: creating a pairing additionally requires owning the tag, so a
-- user cannot attach someone else's tag to their own note. Keeping the tag
-- check out of `using` means a pairing is always removable by the note's
-- owner, which avoids a row that no one can delete.
create policy "note_tags follow the ownership of their note"
  on public.note_tags
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.notes n
      where n.id = note_tags.note_id
        and n.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.notes n
      where n.id = note_tags.note_id
        and n.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.tags t
      where t.id = note_tags.tag_id
        and t.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Indexes
--
-- Every policy above filters on `user_id`, and every query the app issues now
-- carries that filter implicitly. Postgres does not index a foreign key
-- column automatically, so without these each read is a sequential scan with
-- the policy applied per row.
-- ---------------------------------------------------------------------------

create index if not exists collections_user_id_idx on public.collections (user_id);
create index if not exists notes_user_id_idx       on public.notes (user_id);
create index if not exists tags_user_id_idx        on public.tags (user_id);

-- ---------------------------------------------------------------------------
-- 6. Verification — run after the migration and read the output
-- ---------------------------------------------------------------------------

-- Every ownership column present, not null, defaulted:
--   select table_name, column_name, is_nullable, column_default
--   from information_schema.columns
--   where table_schema = 'public' and column_name = 'user_id'
--   order by table_name;

-- Exactly one policy per table, all on `{authenticated}`, none permissive:
--   select tablename, policyname, roles, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('collections', 'notes', 'tags', 'note_tags')
--   order by tablename;

-- RLS on, for all four:
--   select relname, relrowsecurity
--   from pg_class
--   where relnamespace = 'public'::regnamespace
--     and relname in ('collections', 'notes', 'tags', 'note_tags');

-- No unowned rows survived:
--   select 'collections' as t, count(*) from public.collections where user_id is null
--   union all select 'notes', count(*) from public.notes where user_id is null
--   union all select 'tags',  count(*) from public.tags  where user_id is null;
