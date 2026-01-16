CREATE TABLE "PHP_maintenance_record" (
	"id" serial PRIMARY KEY NOT NULL,
	"flotte" varchar(256) NOT NULL,
	"engin" varchar(256) NOT NULL,
	"site" varchar(256),
	"semaine" integer,
	"entree" timestamp with time zone,
	"sortie" timestamp with time zone,
	"code_operation" varchar(256) NOT NULL,
	"libelle" text,
	"num_di" varchar(256),
	"butee" varchar(256),
	"validation_rdv" varchar(50) DEFAULT 'En attente',
	"commentaires" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "flotte_idx" ON "PHP_maintenance_record" USING btree ("flotte");--> statement-breakpoint
CREATE INDEX "engin_idx" ON "PHP_maintenance_record" USING btree ("engin");