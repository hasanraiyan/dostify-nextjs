import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { syncClerkUser } from '@/lib/sync-user'

/**
 * The signed-in user's DB row (created from Clerk if the webhook was missed).
 * Reads the session, so call it inside a <Suspense> boundary or a server action.
 */
export async function getCurrentDbUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  const existing = await prisma.user.findUnique({ where: { clerkId } })
  return existing ?? (await syncClerkUser(clerkId))
}
