'use server'

import { revalidatePath } from 'next/cache'

import {
  addTagToNote,
  createTag,
  removeTagFromNote,
  NotesDatabaseError,
} from '../db'
import { failure, success, type NoteActionState } from './note-action-state'

/**
 * Server Actions for tags (requirements 5 and 9).
 *
 * These mirror app/lib/actions/collections.ts: they own input validation and
 * the mapping from database failures to user-safe messages, and they never
 * touch supabase-js. Every read and write is delegated to app/lib/db.ts, per
 * CLAUDE.md.
 *
 * Scope: creating a tag, and adding or removing one on a note. Listing tags is
 * a read and happens in the Server Component that renders them. Tag filtering
 * is requirement 10 and is not implemented here.
 */

/** Tags render on the same route as everything else, so one path covers all. */
const TAGS_PATH = '/'

const MAX_NAME_LENGTH = 50

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
 * Converts a thrown database failure into a message safe to show a user. The
 * underlying error is logged server-side only, so Postgres details never reach
 * the browser.
 */
function toSafeMessage(error: unknown, fallback: string): string {
  if (error instanceof NotesDatabaseError) {
    console.error(
      `[tags] ${error.operation} on ${error.table} failed:`,
      error.cause,
    )
  } else {
    console.error('[tags] unexpected failure:', error)
  }

  return fallback
}

/**
 * Creates a tag and, when a note is supplied, attaches it to that note in the
 * same submission.
 *
 * Attaching immediately is what makes the editor's "new tag" field usable:
 * creating a loose tag and then selecting it would be two steps for what reads
 * as one action. A create that succeeds but fails to attach is reported as a
 * partial result rather than a flat failure, because the tag does now exist.
 */
export async function createTagAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const raw = formData.get('name')
  const name = typeof raw === 'string' ? raw.trim() : ''

  if (name.length === 0) {
    return failure('Give the tag a name before saving.')
  }

  if (name.length > MAX_NAME_LENGTH) {
    return failure(`Tag name must be ${MAX_NAME_LENGTH} characters or fewer.`)
  }

  // Optional: absent means "just create the tag".
  const noteId = formData.get('noteId') === null ? null : readUuid(formData, 'noteId')

  if (formData.get('noteId') !== null && noteId === null) {
    return failure('That note could not be identified.')
  }

  let created
  try {
    created = await createTag(name)
  } catch (error) {
    return failure(toSafeMessage(error, 'Could not create the tag. Please try again.'))
  }

  if (noteId !== null) {
    try {
      await addTagToNote(noteId, created.id)
    } catch (error) {
      revalidatePath(TAGS_PATH)

      return failure(
        toSafeMessage(
          error,
          `Created "${created.name}", but could not add it to this note.`,
        ),
      )
    }
  }

  revalidatePath(TAGS_PATH)

  return success()
}

/** Adds an existing tag to a note (requirement 9). */
export async function addTagToNoteAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const noteId = readUuid(formData, 'noteId')

  if (noteId === null) {
    return failure('That note could not be identified.')
  }

  const tagId = readUuid(formData, 'tagId')

  if (tagId === null) {
    return failure('Pick a tag to add.')
  }

  try {
    await addTagToNote(noteId, tagId)
  } catch (error) {
    return failure(toSafeMessage(error, 'Could not add the tag. Please try again.'))
  }

  revalidatePath(TAGS_PATH)

  return success()
}

/**
 * Removes a tag from a note (requirement 9). The tag itself is left intact, so
 * other notes keep it.
 */
export async function removeTagFromNoteAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const noteId = readUuid(formData, 'noteId')

  if (noteId === null) {
    return failure('That note could not be identified.')
  }

  const tagId = readUuid(formData, 'tagId')

  if (tagId === null) {
    return failure('That tag could not be identified.')
  }

  let removed
  try {
    removed = await removeTagFromNote(noteId, tagId)
  } catch (error) {
    return failure(toSafeMessage(error, 'Could not remove the tag. Please try again.'))
  }

  revalidatePath(TAGS_PATH)

  if (!removed) {
    return failure('That tag was already off this note.')
  }

  return success()
}
