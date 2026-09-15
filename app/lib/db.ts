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
 * Every column except `id` is nullable in the database, so callers must handle
 * null titles, bodies and timestamps rather than assuming strings.
 */
export type Note = {
  id: string
  title: string | null
  body: string | null
  created_at: string | null
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
 * `updated_at` has no database default and no trigger (see
 * docs/supabase-schema.md), so the application is solely responsible for it.
 * It is set on create as well as on update, so the column is never null for
 * rows this module writes.
 */
function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Lists notes, newest first.
 *
 * Ordered by `created_at` rather than `updated_at` because rows created outside
 * this module may have a null `updated_at`. `nullsFirst: false` keeps any row
 * with a null timestamp at the end instead of the top.
 *
 * Note: if row level security is enabled on `notes` without a matching policy,
 * this resolves to an empty array rather than an error.
 */
export async function listNotes(): Promise<Note[]> {
  const { data, error } = await getSupabaseClient()
    .from(NOTES_TABLE)
    .select('id, title, body, created_at, updated_at')
    .order('created_at', { ascending: false, nullsFirst: false })

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
 * `id` and `created_at` are left to their database defaults
 * (`gen_random_uuid()` and `now()`). `updated_at` is set explicitly because the
 * column has no default. `.select().single()` is chained because supabase-js
 * returns no rows from an insert otherwise.
 */
export async function createNote(input: CreateNoteInput = {}): Promise<Note> {
  const { data, error } = await getSupabaseClient()
    .from(NOTES_TABLE)
    .insert({
      title: input.title ?? null,
      body: input.body ?? null,
      updated_at: nowIso(),
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
 * `updated_at` is always refreshed, including when the caller passes no fields,
 * so the timestamp reflects the write. Keys omitted from `input` are not sent,
 * leaving those columns untouched.
 */
export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<Note | null> {
  const patch: Record<string, string | null> = { updated_at: nowIso() }

  if ('title' in input) {
    patch.title = input.title ?? null
  }

  if ('body' in input) {
    patch.body = input.body ?? null
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
