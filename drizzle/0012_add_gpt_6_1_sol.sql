INSERT INTO "models" (
  "name",
  "slug",
  "provider",
  "status",
  "actual_date",
  "provider_blurb",
  "announcement_url",
  "claimed_benchmarks",
  "price_per_mtok",
  "summary_is_auto_drafted",
  "claim_updated_at"
)
VALUES (
  'GPT-6.1 Sol',
  'gpt-6-1-sol',
  'OpenAI',
  'released',
  '2026-09-29',
  'A major upgrade to GPT-6 Sol that OpenAI says brings near-Astra performance to agentic coding, computer use and professional work at one-fifth of Astra''s standard token prices.',
  'https://openai.com/index/introducing-gpt-6-1-sol/',
  '[]'::jsonb,
  10.000,
  false,
  now()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = excluded."name",
  "provider" = excluded."provider",
  "status" = excluded."status",
  "predicted_date" = NULL,
  "actual_date" = excluded."actual_date",
  "provider_blurb" = excluded."provider_blurb",
  "announcement_url" = excluded."announcement_url",
  "price_per_mtok" = excluded."price_per_mtok",
  "summary_is_auto_drafted" = false,
  "claim_updated_at" = excluded."claim_updated_at",
  "rumor_summary" = NULL,
  "rumor_source_url" = NULL,
  "rumor_confidence" = NULL,
  "rumor_evidence_type" = NULL;
