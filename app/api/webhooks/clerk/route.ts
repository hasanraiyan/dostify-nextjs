import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

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
      const primaryEmail =
        data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
          ?.email_address ?? data.email_addresses?.[0]?.email_address

      if (!primaryEmail) {
        return new Response('No email address', { status: 400 })
      }

      const name =
        [data.first_name, data.last_name].filter(Boolean).join(' ').trim() ||
        data.username ||
        null

      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: {
          email: primaryEmail,
          name,
          imageUrl: data.image_url ?? null,
        },
        create: {
          clerkId: data.id,
          email: primaryEmail,
          name,
          imageUrl: data.image_url ?? null,
        },
      })
    } else if (type === 'user.deleted') {
      await prisma.user.delete({ where: { clerkId: data.id } }).catch(() => null)
    }

    return Response.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(message, { status: 500 })
  }
}
