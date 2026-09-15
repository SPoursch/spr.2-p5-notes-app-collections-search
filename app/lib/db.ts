import type { PostgrestError } from '@supabase/supabase-js'

import { getSupabaseClient } from './supabase'

/**
 * Centralised data-access layer.
 *
 * Per CLAUDE.md, every Supabase read and write goes through this module. No
 * component, route handler or server action may call supabase-js directly: if a
 * new query is needed, add a function here and call that.
 *
 * Scope: the `notes` table only. Collections, tags and search are added in
 * later steps of the Part 5 implementation sequence.
 *
 * Query patterns follow the official supabase-js documentation:
 *   https://supabase.com/docs/reference/javascript/select
 *   https://supabase.com/docs/reference/javascript/insert
 */

const NOTES_TABLE = 'notes'

/**
 * A row of the `notes` table, matching the schema verified in
 * docs/supabase-schema.md.
 *
 * `created_at` is `not null` with a database default. `updated_at` is null
 * until the row is first updated, when a database trigger sets it — so null
 * means "never edited". Titles and bodies are independently optional.
 */
export type Note = {
  id: string
  title: string | null
  body: string | null
  created_at: string
  updated_at: string | null
}

/** Fields a caller may supply when creating a note. */
export type CreateNoteInput = {
  title?: string | null
  body?: string | null
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
  readonly cause?: PostgrestError

  constructor(operation: string, cause: PostgrestError) {
    super(`Supabase ${operation} on "${NOTES_TABLE}" failed: ${cause.message}`)
    this.name = 'NotesDatabaseError'
    this.operation = operation
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
    .select('id, title, body, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new NotesDatabaseError('select', error)
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
    .select('id, title, body, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new NotesDatabaseError('select single', error)
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
    })
    .select('id, title, body, created_at, updated_at')
    .single()

  if (error) {
    throw new NotesDatabaseError('insert', error)
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
    .select('id, title, body, created_at, updated_at')
    .maybeSingle()

  if (error) {
    throw new NotesDatabaseError('update', error)
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
    .select('id, title, body, created_at, updated_at')
    .maybeSingle()

  if (error) {
    throw new NotesDatabaseError('delete', error)
  }

  return (data as Note | null) ?? null
}
