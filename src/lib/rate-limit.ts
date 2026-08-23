import "server-only";
import { createHash } from "node:crypto";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { submissionAttempts } from "@/db/schema";
import { env } from "@/lib/env";

const WINDOW_MINUTES = 60;
const MAX_PER_WINDOW = 5;
const PRUNE_AFTER_HOURS = 24;

/**
 * Salted so the stored digest can't be reversed by hashing a candidate IP
 * range. Reuses the admin session secret rather than adding another var —
 * it's already required, already secret, and never leaves the server.
 */
function hashIp(ip: string): string {
  return createHash("sha256").update(`${env.adminSessionSecret}:${ip}`).digest("hex");
}

/**
 * Best-effort client IP. Vercel sets x-forwarded-for; the left-most entry is
 * the original client. Absent a header we fall back to a single shared
 * bucket, which throttles conservatively rather than failing open.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimitResult = { allowed: boolean; retryAfterMinutes: number };

export async function checkAndRecordSubmission(ip: string): Promise<RateLimitResult> {
  const ipHash = hashIp(ip);
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000);

  const [{ value: recent } = { value: 0 }] = await db
    .select({ value: count() })
    .from(submissionAttempts)
    .where(
      and(eq(submissionAttempts.ipHash, ipHash), gte(submissionAttempts.createdAt, windowStart)),
    );

  if (recent >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfterMinutes: WINDOW_MINUTES };
  }

  await db.insert(submissionAttempts).values({ ipHash });

  // Opportunistic cleanup — cheap, indexed, and avoids needing a cron just
  // to keep a throwaway table from growing forever.
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - PRUNE_AFTER_HOURS * 3_600_000);
    await db.delete(submissionAttempts).where(lt(submissionAttempts.createdAt, cutoff));
  }

  return { allowed: true, retryAfterMinutes: 0 };
}
