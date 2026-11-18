import { z } from 'zod'
import type { createMcpHandler } from 'mcp-handler'
import { prisma } from '@/lib/prisma'
import { syncClerkUser } from '@/lib/sync-user'

type McpServer = Parameters<Parameters<typeof createMcpHandler>[0]>[0]

type Ctx = { http?: { authInfo?: { extra?: Record<string, unknown> } } }

/** Resolves the signed-in Clerk user to our DB user id. Every query is scoped to it. */
async function requireUserId(ctx: Ctx): Promise<string> {
  const clerkId = ctx.http?.authInfo?.extra?.userId
  if (typeof clerkId !== 'string' || !clerkId) throw new Error('Not signed in.')
  const existing = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (existing) return existing.id
  const synced = await syncClerkUser(clerkId)
  if (!synced) throw new Error('Could not load your account.')
  return synced.id
}

const ok = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data) }],
})
const fail = (message: string) => ({
  isError: true,
  content: [{ type: 'text' as const, text: message }],
})

/** Runs a tool body, turning thrown errors into a plain tool error. */
function tool<A>(fn: (args: A, userId: string) => Promise<unknown>) {
  return async (args: A, ctx: Ctx) => {
    try {
      return ok(await fn(args, await requireUserId(ctx)))
    } catch (err) {
      console.error('[dostify-tool]', err)
      return fail(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }
}

export function registerDostifyTools(server: McpServer) {
  server.registerTool(
    'add_journal_entry',
    {
      description:
        'Save a mood journal entry the user wants to write down. mood is optional, 1 (very low) to 5 (great).',
      inputSchema: z.object({
        text: z.string().min(1).max(5000),
        mood: z.number().int().min(1).max(5).optional(),
      }),
    },
    tool(async (a: { text: string; mood?: number }, userId) => {
      return prisma.journalEntry.create({ data: { userId, ...a } })
    }),
  )

  server.registerTool(
    'list_journal_entries',
    {
      description: "Read the user's past journal entries, newest first.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(10) }),
    },
    tool(async (a: { limit: number }, userId) => {
      return prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: a.limit,
      })
    }),
  )

  server.registerTool(
    'get_profile',
    {
      description: "The user's name, when they joined, and how many journal entries they have.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    tool(async (_a: Record<string, never>, userId) => {
      const [user, journalEntries] = await Promise.all([
        prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: { name: true, createdAt: true },
        }),
        prisma.journalEntry.count({ where: { userId } }),
      ])
      return { name: user.name, memberSince: user.createdAt, journalEntries }
    }),
  )
}
