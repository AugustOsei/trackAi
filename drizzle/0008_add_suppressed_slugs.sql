CREATE TABLE "suppressed_slugs" (
	"slug" varchar(200) PRIMARY KEY NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
