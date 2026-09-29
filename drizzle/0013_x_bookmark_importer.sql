CREATE TABLE "x_bookmark_connections" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"x_user_id" varchar(32) NOT NULL,
	"username" varchar(100) NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"scopes" text NOT NULL,
	"folder_id" varchar(32),
	"folder_name" varchar(200),
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_imported_count" integer,
	"last_unmatched_count" integer,
	"last_error" text,
	CONSTRAINT "x_bookmark_connections_x_user_id_unique" UNIQUE("x_user_id")
);
--> statement-breakpoint
CREATE TABLE "x_bookmark_imports" (
	"tweet_id" varchar(32) PRIMARY KEY NOT NULL,
	"source_url" text NOT NULL,
	"author_username" varchar(100),
	"post_text" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"matched_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"report_id" integer,
	"reason" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "x_bookmark_imports" ADD CONSTRAINT "x_bookmark_imports_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "x_bookmark_imports_status_idx" ON "x_bookmark_imports" USING btree ("status","updated_at");
