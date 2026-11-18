import { prisma } from '@/lib/prisma'

/**
 * Journal queries shared by the dashboard page/actions and the chat's MCP
 * tool. Every function takes the DB user id and scopes by it, so one user
 * can never read or change another's entries.
 */

export interface ListOptions {
  limit?: number
  /** Case-insensitive text match over the whole entry (title and body). */
  query?: string
  pinnedOnly?: boolean
  /** Entries created at or after this instant. */
  since?: Date
  /** Entries created before this instant. */
  until?: Date
}

export function listEntries(userId: string, opts: ListOptions = {}) {
  const { limit = 100, query, pinnedOnly, since, until } = opts
  const q = query?.trim()
  return prisma.journalEntry.findMany({
    where: {
      userId,
      ...(q && { text: { contains: q, mode: 'insensitive' as const } }),
      ...(pinnedOnly && { pinned: true }),
      ...((since || until) && {
        createdAt: { ...(since && { gte: since }), ...(until && { lt: until }) },
      }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export function getEntry(userId: string, id: string) {
  return prisma.journalEntry.findFirst({ where: { id, userId } })
}

export function createEntry(
  userId: string,
  data: { text: string; mood?: number; pinned?: boolean },
) {
  return prisma.journalEntry.create({ data: { userId, ...data } })
}

/** Changes only the fields given. Returns the updated entry, or null if it isn't this user's. */
export async function patchEntry(
  userId: string,
  id: string,
  changes: { text?: string; mood?: number | null; pinned?: boolean },
) {
  const { count } = await prisma.journalEntry.updateMany({ where: { id, userId }, data: changes })
  return count > 0 ? getEntry(userId, id) : null
}

/** Returns true if an entry of this user was updated. */
export async function updateEntryText(userId: string, id: string, text: string) {
  return (await patchEntry(userId, id, { text })) !== null
}

/** Returns true if an entry of this user was updated. */
export async function setEntryPinned(userId: string, id: string, pinned: boolean) {
  return (await patchEntry(userId, id, { pinned })) !== null
}

/** Returns true if an entry of this user was deleted. */
export async function deleteEntry(userId: string, id: string) {
  const { count } = await prisma.journalEntry.deleteMany({ where: { id, userId } })
  return count > 0
}

export function countEntries(userId: string) {
  return prisma.journalEntry.count({ where: { userId } })
}
