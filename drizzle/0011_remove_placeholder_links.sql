-- Preserve the obvious model associations from pending reports that the old
-- classifier attached to the generic "Something" placeholder.
INSERT INTO "report_models" ("report_id", "model_id")
SELECT r."id", m."id"
FROM "reports" r
CROSS JOIN "models" m
WHERE r."source_url" = 'https://www.youtube.com/watch?v=_onfQRKB1JY&lc=UgyERmh44oFZWqgQRIJ4AaABAg'
  AND m."slug" = 'gemini-3-7-flash'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "report_models" ("report_id", "model_id")
SELECT r."id", m."id"
FROM "reports" r
CROSS JOIN "models" m
WHERE r."source_url" = 'https://www.youtube.com/watch?v=IqIW79W3H0A&lc=UgxbLAK8V12kPw7flBR4AaABAg'
  AND m."slug" = 'gemini-3-6-flash'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "report_models" ("report_id", "model_id")
SELECT r."id", m."id"
FROM "reports" r
CROSS JOIN "models" m
WHERE r."source_url" = 'https://www.youtube.com/watch?v=lPNgeaF2Nk4&lc=UgwWjxd_5m6wJFw3B1l4AaABAg'
  AND m."slug" IN ('gpt-6-sol', 'gpt-5-6-sol')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
DELETE FROM "report_models" rm
USING "models" m
WHERE rm."model_id" = m."id"
  AND m."slug" = 'something';
--> statement-breakpoint
DELETE FROM "models" WHERE "slug" = 'something';
