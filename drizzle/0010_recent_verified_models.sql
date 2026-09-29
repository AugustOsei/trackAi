INSERT INTO "suppressed_slugs" ("slug", "reason")
VALUES
  ('something', 'Generic OpenAI DevDay placeholder with no named model or provider announcement'),
  ('gpt-image-2-5', 'Superseded placeholder; the released tiers are Flare and Sunburst')
ON CONFLICT ("slug") DO UPDATE SET "reason" = excluded."reason";
--> statement-breakpoint
DELETE FROM "models" m
WHERE m."slug" IN ('something', 'gpt-image-2-5')
  AND m."status" = 'rumored'
  AND NOT EXISTS (
    SELECT 1 FROM "report_models" rm WHERE rm."model_id" = m."id"
  );
--> statement-breakpoint
INSERT INTO "models" (
  "name",
  "slug",
  "provider",
  "status",
  "predicted_date",
  "actual_date",
  "provider_blurb",
  "announcement_url",
  "claimed_benchmarks",
  "price_per_mtok",
  "summary_is_auto_drafted",
  "claim_updated_at"
)
VALUES
  (
    'MiMo V2.6 Pro',
    'mimo-v2-6-pro',
    'Xiaomi',
    'released',
    NULL,
    '2026-09-21',
    'The larger MiMo V2.6 checkpoint, combining text, image, video and audio input with a 1M-token context window for long-running coding and agent work.',
    'https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL',
    '[]'::jsonb,
    NULL,
    false,
    now()
  ),
  (
    'MiMo V2.6 Flash',
    'mimo-v2-6-flash',
    'Xiaomi',
    'released',
    NULL,
    '2026-09-21',
    'The efficiency-balanced MiMo V2.6 checkpoint, a 311B open-weight omni-modal model trained across coding, agentic, visual and cybersecurity tasks.',
    'https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Flash-RL',
    '[]'::jsonb,
    NULL,
    false,
    now()
  ),
  (
    'Grok 4.7',
    'grok-4-7',
    'xAI',
    'released',
    '2026-09-25',
    '2026-09-21',
    'xAI''s frontier model for coding, agentic tasks and knowledge work, with stronger long-running task performance and self-verification.',
    'https://x.ai/news/grok-4-7',
    '[]'::jsonb,
    6.000,
    false,
    now()
  ),
  (
    'Claude Opus 5.5',
    'claude-opus-5-5',
    'Anthropic',
    'released',
    NULL,
    '2026-09-22',
    'Anthropic''s leading model for agentic coding, computer use and knowledge work, with lower costs and faster generation than Opus 5.',
    'https://www.anthropic.com/claude-opus-5-5',
    '[]'::jsonb,
    20.000,
    false,
    now()
  ),
  (
    'GPT-6 Sol',
    'gpt-6-sol',
    'OpenAI',
    'released',
    NULL,
    '2026-09-22',
    'OpenAI''s reasoning model for complex coding and agentic workflows, with text and image input through the Responses and Chat Completions APIs.',
    'https://developers.openai.com/api/docs/changelog',
    '[]'::jsonb,
    10.000,
    false,
    now()
  ),
  (
    'GPT-6 Luna',
    'gpt-6-luna',
    'OpenAI',
    'released',
    NULL,
    '2026-09-22',
    'OpenAI''s efficient reasoning model for focused, high-volume workloads, with text and image input through the Responses and Chat Completions APIs.',
    'https://developers.openai.com/api/docs/changelog',
    '[]'::jsonb,
    0.500,
    false,
    now()
  ),
  (
    'Ember-1',
    'ember-1',
    'Fireworks AI',
    'released',
    NULL,
    '2026-09-23',
    'A specialized reasoning model based on Kimi K3 that Fireworks says preserves comparable quality while using roughly 40% fewer output tokens.',
    'https://fireworks.ai/blog/ember-1',
    '[]'::jsonb,
    15.000,
    false,
    now()
  ),
  (
    'Perceptron Mk1.5',
    'perceptron-mk1-5',
    'Perceptron',
    'released',
    NULL,
    '2026-09-25',
    'Perceptron''s public model for embodied agents, adding native audio, video tracking, web search, sub-agent calls and more complex visual reasoning.',
    'https://www.perceptron.inc/blog/introducing-perceptron-mk1-5',
    '[]'::jsonb,
    NULL,
    false,
    now()
  ),
  (
    'Claude Sonnet 5.5',
    'claude-sonnet-5-5',
    'Anthropic',
    'released',
    NULL,
    '2026-09-28',
    'A faster, lower-cost complement to Opus 5.5 for everyday tasks, bug fixes and polished documents, slides and spreadsheets.',
    'https://www.anthropic.com/claude-sonnet-5-5',
    '[{"label":"Terminal-Bench 4.0","value":"70.6%"},{"label":"FrontierCode 1.1 (Max)","value":"46.2%"},{"label":"CursorBench 4.0","value":"55.5%"},{"label":"Humanity''s Last Exam (tools)","value":"64.5%"}]'::jsonb,
    10.000,
    false,
    now()
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
