import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function syncClerkUser(userId: string) {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? user.emailAddresses[0]?.emailAddress

    if (!primaryEmail) return null

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.username ||
      null

    return await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        email: primaryEmail,
        name,
        imageUrl: user.imageUrl ?? null,
      },
      create: {
        clerkId: user.id,
        email: primaryEmail,
        name,
        imageUrl: user.imageUrl ?? null,
      },
    })
  } catch (error) {
    console.error('Failed to sync Clerk user to DB:', error)
    return null
  }
}
