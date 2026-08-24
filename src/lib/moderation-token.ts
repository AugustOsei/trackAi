import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, expiring links that let the review queue be worked from an email
 * without a password.
 *
 * The key is *derived* from ADMIN_SESSION_SECRET rather than being the secret
 * itself, with a domain separator. A moderation token and an admin session
 * cookie are both HMACs over a timestamp, so without this separation a leaked
 * moderation link could be replayed as a session cookie. Deriving the key
 * makes that structurally impossible and needs no extra environment variable.
 *
 * What the token grants is deliberately narrow: approve or reject reports that
 * are still pending. It does not authenticate anyone into /admin.
 */
const KEY_DOMAIN = "trackai:moderation-link:v1";

/** Long enough that a Friday email still works on Monday morning. */
export const MODERATION_TOKEN_TTL_SECONDS = 60 * 60 * 72; // 72 hours

function signingKey(adminSessionSecret: string): Buffer {
  return createHmac("sha256", adminSessionSecret).update(KEY_DOMAIN).digest();
}

function sign(payload: string, adminSessionSecret: string): string {
  return createHmac("sha256", signingKey(adminSessionSecret)).update(payload).digest("hex");
}

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

/**
 * Mint a token valid until `now + MODERATION_TOKEN_TTL_SECONDS`. The expiry is
 * carried inside the signed payload rather than compared against issue time,
 * so shortening the TTL later cannot silently extend tokens already in inboxes.
 */
export function createModerationToken(adminSessionSecret: string): string {
  const expiresAt = Date.now() + MODERATION_TOKEN_TTL_SECONDS * 1000;
  const payload = base64url(JSON.stringify({ exp: expiresAt }));
  return `${payload}.${sign(payload, adminSessionSecret)}`;
}

export function isValidModerationToken(
  token: string | undefined,
  adminSessionSecret: string,
): boolean {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expected = sign(payload, adminSessionSecret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Compare before parsing: an unsigned payload should never be JSON.parse'd.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof decoded?.exp === "number" && Date.now() < decoded.exp;
  } catch {
    return false;
  }
}
