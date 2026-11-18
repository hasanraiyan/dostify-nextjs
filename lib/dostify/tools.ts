import { z } from 'zod'
import type { createMcpHandler } from 'mcp-handler'
import { prisma } from '@/lib/prisma'
import { syncClerkUser } from '@/lib/sync-user'
import {
  countEntries,
  createEntry,
  deleteEntry,
  getEntry,
  listEntries,
  patchEntry,
} from '@/lib/dostify/journal'
import { joinText, splitText } from '@/lib/dostify/entry-text'

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

const isoDate = z.iso.datetime({ offset: true })

interface JournalArgs {
  action: 'list' | 'search' | 'get' | 'create' | 'update' | 'delete'
  id?: string
  title?: string
  body?: string
  mood?: number | null
  pinned?: boolean
  query?: string
  limit?: number
  since?: string
  until?: string
  confirm?: boolean
}

const needId = (a: JournalArgs) => {
  if (!a.id) throw new Error(`${a.action} needs an \`id\`. Use list or search to find it.`)
  return a.id
}

/** What the agent sees for an entry: title and body split out. */
function present(e: { id: string; text: string; mood: number | null; pinned: boolean; createdAt: Date }) {
  const { title, body } = splitText(e.text)
  return { id: e.id, title, body, mood: e.mood, pinned: e.pinned, createdAt: e.createdAt }
}

export function registerDostifyTools(server: McpServer) {
  server.registerTool(
    'manage_journal',
    {
      description: [
        "Read and change the user's journal with one tool. Pick an `action`:",
        '- list: recent entries (newest first). Optional limit, pinnedOnly, since, until.',
        '- search: entries containing `query`. Optional limit, since, until.',
        '- get: one entry by `id`.',
        '- create: a new entry. Needs `body`; `title` is optional. Optional mood (1-5) and pinned.',
        '- update: change an entry by `id`. Pass ONLY what should change (title, body, mood, pinned); the rest is kept. Use pinned to pin or unpin. `mood: null` clears the mood.',
        '- delete: permanently remove an entry by `id`. Ask the user to confirm first (confirm_action), then call again with `confirm: true`; without it the delete is refused.',
        'An entry is a title plus a body. Find an `id` with list or search before get, update or delete. Dates (since, until) are ISO 8601 with an offset, e.g. 2026-11-18T00:00:00+05:30.',
      ].join('\n'),
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        action: z.enum(['list', 'search', 'get', 'create', 'update', 'delete']),
        id: z.string().optional().describe('Entry id (get, update, delete).'),
        title: z.string().max(200).optional().describe('First line of the entry (create, update).'),
        body: z.string().max(5000).optional().describe('The text under the title (create, update).'),
        mood: z.number().int().min(1).max(5).nullable().optional().describe('1 (very low) to 5 (great).'),
        pinned: z.boolean().optional().describe('Pin or unpin (create, update; list filters to pinned).'),
        query: z.string().max(200).optional().describe('Text to look for (search).'),
        limit: z.number().int().min(1).max(50).optional().describe('How many entries (list, search). Default 10.'),
        since: isoDate.optional().describe('Only entries created at or after this time (list, search).'),
        until: isoDate.optional().describe('Only entries created before this time (list, search).'),
        confirm: z.boolean().optional().describe('Must be true to delete, and only after the user agreed.'),
      }),
    },
    tool(async (a: JournalArgs, userId) => {
      switch (a.action) {
        case 'list':
        case 'search': {
          if (a.action === 'search' && !a.query?.trim()) throw new Error('search needs a `query`.')
          const entries = await listEntries(userId, {
            limit: a.limit ?? 10,
            query: a.action === 'search' ? a.query : undefined,
            pinnedOnly: a.action === 'list' ? a.pinned : undefined,
            since: a.since ? new Date(a.since) : undefined,
            until: a.until ? new Date(a.until) : undefined,
          })
          return { count: entries.length, entries: entries.map(present) }
        }
        case 'get': {
          const entry = await getEntry(userId, needId(a))
          if (!entry) throw new Error('Entry not found.')
          return present(entry)
        }
        case 'create': {
          const text = joinText((a.title ?? '').trim(), (a.body ?? '').trim()).trim()
          if (!text) throw new Error('create needs a `body` (or a `title`).')
          const entry = await createEntry(userId, {
            text,
            ...(a.mood != null && { mood: a.mood }),
            ...(a.pinned !== undefined && { pinned: a.pinned }),
          })
          return present(entry)
        }
        case 'update': {
          const id = needId(a)
          if (a.title === undefined && a.body === undefined && a.mood === undefined && a.pinned === undefined) {
            throw new Error('update needs at least one of title, body, mood or pinned.')
          }
          let text: string | undefined
          if (a.title !== undefined || a.body !== undefined) {
            const current = await getEntry(userId, id)
            if (!current) throw new Error('Entry not found.')
            const old = splitText(current.text)
            text = joinText((a.title ?? old.title).trim(), (a.body ?? old.body).trim()).trim()
            if (!text) throw new Error('An entry cannot be empty.')
          }
          const entry = await patchEntry(userId, id, {
            ...(text !== undefined && { text }),
            ...(a.mood !== undefined && { mood: a.mood }),
            ...(a.pinned !== undefined && { pinned: a.pinned }),
          })
          if (!entry) throw new Error('Entry not found.')
          return present(entry)
        }
        case 'delete': {
          if (a.confirm !== true) {
            throw new Error('Not deleted: ask the user to confirm first (use confirm_action), then call delete again with confirm: true.')
          }
          if (!(await deleteEntry(userId, needId(a)))) throw new Error('Entry not found.')
          return { deleted: true }
        }
      }
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
        countEntries(userId),
      ])
      return { name: user.name, memberSince: user.createdAt, journalEntries }
    }),
  )
}
