-- These predictions passed without a release or provider announcement. Keep
-- tombstones so the rumor collector cannot recreate the same grey boats on
-- its next run. A verified release still clears its tombstone in the official
-- model ingest path.
INSERT INTO "suppressed_slugs" ("slug", "reason")
VALUES
  ('astra-minor', 'Predicted October 8 release passed without an official model release'),
  ('aeon', 'Predicted October 9 release passed without an official model release'),
  ('muse-realtime-avatar', 'Predicted October 12 release passed without an official model release')
ON CONFLICT ("slug") DO UPDATE SET "reason" = excluded."reason";
--> statement-breakpoint
DELETE FROM "models" m
WHERE m."slug" IN ('astra-minor', 'aeon', 'muse-realtime-avatar')
  AND m."status" = 'rumored'
  AND NOT EXISTS (
    SELECT 1 FROM "report_models" rm WHERE rm."model_id" = m."id"
  );
