import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** The signed-in user's id (our DB user id), or null. Reads cookies: use at request time. */
export async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}
