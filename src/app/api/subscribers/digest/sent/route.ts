import { z } from "zod";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";

export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  modelIds: z.array(z.number().int().positive()).min(1).max(500),
});

/**
 * Marks models as alerted, called only after the digest workflow's Gmail
 * sends have actually succeeded — kept separate from the GET above so a
 * failed send doesn't silently lose those models from the next run.
 */
export async function POST(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues.slice(0, 10) },
      { status: 422 },
    );
  }

  await db
    .update(models)
    .set({ alertedAt: new Date() })
    .where(inArray(models.id, parsed.data.modelIds));

  return Response.json({ ok: true, marked: parsed.data.modelIds.length });
}
