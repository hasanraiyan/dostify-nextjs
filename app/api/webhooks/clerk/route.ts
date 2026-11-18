import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'
import { toUserFields } from '@/lib/user-fields'

type ClerkEmailAddress = { id: string; email_address: string }
type ClerkUser = {
  id: string
  email_addresses?: ClerkEmailAddress[]
  primary_email_address_id?: string | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  image_url?: string | null
  deleted?: boolean
}

type ClerkEvent = {
  type: string
  data: ClerkUser
}

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 })
  }

  const payload = await request.text()
  const headerList = await headers()
  const svixId = headerList.get('svix-id')
  const svixTimestamp = headerList.get('svix-timestamp')
  const svixSignature = headerList.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing Svix headers', { status: 400 })
  }

  let event: ClerkEvent
  try {
    const webhook = new Webhook(secret)
    event = webhook.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as unknown as ClerkEvent
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  const { type, data } = event

  try {
    if (type === 'user.created' || type === 'user.updated') {
      const { email, name, imageUrl } = toUserFields({
        emails: (data.email_addresses ?? []).map((e) => ({
          id: e.id,
          email: e.email_address,
        })),
        primaryEmailId: data.primary_email_address_id,
        firstName: data.first_name,
        lastName: data.last_name,
        username: data.username,
        imageUrl: data.image_url,
      })

      // Nothing to store yet; 200 so Clerk doesn't retry.
      if (!email) return Response.json({ received: true, skipped: 'no-email' })

      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: { email, name, imageUrl },
        create: { clerkId: data.id, email, name, imageUrl },
      })
    } else if (type === 'user.deleted') {
      await prisma.user.delete({ where: { clerkId: data.id } }).catch(() => null)
    }

    return Response.json({ received: true })
  } catch (error) {
    // Email already belongs to another clerkId: retrying can't fix it.
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      console.error('Clerk webhook: email conflict for', type, data.id)
      return Response.json({ received: true, skipped: 'email-conflict' })
    }
    console.error('Clerk webhook failed:', type, data.id, error)
    return new Response('Webhook handler failed', { status: 500 })
  }
}
