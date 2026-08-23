import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "trackai_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionCookieValue(secret: string): string {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt, secret);
  return `${issuedAt}.${signature}`;
}

export function isValidSessionCookieValue(value: string | undefined, secret: string): boolean {
  if (!value) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;

  const expected = sign(issuedAt, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const age = (Date.now() - Number(issuedAt)) / 1000;
  return age >= 0 && age < MAX_AGE_SECONDS;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = MAX_AGE_SECONDS;
