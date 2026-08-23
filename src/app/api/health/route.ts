import { sql } from "drizzle-orm";
import { db } from "@/db";
import { missingEnvVars } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Deployment sanity check: is the app configured, and can it reach the
 * database? Reports which env vars are absent by name but never their
 * values, so it is safe to leave public.
 */
export async function GET() {
  const missing = missingEnvVars();

  let database: "ok" | "unreachable" = "unreachable";
  try {
    await db.execute(sql`select 1`);
    database = "ok";
  } catch (err) {
    console.error("[health] database unreachable", err);
  }

  const healthy = database === "ok" && missing.length === 0;

  return Response.json(
    { ok: healthy, database, missingEnv: missing },
    { status: healthy ? 200 : 503 },
  );
}
