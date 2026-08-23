import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Bearer-token check for the machine-facing ingest routes.
 * Compared in constant time so a wrong token can't be discovered by timing.
 */
export function isAuthorizedIngest(request: Request): boolean {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const presented = Buffer.from(header.slice("Bearer ".length).trim());
  const expected = Buffer.from(env.ingestToken);

  if (presented.length !== expected.length) return false;
  return timingSafeEqual(presented, expected);
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
