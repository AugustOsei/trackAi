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

/** Non-throwing check used by the health endpoint. */
export function missingEnvVars(): string[] {
  return [
    "DATABASE_URL",
    "ADMIN_PASSWORD_HASH",
    "ADMIN_SESSION_SECRET",
    "INGEST_API_TOKEN",
  ].filter((name) => !process.env[name]);
}
