import type { PostgrestError } from '@supabase/supabase-js'

import { getSupabaseClient } from './supabase'

/**
 * Centralised data-access layer.
 *
 * Per CLAUDE.md, every Supabase read and write goes through this module. No
 * component, route handler or server action may call supabase-js directly: if a
 * new query is needed, add a function here and call that.
 *
 * Scope: the `notes` and `collections` tables. Tags and search are added in
 * later steps of the Part 5 implementation sequence.
 *
 * Query patterns follow the official supabase-js documentation:
 *   https://supabase.com/docs/reference/javascript/select
 *   https://supabase.com/docs/reference/javascript/insert
 */

const NOTES_TABLE = 'notes'
const COLLECTIONS_TABLE = 'collections'

/**
 * The columns every `notes` query selects, defined once.
 *
 * Kept as a single constant so that adding a column cannot be applied to some
 * queries and missed in others: because results are asserted with `as Note`
 * rather than validated, a missing column would surface as an `undefined`
 * field at runtime instead of a compile error.
 */
const NOTE_COLUMNS = 'id, title, body, created_at, updated_at, collection_id'

/** The columns every `collections` query selects. See NOTE_COLUMNS. */
const COLLECTION_COLUMNS = 'id, name, created_at'

/**
 * A row of the `notes` table, matching the schema verified in
 * docs/supabase-schema.md.
 *
 * `created_at` is `not null` with a database default. `updated_at` is null
 * until the row is first updated, when a database trigger sets it — so null
 * means "never edited". Titles and bodies are independently optional.
 *
 * `collection_id` is null when the note sits outside any collection, which is
 * the default for a newly created note. The foreign key uses `on delete set
 * null`, so deleting a collection moves its notes here rather than removing
 * them.
 */
export type Note = {
  id: string
  title: string | null
  body: string | null
  created_at: string
  updated_at: string | null
  collection_id: string | null
}

/**
 * A row of the `collections` table, matching the schema verified in
 * docs/supabase-schema.md. Every column is `not null`; `id` and `created_at`
 * have database defaults.
 *
 * There is no `updated_at`: renaming a collection is not part of Step 2, so
 * the column and its trigger were deliberately not created.
 */
export type Collection = {
  id: string
  name: string
  created_at: string
}

/** Fields a caller may supply when creating a note. */
export type CreateNoteInput = {
  title?: string | null
  body?: string | null
  /** Omitted or null leaves the note outside every collection. */
  collection_id?: string | null
}

/** Fields a caller may supply when updating a note. Omitted keys are left alone. */
export type UpdateNoteInput = {
  title?: string | null
  body?: string | null
}

/**
 * Error thrown when Supabase reports a failure. Wrapping keeps the Postgrest
 * details available while giving callers a single error type to catch.
 */
export class NotesDatabaseError extends Error {
  readonly operation: string
  readonly table: string
  readonly cause?: PostgrestError

  constructor(operation: string, table: string, cause: PostgrestError) {
    super(`Supabase ${operation} on "${table}" failed: ${cause.message}`)
    this.name = 'NotesDatabaseError'
    this.operation = operation
    this.table = table
    this.cause = cause
  }
}

/**
 * Lists notes, newest first.
 *
 * Ordered by `created_at`, which is `not null`, rather than `updated_at`, which
 * is null for any note that has never been edited.
 *
 * Note: if row level security is enabled on `notes` without a matching policy,
 * this resolves to an empty array rather than an error.
 */
export async function listNotes(): Promise<Note[]> {
  const { data, error } = await getSupabaseClient()
    .from(NOTES_TABLE)
    .select(NOTE_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    throw new NotesDatabaseError('select', NOTES_TABLE, error)
  }

  return (data ?? []) as Note[]
}

/**
 * Reads a single note by id, or null when no such row is visible.
 *
 * Uses `.maybeSingle()` so a missing row is a null result rather than an error.
 */
export async function getNote(id: string): Promise<Note | null> {
  const { data, error } = await getSupabaseClient()
    .from(NOTES_TABLE)
    .select(NOTE_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new NotesDatabaseError('select single', NOTES_TABLE, error)
  }

  return (data as Note | null) ?? null
}

