import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Fail loudly when DATABASE_URL is absent.
 *
 * `postgres(undefined)` silently falls back to localhost:5432, so a missing
 * variable in production surfaces as `ECONNREFUSED 127.0.0.1:5432` on every
 * request — which reads like a database outage rather than a config mistake.
 * A TypeScript `!` assertion does nothing at runtime; this does.
 *
 * Deliberately not using `@/lib/env`: that module imports `server-only`, which
 * throws outside a Next server context and would break `npm run db:seed`.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Locally, add it to .env.local. On Vercel, set it " +
      "under Settings → Environment Variables (use the POOLED Neon endpoint, the " +
      "one containing '-pooler'), then redeploy — env var changes only apply to " +
      "new deployments.",
  );
}

if (process.env.NODE_ENV === "production" && !connectionString.includes("-pooler")) {
  // Not fatal: the direct endpoint works, it just exhausts under serverless
  // connection churn. Warn rather than block a deploy that is otherwise fine.
  console.warn(
    "[db] DATABASE_URL is not the pooled Neon endpoint. Serverless functions " +
      "open many short-lived connections; prefer the host containing '-pooler'.",
  );
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
