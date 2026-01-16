CREATE TABLE "PHP_contact" (
	"id" serial PRIMARY KEY NOT NULL,
	"site" varchar(256) DEFAULT '' NOT NULL,
	"nom" varchar(256) DEFAULT '' NOT NULL,
	"fonction" varchar(256),
	"ligne_interne" varchar(50),
	"ligne_portable" varchar(50),
	"observations" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "contact_site_idx" ON "PHP_contact" USING btree ("site");--> statement-breakpoint
CREATE INDEX "contact_nom_idx" ON "PHP_contact" USING btree ("nom");