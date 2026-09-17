'use server'

import { revalidatePath } from 'next/cache'

import { createCollection, setNoteCollection, NotesDatabaseError } from '../db'
import { failure, success, type NoteActionState } from './note-action-state'
import { requireUser } from './require-auth'

/**
 * Server Actions for collections.
 *
 * These mirror app/lib/actions/notes.ts: they own input validation and the
 * mapping from database failures to user-safe messages, and they never touch
 * supabase-js. Every read and write is delegated to app/lib/db.ts, per
 * CLAUDE.md.
 *
 * A Server Action is a public POST endpoint, so all input is treated as
 * untrusted and every return value is a small, safe shape rather than a raw
 * database row or error.
 *
 * Scope: creating a collection (requirement 7) and assigning a note to one
 * (requirement 8). Listing collections is a read and happens in the Server
 * Component that renders them, as the notes list does.
 */

/**
 * Collections and notes render on the same route, so one revalidation covers
 * both the sidebar and the workspace.
 */
const COLLECTIONS_PATH = '/workspace'

const MAX_NAME_LENGTH = 100

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Reads a form field as a uuid, rejecting anything that is not one. */
function readUuid(formData: FormData, field: string): string | null {
  const raw = formData.get(field)

  if (typeof raw !== 'string') {
    return null
  }

  const value = raw.trim()

  return UUID_PATTERN.test(value) ? value : null
}

/**
 * Converts a thrown database failure into a message safe to show a user.
 * The underlying error is logged server-side only, so Postgres details and
 * schema names never reach the browser.
 */
function toSafeMessage(error: unknown, fallback: string): string {
  if (error instanceof NotesDatabaseError) {
    console.error(
      `[collections] ${error.operation} on ${error.table} failed:`,
      error.cause,
    )
  } else {
    console.error('[collections] unexpected failure:', error)
  }

  return fallback
}

/**
 * Creates a named collection (requirement 7).
 *
 * The name is trimmed before validation so that whitespace-only input is
 * rejected rather than stored as a blank-looking collection. `name` is
 * `not null` in the database but has no length or emptiness constraint, so
 * both checks belong here.
 */
export async function createCollectionAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  // Authorise before anything else: an unauthenticated caller must not
  // reach validation, the database, or any message that reveals either.
  const denied = await requireUser()

  if (denied) {
    return denied
  }

  const raw = formData.get('name')
  const name = typeof raw === 'string' ? raw.trim() : ''

  if (name.length === 0) {
    return failure('Give the collection a name before saving.')
  }

  if (name.length > MAX_NAME_LENGTH) {
    return failure(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
  }

  try {
    await createCollection(name)
  } catch (error) {
    return failure(
      toSafeMessage(error, 'Could not create the collection. Please try again.'),
    )
  }

  revalidatePath(COLLECTIONS_PATH)

  return success()
}

/**
 * Assigns a note to a collection, or removes it from any collection
 * (requirement 8).
 *
 * An absent or empty `collectionId` field means "no collection", which is a
 * legitimate choice rather than a validation error: a note may sit outside any
 * collection. A non-empty value that is not a uuid is rejected.
 */
export async function setNoteCollectionAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  // Authorise before anything else: an unauthenticated caller must not
  // reach validation, the database, or any message that reveals either.
  const denied = await requireUser()

  if (denied) {
    return denied
  }

  const noteId = readUuid(formData, 'noteId')

  if (noteId === null) {
    return failure('That note could not be identified.')
  }

  const rawCollection = formData.get('collectionId')
  const requestedCollection =
    typeof rawCollection === 'string' ? rawCollection.trim() : ''

  let collectionId: string | null = null

  if (requestedCollection.length > 0) {
    collectionId = readUuid(formData, 'collectionId')

    if (collectionId === null) {
      return failure('That collection could not be identified.')
    }
  }

  let updated
  try {
    updated = await setNoteCollection(noteId, collectionId)
  } catch (error) {
    return failure(
      toSafeMessage(error, 'Could not move the note. Please try again.'),
    )
  }

  // Revalidated before the outcome is known, matching updateNoteAction: a write
  // that matched no row still means the list on screen is stale.
  revalidatePath(COLLECTIONS_PATH)

  // A missing note is reported rather than treated as success. `setNoteCollection`
  // returns null only when no row matched the id.
  if (updated === null) {
    return failure('That note no longer exists, or is not visible to you.')
  }

  return success()
}
