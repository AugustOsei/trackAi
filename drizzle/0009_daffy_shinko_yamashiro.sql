ALTER TABLE "models" ADD COLUMN "rumor_confidence" varchar(12);--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "rumor_evidence_type" varchar(40);--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "rumor_sources" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
UPDATE "models"
SET
  "rumor_confidence" = 'medium',
  "rumor_evidence_type" = 'credible_reporting',
  "rumor_sources" = jsonb_build_array(
    jsonb_build_object(
      'url', "rumor_source_url",
      'summary', "rumor_summary",
      'observedAt', coalesce("claim_updated_at", "created_at", now()),
      'predictedDate', "predicted_date",
      'confidence', 'medium',
      'evidenceType', 'credible_reporting'
    )
  )
WHERE "rumor_source_url" IS NOT NULL;
--> statement-breakpoint
DELETE FROM "suppressed_slugs" WHERE "slug" = 'gemini-3-8-flash';
--> statement-breakpoint
UPDATE "models"
SET "provider" = CASE
  WHEN lower("provider") IN ('google', 'google deepmind') THEN 'Google DeepMind'
  WHEN lower("provider") IN ('z.ai', 'z ai', 'zhipu', 'zhipu ai') THEN 'Z.AI'
  WHEN lower("provider") IN ('moonshot', 'moonshot ai') THEN 'Moonshot AI'
  ELSE "provider"
END;
--> statement-breakpoint
INSERT INTO "report_models" ("report_id", "model_id")
SELECT rm."report_id", canonical."id"
FROM "report_models" rm
JOIN "models" alias ON alias."id" = rm."model_id" AND alias."slug" = 'opus-6'
JOIN "models" canonical ON canonical."slug" = 'claude-opus-6'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
DELETE FROM "models"
WHERE "slug" = 'opus-6'
  AND EXISTS (SELECT 1 FROM "models" canonical WHERE canonical."slug" = 'claude-opus-6');
--> statement-breakpoint
UPDATE "models"
SET "predicted_date" = NULL
WHERE "slug" IN (
  'claude-opus-6',
  'composer-3',
  'grok-4-7',
  'grok-imagine-2-0',
  'kimi-k3-1',
  'qwen-4',
  'something'
);
--> statement-breakpoint
DELETE FROM "models" m
WHERE m."slug" IN ('something', 'gpt-image-2-5')
  AND m."status" = 'rumored'
  AND NOT EXISTS (
    SELECT 1 FROM "report_models" rm WHERE rm."model_id" = m."id"
  );
