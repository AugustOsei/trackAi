CREATE TYPE "public"."model_status" AS ENUM('rumored', 'announced', 'released');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('hn', 'manual');--> statement-breakpoint
CREATE TYPE "public"."task_category" AS ENUM('coding', 'agentic', 'vision', 'writing', 'other');--> statement-breakpoint
CREATE TABLE "models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"provider" varchar(120) NOT NULL,
	"status" "model_status" DEFAULT 'announced' NOT NULL,
	"predicted_date" date,
	"actual_date" date,
	"provider_blurb" text,
	"intelligence_index" numeric(5, 1),
	"coding_index" numeric(5, 1),
	"price_per_mtok" numeric(10, 3),
	"speed_tps" numeric(8, 1),
	"benchmark_source" varchar(120),
	"benchmark_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"task_category" "task_category" NOT NULL,
	"takeaway" text NOT NULL,
	"source_url" text NOT NULL,
	"source_type" "source_type" DEFAULT 'manual' NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "submission_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "models_status_idx" ON "models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "models_provider_idx" ON "models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "reports_model_status_idx" ON "reports" USING btree ("model_id","status");--> statement-breakpoint
CREATE INDEX "reports_status_submitted_idx" ON "reports" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_source_url_idx" ON "reports" USING btree ("source_url");--> statement-breakpoint
CREATE INDEX "submission_attempts_ip_time_idx" ON "submission_attempts" USING btree ("ip_hash","created_at");