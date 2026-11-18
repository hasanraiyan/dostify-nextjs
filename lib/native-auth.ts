import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Hand-off of a browser sign-in back to the mobile app (PKCE-style).
 *
 * The app makes a random `verifier` and sends only its hash (`challenge`) to the
 * browser. After sign-in the server wraps a short-lived Clerk sign-in ticket in a
 * signed `code` bound to that challenge. Another app that grabs the `dostify://`
 * link gets a code it cannot redeem, because it does not have the verifier.
 */
const TTL_MS = 2 * 60 * 1000;

const b64 = (buf: Buffer) => buf.toString("base64url");
const sha256b64 = (value: string) => b64(createHash("sha256").update(value).digest());

function key() {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error("CLERK_SECRET_KEY is not set");
  return secret;
}

const sign = (payload: string) => b64(createHmac("sha256", key()).update(payload).digest());

export function isValidChallenge(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function createCode(ticket: string, challenge: string) {
  const payload = b64(Buffer.from(JSON.stringify({ t: ticket, c: challenge, e: Date.now() + TTL_MS })));
  return `${payload}.${sign(payload)}`;
}

/** Returns the Clerk ticket when the code is genuine, fresh and matches the verifier. */
export function redeemCode(code: string, verifier: string): string | null {
  const [payload, sig] = code.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { t, c, e } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof t !== "string" || typeof e !== "number" || Date.now() > e) return null;
    if (c !== sha256b64(verifier)) return null;
    return t;
  } catch {
    return null;
  }
}
