import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { toUserFields } from '@/lib/user-fields'

export async function syncClerkUser(userId: string) {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    const { email, name, imageUrl } = toUserFields({
      emails: user.emailAddresses.map((e) => ({ id: e.id, email: e.emailAddress })),
      primaryEmailId: user.primaryEmailAddressId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
    })

    if (!email) return null

    return await prisma.user.upsert({
      where: { clerkId: user.id },
      update: { email, name, imageUrl },
      create: { clerkId: user.id, email, name, imageUrl },
    })
  } catch (error) {
    console.error('Failed to sync Clerk user to DB:', error)
    return null
  }
}
