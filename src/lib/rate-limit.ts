import "server-only";
import { createHash } from "node:crypto";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { submissionAttempts } from "@/db/schema";
import { env } from "@/lib/env";

const PRUNE_AFTER_HOURS = 24;

/** Public submit / subscribe throttle. */
const SUBMIT = { windowMinutes: 60, max: 5 };
/** Admin login: tighter window, counts failures only. */
const LOGIN = { windowMinutes: 15, max: 5 };

/**
 * Salted so the stored digest can't be reversed by hashing a candidate IP
 * range. Reuses the admin session secret rather than adding another var —
 * it's already required, already secret, and never leaves the server. The
 * `kind` prefix keeps the login and submit buckets from colliding in the
 * shared table.
 */
function bucketHash(kind: "submit" | "login", ip: string): string {
  return createHash("sha256").update(`${env.adminSessionSecret}:${kind}:${ip}`).digest("hex");
}

/**
 * Best-effort client IP. On Vercel, `x-real-ip` is set from the connection
 * and can't be spoofed by the client, so it's preferred; `x-forwarded-for`
 * is client-appendable and only a fallback. Absent both we fall back to a
 * single shared bucket, which throttles conservatively rather than failing
 * open.
 */
export function clientIpFrom(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}

export type RateLimitResult = { allowed: boolean; retryAfterMinutes: number };

async function countRecent(ipHash: string, windowMinutes: number): Promise<number> {
  const windowStart = new Date(Date.now() - windowMinutes * 60_000);
  const [{ value } = { value: 0 }] = await db
    .select({ value: count() })
    .from(submissionAttempts)
    .where(
      and(eq(submissionAttempts.ipHash, ipHash), gte(submissionAttempts.createdAt, windowStart)),
    );
  return value;
}

async function recordAttempt(ipHash: string): Promise<void> {
  await db.insert(submissionAttempts).values({ ipHash });

  // Opportunistic cleanup — cheap, indexed, and avoids needing a cron just
  // to keep a throwaway table from growing forever.
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - PRUNE_AFTER_HOURS * 3_600_000);
    await db.delete(submissionAttempts).where(lt(submissionAttempts.createdAt, cutoff));
  }
}

export async function checkAndRecordSubmission(ip: string): Promise<RateLimitResult> {
  const ipHash = bucketHash("submit", ip);
  if ((await countRecent(ipHash, SUBMIT.windowMinutes)) >= SUBMIT.max) {
    return { allowed: false, retryAfterMinutes: SUBMIT.windowMinutes };
  }
  await recordAttempt(ipHash);
  return { allowed: true, retryAfterMinutes: 0 };
}

/**
 * Whether this IP may try another admin login. Does not record anything —
 * call `recordLoginFailure` after a wrong password so a successful login
 * never counts against the budget and an attacker only ever locks their
 * own IP.
 */
export async function checkLoginRate(ip: string): Promise<RateLimitResult> {
  const recent = await countRecent(bucketHash("login", ip), LOGIN.windowMinutes);
  return recent >= LOGIN.max
    ? { allowed: false, retryAfterMinutes: LOGIN.windowMinutes }
    : { allowed: true, retryAfterMinutes: 0 };
}

export async function recordLoginFailure(ip: string): Promise<void> {
  await recordAttempt(bucketHash("login", ip));
}
