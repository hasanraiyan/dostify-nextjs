import { prisma } from '@/lib/prisma'

/**
 * Journal queries shared by the dashboard page/actions and the chat's MCP
 * tools. Every function takes the DB user id and scopes by it, so one user
 * can never read or change another's entries.
 */

export function listEntries(userId: string, opts: { limit?: number; query?: string } = {}) {
  const { limit = 100, query } = opts
  const q = query?.trim()
  return prisma.journalEntry.findMany({
    where: { userId, ...(q && { text: { contains: q, mode: 'insensitive' as const } }) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export function createEntry(userId: string, data: { text: string; mood?: number }) {
  return prisma.journalEntry.create({ data: { userId, ...data } })
}

/** Returns true if an entry of this user was updated. */
export async function updateEntryText(userId: string, id: string, text: string) {
  const { count } = await prisma.journalEntry.updateMany({ where: { id, userId }, data: { text } })
  return count > 0
}

/** Returns true if an entry of this user was deleted. */
export async function deleteEntry(userId: string, id: string) {
  const { count } = await prisma.journalEntry.deleteMany({ where: { id, userId } })
  return count > 0
}

/** Returns true if an entry of this user was updated. */
export async function setEntryPinned(userId: string, id: string, pinned: boolean) {
  const { count } = await prisma.journalEntry.updateMany({ where: { id, userId }, data: { pinned } })
  return count > 0
}

export function countEntries(userId: string) {
  return prisma.journalEntry.count({ where: { userId } })
}
