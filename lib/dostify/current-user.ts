import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/session'

/**
 * The signed-in user's DB row.
 * Reads the session, so call it inside a <Suspense> boundary or a server action.
 */
export async function getCurrentDbUser() {
  const userId = await getUserId()
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId } })
}