/**
 * Creates a note and returns the stored row.
 *
 * Timestamps are left entirely to the database: `created_at` takes its `now()`
 * default and `updated_at` stays null until the first update. `.select()
 * .single()` is chained because supabase-js returns no rows from an insert
 * otherwise.
 */
export async function createNote(input: CreateNoteInput = {}): Promise<Note> {
  const { data, error } = await getSupabaseClient()
    .from(NOTES_TABLE)
    .insert({
      title: input.title ?? null,
      body: input.body ?? null,
      collection_id: input.collection_id ?? null,
    })
    .select(NOTE_COLUMNS)
    .single()

  if (error) {
    throw new NotesDatabaseError('insert', NOTES_TABLE, error)
  }

  return data as Note
}

/**
 * Updates a note and returns the stored row, or null when no row matched.
 *
 * `updated_at` is refreshed by a database trigger, not here. Keys omitted from
 * `input` are not sent, leaving those columns untouched; an input with no keys
 * at all is not an edit, so the row is returned unchanged.
 */
export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<Note | null> {
  const patch: Record<string, string | null> = {}

  if ('title' in input) {
    patch.title = input.title ?? null
  }

  if ('body' in input) {
    patch.body = input.body ?? null
  }

  if (Object.keys(patch).length === 0) {
    return getNote(id)
  }

  const { data, error } = await getSupabaseClient()
    .from(NOTES_TABLE)
    .update(patch)
    .eq('id', id)
    .select(NOTE_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new NotesDatabaseError('update', NOTES_TABLE, error)
  }

  return (data as Note | null) ?? null
}

/**
 * Deletes a note and returns the row that was removed, or null when no row
 * matched. `.select()` is chained so the caller can tell the two apart.
 */
export async function deleteNote(id: string): Promise<Note | null> {
  const { data, error } = await getSupabaseClient()
    .from(NOTES_TABLE)
    .delete()
    .eq('id', id)
    .select(NOTE_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new NotesDatabaseError('delete', NOTES_TABLE, error)
  }

  return (data as Note | null) ?? null
}

/**
 * Lists collections alphabetically by name.
 *
 * Ordered by `name` rather than `created_at` because the sidebar presents them
 * as a browsable list; `name` is `not null`, so no null ordering applies.
 *
 * Note: as with `listNotes`, row level security without a matching policy
 * resolves to an empty array rather than an error.
 */
export async function listCollections(): Promise<Collection[]> {
  const { data, error } = await getSupabaseClient()
    .from(COLLECTIONS_TABLE)
    .select(COLLECTION_COLUMNS)
    .order('name', { ascending: true })

  if (error) {
    throw new NotesDatabaseError('select', COLLECTIONS_TABLE, error)
  }

  return (data ?? []) as Collection[]
}

/**
 * Creates a collection and returns the stored row.
 *
 * `id` and `created_at` are left to their database defaults. The name is
 * passed through as given: validation belongs to the calling Server Action,
 * matching how note content is handled.
 */
export async function createCollection(name: string): Promise<Collection> {
  const { data, error } = await getSupabaseClient()
    .from(COLLECTIONS_TABLE)
    .insert({ name })
    .select(COLLECTION_COLUMNS)
    .single()

  if (error) {
    throw new NotesDatabaseError('insert', COLLECTIONS_TABLE, error)
  }

  return data as Collection
}

/**
 * Assigns a note to a collection, or removes it from any collection when
 * `collectionId` is null. Returns the stored row, or null when no note matched.
 *
 * `collectionId` is a required parameter rather than an optional field on
 * `UpdateNoteInput` deliberately. An optional property cannot distinguish
 * "absent" from "present and undefined" unless `exactOptionalPropertyTypes` is
 * enabled, which it is not, so an accidental `undefined` would silently clear
 * the column. A required parameter makes both intents explicit: a string
 * assigns, null unassigns.
 *
 * Note that the `notes_set_updated_at` trigger fires on this update like any
 * other, so assigning a collection marks the note as edited.
 */
export async function setNoteCollection(
  noteId: string,
  collectionId: string | null,
): Promise<Note | null> {
  const { data, error } = await getSupabaseClient()
    .from(NOTES_TABLE)
    .update({ collection_id: collectionId })
    .eq('id', noteId)
    .select(NOTE_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new NotesDatabaseError('update', NOTES_TABLE, error)
  }

  return (data as Note | null) ?? null
}
