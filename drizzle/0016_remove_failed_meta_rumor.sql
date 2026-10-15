-- Muse Spark 1.4 was predicted for October 15, but Meta published no release
-- or announcement by that date. Suppress the slug so the rumor collector
-- cannot recreate the expired grey boat on its next run.
INSERT INTO "suppressed_slugs" ("slug", "reason")
VALUES (
  'muse-spark-1-4',
  'Predicted October 15 release passed without an official Meta model release'
)
ON CONFLICT ("slug") DO UPDATE SET "reason" = excluded."reason";
--> statement-breakpoint
DELETE FROM "models" m
WHERE m."slug" = 'muse-spark-1-4'
  AND m."status" = 'rumored'
  AND NOT EXISTS (
    SELECT 1 FROM "report_models" rm WHERE rm."model_id" = m."id"
  );
