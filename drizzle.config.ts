import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Drizzle runs outside Next.js, so it does not load .env.local on its own.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
