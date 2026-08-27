CREATE TABLE "report_models" (
	"report_id" integer NOT NULL,
	"model_id" integer NOT NULL,
	CONSTRAINT "report_models_report_id_model_id_pk" PRIMARY KEY("report_id","model_id")
);
--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_model_id_models_id_fk";
--> statement-breakpoint
DROP INDEX "reports_model_status_idx";--> statement-breakpoint
ALTER TABLE "report_models" ADD CONSTRAINT "report_models_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_models" ADD CONSTRAINT "report_models_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_models_model_status_idx" ON "report_models" USING btree ("model_id");--> statement-breakpoint
INSERT INTO "report_models" ("report_id", "model_id") SELECT "id", "model_id" FROM "reports";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "model_id";