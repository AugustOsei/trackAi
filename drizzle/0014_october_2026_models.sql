-- Release discovery first saw Haiku 5.5 as a rumor under a short slug. Keep
-- that row's id (and therefore any attached reports) when promoting it.
UPDATE "models"
SET "slug" = 'claude-haiku-5-5', "name" = 'Claude Haiku 5.5'
WHERE "slug" = 'haiku-5-5'
  AND NOT EXISTS (
    SELECT 1 FROM "models" canonical WHERE canonical."slug" = 'claude-haiku-5-5'
  );
--> statement-breakpoint
INSERT INTO "models" (
  "name", "slug", "provider", "status", "predicted_date", "actual_date",
  "provider_blurb", "announcement_url", "claimed_benchmarks",
  "price_per_mtok", "summary_is_auto_drafted", "claim_updated_at"
)
VALUES
  (
    'Qwen-Image-2.1 Pro', 'qwen-image-2-1-pro', 'Alibaba', 'released', NULL,
    '2026-10-02',
    'A unified text-to-image generation and editing model with native transparent-image support, multi-reference editing and local edit controls.',
    'https://docs.qwencloud.com/changelog/models', '[]'::jsonb, NULL, false, now()
  ),
  (
    'Gemini Nano Banana 2.1', 'gemini-nano-banana-2-1', 'Google DeepMind', 'released', NULL,
    '2026-10-06',
    'Google''s high-efficiency image generation and conversational editing model, with stronger prompt adherence, character consistency, text rendering and panoramic output.',
    'https://ai.google.dev/gemini-api/docs/changelog', '[]'::jsonb, NULL, false, now()
  ),
  (
    'Mistral Large 4', 'mistral-large-4', 'Mistral AI', 'released', NULL,
    '2026-10-06',
    'Mistral''s largest model to date, a natively multimodal mixture-of-experts model for coding, agentic workflows and enterprise work with a 1M-token context window.',
    'https://mistral.ai/news/mistral-large-4/', '[]'::jsonb, 4.180, false, now()
  ),
  (
    'Claude Haiku 5.5', 'claude-haiku-5-5', 'Anthropic', 'released', NULL,
    '2026-10-07',
    'Anthropic''s fastest small model, designed for high-volume, cost-sensitive work such as summaries, compaction, classification, subagents and latency-sensitive browser use.',
    'https://www.anthropic.com/claude-haiku-5-5',
    '[{"label":"OSWorld 2.1 (offline subset)","value":"72.4%"},{"label":"Humanity''s Last Exam (tools)","value":"57.4%"},{"label":"Terminal-Bench 4.0","value":"39.2%"},{"label":"FrontierCode 1.1 (Main)","value":"46.4%"}]'::jsonb,
    0.500, false, now()
  ),
  (
    'Qwen-Image-2.1 Turbo', 'qwen-image-2-1-turbo', 'Alibaba', 'released', NULL,
    '2026-10-09',
    'The cost- and speed-oriented Qwen-Image-2.1 tier, with unified generation and editing, native transparency, multiple references and local controls.',
    'https://docs.qwencloud.com/changelog/models', '[]'::jsonb, NULL, false, now()
  ),
  (
    'Gemini 4 Argon', 'gemini-4-argon', 'Google DeepMind', 'released', NULL,
    '2026-10-13',
    'Google''s frontier reasoning model for long-horizon work across coding, finance, legal, cybersecurity and science, with a unified 1M-token input-output limit.',
    'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/',
    '[]'::jsonb, 10.000, false, now()
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = excluded."name",
  "provider" = excluded."provider",
  "status" = excluded."status",
  "predicted_date" = excluded."predicted_date",
  "actual_date" = excluded."actual_date",
  "provider_blurb" = excluded."provider_blurb",
  "announcement_url" = excluded."announcement_url",
  "claimed_benchmarks" = excluded."claimed_benchmarks",
  "price_per_mtok" = excluded."price_per_mtok",
  "summary_is_auto_drafted" = false,
  "claim_updated_at" = excluded."claim_updated_at",
  "rumor_summary" = NULL,
  "rumor_source_url" = NULL,
  "rumor_confidence" = NULL,
  "rumor_evidence_type" = NULL;
--> statement-breakpoint
-- Defensive merge for databases where the canonical row already existed.
INSERT INTO "report_models" ("report_id", "model_id")
SELECT rm."report_id", canonical."id"
FROM "report_models" rm
JOIN "models" duplicate ON duplicate."id" = rm."model_id"
CROSS JOIN "models" canonical
WHERE duplicate."slug" = 'haiku-5-5'
  AND canonical."slug" = 'claude-haiku-5-5'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
DELETE FROM "report_models" rm
USING "models" duplicate
WHERE rm."model_id" = duplicate."id"
  AND duplicate."slug" = 'haiku-5-5';
--> statement-breakpoint
DELETE FROM "models" WHERE "slug" = 'haiku-5-5';
