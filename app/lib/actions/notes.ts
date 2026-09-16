'use server'

import { revalidatePath } from 'next/cache'

import { createNote, deleteNote, updateNote, NotesDatabaseError } from '../db'
import type { NoteActionState } from './note-action-state'

/**
 * Server Actions for the notes CRUD UI.
 *
 * These actions own input validation and the mapping from database failures to
 * user-safe messages. They never touch supabase-js: every read and write is
 * delegated to app/lib/db.ts, per CLAUDE.md.
 *
 * A Server Action is a public POST endpoint, so all input is treated as
 * untrusted and every return value is a small, safe shape rather than a raw
 * database row or error.
 */

const NOTES_PATH = '/'

const MAX_TITLE_LENGTH = 200
const MAX_BODY_LENGTH = 10_000

function failure(message: string): NoteActionState {
  return { ok: false, message, at: Date.now() }
}

function success(): NoteActionState {
  return { ok: true, message: null, at: Date.now() }
}

/**
 * Reads a text field from FormData.
 *
 * Returns null for absent, non-string or blank values so that "empty" has a
 * single representation before it reaches the database, rather than an
 * empty string in some rows and null in others.
 */
function readOptionalText(formData: FormData, field: string): string | null {
  const raw = formData.get(field)

  if (typeof raw !== 'string') {
    return null
  }

  const trimmed = raw.trim()

  return trimmed.length > 0 ? trimmed : null
}

/** Reads the note id, rejecting anything that is not a plausible uuid. */
function readNoteId(formData: FormData): string | null {
  const raw = formData.get('id')

  if (typeof raw !== 'string') {
    return null
  }

  const id = raw.trim()
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  return isUuid ? id : null
}

/**
 * Validates title and body, returning either the cleaned values or a message.
 * A note with neither a title nor a body is rejected: it would render as an
 * empty card with nothing to identify it.
 */
function validateContent(
  formData: FormData,
): { title: string | null; body: string | null } | { error: string } {
  const title = readOptionalText(formData, 'title')
  const body = readOptionalText(formData, 'body')

  if (title === null && body === null) {
    return { error: 'Add a title or some content before saving.' }
  }

  if (title !== null && title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` }
  }

  if (body !== null && body.length > MAX_BODY_LENGTH) {
    return { error: `Note must be ${MAX_BODY_LENGTH} characters or fewer.` }
  }

  return { title, body }
}

/**
 * Converts a thrown database failure into a message safe to show a user.
 * The underlying error is logged server-side only, so Postgres details and
 * schema names never reach the browser.
 */
function toSafeMessage(error: unknown, fallback: string): string {
  if (error instanceof NotesDatabaseError) {
    console.error(`[notes] ${error.operation} failed:`, error.cause?.message)
  } else {
    console.error('[notes] unexpected failure:', error)
  }

  return fallback
}

export async function createNoteAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const validated = validateContent(formData)

  if ('error' in validated) {
    return failure(validated.error)
  }

  try {
    await createNote(validated)
  } catch (error) {
    return failure(toSafeMessage(error, 'Could not create the note. Please try again.'))
  }

  revalidatePath(NOTES_PATH)

  return success()
}

export async function updateNoteAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const id = readNoteId(formData)

  if (id === null) {
    return failure('That note could not be identified.')
  }

  const validated = validateContent(formData)

  if ('error' in validated) {
    return failure(validated.error)
  }

  let updated
  try {
    updated = await updateNote(id, validated)
  } catch (error) {
    return failure(toSafeMessage(error, 'Could not save the note. Please try again.'))
  }

  // Revalidated before the outcome is known, because a write that matched no
  // row still means the list on screen is stale: the note was removed
  // elsewhere. Without this the card stays rendered next to a message saying
  // it no longer exists.
  revalidatePath(NOTES_PATH)

  if (updated === null) {
    return failure('That note no longer exists, or is not visible to you.')
  }

  return success()
}

export async function deleteNoteAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const id = readNoteId(formData)

  if (id === null) {
    return failure('That note could not be identified.')
  }

  let deleted
  try {
    deleted = await deleteNote(id)
  } catch (error) {
    return failure(toSafeMessage(error, 'Could not delete the note. Please try again.'))
  }

  // Revalidated before the outcome is known, for the same reason as in
  // updateNoteAction: a delete that matched no row means the row is already
  // gone, so the stale card has to be cleared either way.
  revalidatePath(NOTES_PATH)

  if (deleted === null) {
    return failure('That note no longer exists, or is not visible to you.')
  }

  return success()
}
