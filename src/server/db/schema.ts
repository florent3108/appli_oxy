import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

export const maintenanceRecords = createTable(
  "table_php",
  {
    id: serial("id").primaryKey(),
    flotte: varchar("flotte", { length: 256 }).notNull().default(""),
    engin: varchar("engin", { length: 256 }).notNull().default(""),
    site: varchar("site", { length: 256 }),
    semaine: varchar("semaine", { length: 10 }),
    entree: timestamp("entree", { withTimezone: true }),
    sortie: timestamp("sortie", { withTimezone: true }),
    codeOperation: varchar("code_operation", { length: 256 }).notNull().default(""),
    libelle: text("libelle"),
    numDi: varchar("num_di", { length: 256 }),
    butee: varchar("butee", { length: 256 }),
    validationRdv: varchar("validation_rdv", { length: 50 }).default("En attente"),
    commentaires: text("commentaires"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [
    index("flotte_idx").on(table.flotte),
    index("engin_idx").on(table.engin),
  ]
);

export const contacts = createTable(
  "table_contacts",
  {
    id: serial("id").primaryKey(),
    ordre: integer("ordre").notNull().default(0),
    site: varchar("site", { length: 256 }).notNull().default(""),
    nom: varchar("nom", { length: 256 }).notNull().default(""),
    fonction: varchar("fonction", { length: 256 }),
    ligneInterne: varchar("ligne_interne", { length: 50 }),
    lignePortable: varchar("ligne_portable", { length: 50 }),
    observations: text("observations"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [
    index("contact_site_idx").on(table.site),
    index("contact_nom_idx").on(table.nom),
    index("contact_ordre_idx").on(table.ordre),
  ]
);
