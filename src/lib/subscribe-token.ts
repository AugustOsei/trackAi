import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed tokens for the subscription lifecycle: confirming a new signup, and
 * unsubscribing from an existing one.
 *
 * Both are HMACs over a payload, keyed off ADMIN_SESSION_SECRET the same way
 * moderation links are — but through their own domain separator, so a
 * subscribe-confirm token, an unsubscribe token, and a moderation token are
 * three unrelated signatures even though they share a root secret. None can
 * be replayed as either of the others.
 */
const CONFIRM_KEY_DOMAIN = "trackai:subscribe-confirm:v1";
const UNSUBSCRIBE_KEY_DOMAIN = "trackai:subscribe-unsubscribe:v1";

/** Long enough that someone who signs up Friday can still confirm Monday. */
export const CONFIRM_TOKEN_TTL_SECONDS = 60 * 60 * 72; // 72 hours

function signingKey(secret: string, domain: string): Buffer {
  return createHmac("sha256", secret).update(domain).digest();
}

function sign(payload: string, secret: string, domain: string): string {
  return createHmac("sha256", signingKey(secret, domain)).update(payload).digest("hex");
}

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function verify(
  token: string | undefined,
  secret: string,
  domain: string,
): Record<string, unknown> | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expected = sign(payload, secret, domain);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/** Expires — a confirmation link left unclicked shouldn't work forever. */
export function createConfirmToken(subscriberId: number, secret: string): string {
  const expiresAt = Date.now() + CONFIRM_TOKEN_TTL_SECONDS * 1000;
  const payload = base64url(JSON.stringify({ id: subscriberId, exp: expiresAt }));
  return `${payload}.${sign(payload, secret, CONFIRM_KEY_DOMAIN)}`;
}

export function verifyConfirmToken(token: string | undefined, secret: string): number | null {
  const decoded = verify(token, secret, CONFIRM_KEY_DOMAIN);
  if (!decoded) return null;
  const { id, exp } = decoded;
  if (typeof id !== "number" || typeof exp !== "number") return null;
  if (Date.now() >= exp) return null;
  return id;
}

/**
 * Deliberately never expires. An unsubscribe link is a promise that clicking
 * it always works — CAN-SPAM requires it stay a single step, indefinitely,
 * not a link that quietly stops working after a few days like the review or
 * confirm links do.
 */
export function createUnsubscribeToken(subscriberId: number, secret: string): string {
  const payload = base64url(JSON.stringify({ id: subscriberId }));
  return `${payload}.${sign(payload, secret, UNSUBSCRIBE_KEY_DOMAIN)}`;
}

export function verifyUnsubscribeToken(token: string | undefined, secret: string): number | null {
  const decoded = verify(token, secret, UNSUBSCRIBE_KEY_DOMAIN);
  if (!decoded) return null;
  const { id } = decoded;
  return typeof id === "number" ? id : null;
}
