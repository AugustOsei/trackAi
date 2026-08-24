import "server-only";

/**
 * Server-side environment access.
 *
 * Values are read lazily rather than validated at module load, because the
 * production build imports these modules while collecting page data — a
 * top-level throw would fail the build on a machine that legitimately has no
 * runtime secrets. Each accessor throws only when something actually needs
 * the value, with a message that names the variable and where to set it.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env.local for local development, or in the Vercel project settings for deployments.`,
    );
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get adminPasswordHash() {
    return required("ADMIN_PASSWORD_HASH");
  },
  get adminSessionSecret() {
    return required("ADMIN_SESSION_SECRET");
  },
  /** Shared bearer token that n8n presents to the ingest endpoints. */
  get ingestToken() {
    return required("INGEST_API_TOKEN");
  },
};

/**
 * Absolute origin used to build links that leave the app — currently the
 * signed review links in the daily digest email.
 *
 * Must be the real public origin, not a deployment URL: a link built from a
 * per-deployment hostname still works today but rots the moment that
 * deployment is superseded. Falls back to Vercel's production URL so a
 * preview deploy produces something usable rather than throwing.
 */
export function publicBaseUrl(): string {
  const explicit = process.env.PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  throw new Error(
    "Missing required environment variable PUBLIC_BASE_URL. " +
      "Set it to the site's public origin (e.g. https://trackai.theaugustdispatch.com) " +
      "in .env.local for local development, or in the Vercel project settings for deployments.",
  );
}

/** Non-throwing check used by the health endpoint. */
export function missingEnvVars(): string[] {
  return [
    "DATABASE_URL",
    "ADMIN_PASSWORD_HASH",
    "ADMIN_SESSION_SECRET",
    "INGEST_API_TOKEN",
    "PUBLIC_BASE_URL",
  ].filter((name) => !process.env[name]);
}
