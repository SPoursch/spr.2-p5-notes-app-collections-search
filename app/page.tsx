import { redirect } from 'next/navigation'

import { getAuthenticatedUser } from '@/app/lib/db'

/**
 * Entry point.
 *
 * The workspace moved to /workspace in Part 6 so that one protected subtree
 * can be guarded in one place. This route keeps "/" working by sending each
 * visitor to whichever page applies to them, rather than leaving the old
 * address dead.
 */
export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getAuthenticatedUser()

  redirect(user ? '/workspace' : '/login')
}
