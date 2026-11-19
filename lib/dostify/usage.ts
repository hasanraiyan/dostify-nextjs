import { prisma } from "@/lib/prisma";
import {
  FREE_MONTHLY_MESSAGES,
  FREE_MONTHLY_VOICE_SECONDS,
  MAX_CALL_SECONDS,
  monthKeyIST,
  monthStartIST,
} from "./usage-limits";

export type UsageSummary = {
  month: string;
  messages: number;
  messageLimit: number;
  voiceSeconds: number;
  voiceLimitSeconds: number;
};

async function dbUserId(userId: string): Promise<string | null> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return existing?.id ?? null;
}

function callSeconds(startedAt: Date, endedAt: Date | null, now: Date) {
  const end = endedAt ?? now;
  const secs = Math.max(0, (end.getTime() - startedAt.getTime()) / 1000);
  return Math.min(secs, MAX_CALL_SECONDS);
}

/** This month's usage for the signed-in user. */
export async function getUsageSummary(authUserId: string): Promise<UsageSummary | null> {
  const userId = await dbUserId(authUserId);
  if (!userId) return null;
  const now = new Date();
  const month = monthKeyIST(now);
  const [row, sessions] = await Promise.all([
    prisma.usageMonthly.findUnique({ where: { userId_month: { userId, month } } }),
    prisma.voiceSession.findMany({
      where: { userId, startedAt: { gte: monthStartIST(month) } },
      select: { startedAt: true, endedAt: true },
    }),
  ]);
  const voiceSeconds = Math.round(
    sessions.reduce((sum, s) => sum + callSeconds(s.startedAt, s.endedAt, now), 0),
  );
  return {
    month,
    messages: row?.messages ?? 0,
    messageLimit: FREE_MONTHLY_MESSAGES,
    voiceSeconds,
    voiceLimitSeconds: FREE_MONTHLY_VOICE_SECONDS,
  };
}

export async function messagesLeft(authUserId: string): Promise<boolean> {
  const s = await getUsageSummary(authUserId);
  return !s || s.messages < s.messageLimit;
}

export async function voiceLeft(authUserId: string): Promise<boolean> {
  const s = await getUsageSummary(authUserId);
  return !s || s.voiceSeconds < s.voiceLimitSeconds;
}

export async function recordMessage(authUserId: string) {
  const userId = await dbUserId(authUserId);
  if (!userId) return;
  const month = monthKeyIST();
  await prisma.usageMonthly.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, messages: 1 },
    update: { messages: { increment: 1 } },
  });
}

/** The browser reports the call connected. Any call left open is closed first. */
export async function startVoiceSession(authUserId: string) {
  const userId = await dbUserId(authUserId);
  if (!userId) return;
  const now = new Date();
  await prisma.voiceSession.updateMany({
    where: { userId, endedAt: null },
    data: { endedAt: now },
  });
  await prisma.voiceSession.create({ data: { userId, startedAt: now } });
}

/** The browser reports the call ended. */
export async function endVoiceSession(authUserId: string) {
  const userId = await dbUserId(authUserId);
  if (!userId) return;
  await prisma.voiceSession.updateMany({
    where: { userId, endedAt: null },
    data: { endedAt: new Date() },
  });
}

/** What the user sees when a limit is hit. */
export const LIMIT_MESSAGES = {
  chat: `You've used all ${FREE_MONTHLY_MESSAGES} free messages for this month. They reset on the 1st.`,
  voice: "You've used all your free voice time for this month. It resets on the 1st.",
} as const;
