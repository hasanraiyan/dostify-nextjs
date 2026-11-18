import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { syncClerkUser } from "@/lib/sync-user";

/**
 * Normalizes phone numbers to standard E.164 (+1234567890) format.
 */
function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^0-9]/g, "");
  return `+${digits}`;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure user is synced
  await syncClerkUser(userId).catch(() => null);

  const rows = await query<{ phoneNumber: string | null }>(
    'SELECT "phoneNumber" FROM "User" WHERE "clerkId" = $1 LIMIT 1',
    [userId]
  );
  const user = rows[0];

  return NextResponse.json({
    phoneNumber: user?.phoneNumber ?? null,
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawPhone = String(body.phoneNumber ?? "").trim();

  if (!rawPhone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const normalized = normalizePhoneNumber(rawPhone);
  if (normalized.length < 8) {
    return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
  }

  // Ensure user exists in DB
  await syncClerkUser(userId).catch(() => null);

  // Update phone number directly in PostgreSQL to avoid in-memory Prisma client caching issues
  await query(
    'UPDATE "User" SET "phoneNumber" = $1, "updatedAt" = NOW() WHERE "clerkId" = $2',
    [normalized, userId]
  );

  // Sync phone number to Persona Platform so inbound Twilio calls/messages map to this user
  if (process.env.PERSONA_BASE_URL && process.env.PERSONA_CREDENTIAL) {
    try {
      await fetch(
        `${process.env.PERSONA_BASE_URL.replace(/\/+$/, "")}/api/v1/developer/users/sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PERSONA_CREDENTIAL}`,
            "x-persona-external-user-id": userId,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            externalUserId: userId,
            phoneNumber: normalized,
          }),
        }
      );
    } catch (e) {
      console.warn("Failed syncing phone to Persona backend:", e);
    }
  }

  return NextResponse.json({
    success: true,
    phoneNumber: normalized,
  });
}
