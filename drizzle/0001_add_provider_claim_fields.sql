ALTER TABLE "models" ADD COLUMN "announcement_url" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "claimed_benchmarks" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "summary_is_auto_drafted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "claim_updated_at" timestamp with time zone;