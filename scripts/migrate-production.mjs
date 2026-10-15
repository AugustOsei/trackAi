import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate] Skipping database migrations outside Vercel production.");
  process.exit(0);
}

console.log("[migrate] Applying production database migrations.");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for production migrations.");
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  await migrate(drizzle(client), {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
  console.log("[migrate] Production database migrations applied.");
} finally {
  await client.end();
}
