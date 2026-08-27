/**
 * Upsert the released seed models into a live database via the
 * /api/ingest/models endpoint. Unlike `db:seed`, this touches nothing but
 * the `models` table — reports, rumored rows, and claim-workflow enrichment
 * are all left alone (the endpoint upserts on `slug` and never changes an
 * existing row's `status`).
 *
 * Usage (from the repo root):
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/sync-models.ts [BASE_URL]
 *
 * BASE_URL defaults to PUBLIC_BASE_URL, then the production origin. Needs
 * INGEST_API_TOKEN in the environment (it's in .env.local).
 */
import { SEED } from "../src/db/seed-data";

async function main() {
  const base =
    process.argv[2] ||
    process.env.PUBLIC_BASE_URL ||
    "https://trackai.theaugustdispatch.com";
  const token = process.env.INGEST_API_TOKEN;

  if (!token) {
    console.error(
      "INGEST_API_TOKEN is not set. Run with: node --env-file=.env.local node_modules/.bin/tsx scripts/sync-models.ts",
    );
    process.exit(1);
  }

  const models = SEED.filter((m) => m.status === "released").map((m) => ({
    name: m.name,
    slug: m.slug,
    provider: m.provider,
    status: "released" as const,
    actualDate: m.actualDate ?? undefined,
    providerBlurb: m.providerBlurb ?? undefined,
    pricePerMtok: m.pricePerMtok != null ? Number(m.pricePerMtok) : undefined,
    announcementUrl: m.announcementUrl ?? undefined,
    claimedBenchmarks:
      Array.isArray(m.claimedBenchmarks) && m.claimedBenchmarks.length
        ? m.claimedBenchmarks
        : undefined,
  }));

  console.log(`Upserting ${models.length} released models → ${base}/api/ingest/models`);

  const res = await fetch(`${base}/api/ingest/models`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ models }),
  });

  const body = await res.json().catch(() => ({}));
  console.log(res.status, JSON.stringify(body, null, 2));
  process.exit(res.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
