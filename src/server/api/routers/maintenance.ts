import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { maintenanceRecords } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const maintenanceRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        try {
            return await ctx.db.query.maintenanceRecords.findMany();
        } catch (error) {
            console.error("Error in maintenance.getAll query:", error);
            throw error;
        }
    }),

    create: publicProcedure
        .input(
            z.object({
                flotte: z.string(),
                engin: z.string(),
                site: z.string().optional().nullable(),
                semaine: z.string().optional().nullable(),
                entree: z.date().optional().nullable(),
                sortie: z.date().optional().nullable(),
                codeOperation: z.string(),
                libelle: z.string().optional().nullable(),
                numDi: z.string().optional().nullable(),
                butee: z.string().optional().nullable(),
                validationRdv: z.string().optional().nullable(),
                commentaires: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (input.entree && input.sortie && input.sortie < input.entree) {
                throw new Error("La date de sortie ne peut pas être antérieure à la date d'entrée.");
            }
            return await ctx.db.insert(maintenanceRecords).values({
                ...input,
            }).returning();
        }),

    createBatch: publicProcedure
        .input(
            z.array(
                z.object({
                    flotte: z.string(),
                    engin: z.string(),
                    site: z.string().optional().nullable(),
                    semaine: z.string().optional().nullable(),
                    entree: z.date().optional().nullable(),
                    sortie: z.date().optional().nullable(),
                    codeOperation: z.string(),
                    libelle: z.string().optional().nullable(),
                    numDi: z.string().optional().nullable(),
                    butee: z.string().optional().nullable(),
                    validationRdv: z.string().optional().nullable(),
                    commentaires: z.string().optional().nullable(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            // Validate all records
            for (const record of input) {
                if (record.entree && record.sortie && record.sortie < record.entree) {
                    throw new Error("La date de sortie ne peut pas être antérieure à la date d'entrée.");
                }
            }
            // Insert all records in one query
            return await ctx.db.insert(maintenanceRecords).values(input).returning();
        }),

    update: publicProcedure
        .input(
            z.object({
                id: z.number(),
                flotte: z.string().optional(),
                engin: z.string().optional(),
                site: z.string().optional().nullable(),
                semaine: z.string().optional().nullable(),
                entree: z.preprocess(
                    (val) => val === "" || val === null || val === undefined ? null : val,
                    z.coerce.date().optional().nullable()
                ),
                sortie: z.preprocess(
                    (val) => val === "" || val === null || val === undefined ? null : val,
                    z.coerce.date().optional().nullable()
                ),
                codeOperation: z.string().optional(),
                libelle: z.string().optional().nullable(),
                numDi: z.string().optional().nullable(),
                butee: z.string().optional().nullable(),
                validationRdv: z.string().optional().nullable(),
                commentaires: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const { id, ...data } = input;

                if (data.entree !== undefined || data.sortie !== undefined) {
                    const existing = await ctx.db.query.maintenanceRecords.findFirst({
                        where: eq(maintenanceRecords.id, id),
                    });
                    const entree = data.entree !== undefined ? data.entree : (existing?.entree ?? null);
                    const sortie = data.sortie !== undefined ? data.sortie : (existing?.sortie ?? null);

                    if (entree && sortie && sortie < entree) {
                        throw new Error("La date de sortie ne peut pas être antérieure à la date d'entrée.");
                    }
                }

                return await ctx.db
                    .update(maintenanceRecords)
                    .set(data)
                    .where(eq(maintenanceRecords.id, id))
                    .returning();
            } catch (error) {
                console.error("Error in maintenance.update:", error);
                throw error;
            }
        }),

    updateBatch: publicProcedure
        .input(
            z.array(
                z.object({
                    id: z.number(),
                    flotte: z.string().optional(),
                    engin: z.string().optional(),
                    site: z.string().optional().nullable(),
                    semaine: z.string().optional().nullable(),
                    entree: z.preprocess(
                        (val) => val === "" || val === null || val === undefined ? null : val,
                        z.coerce.date().optional().nullable()
                    ),
                    sortie: z.preprocess(
                        (val) => val === "" || val === null || val === undefined ? null : val,
                        z.coerce.date().optional().nullable()
                    ),
                    codeOperation: z.string().optional(),
                    libelle: z.string().optional().nullable(),
                    numDi: z.string().optional().nullable(),
                    butee: z.string().optional().nullable(),
                    validationRdv: z.string().optional().nullable(),
                    commentaires: z.string().optional().nullable(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const results = [];
                for (const item of input) {
                    const { id, ...data } = item;
                    if (Object.keys(data).length === 0) {
                        continue;
                    }

                    if (data.entree !== undefined || data.sortie !== undefined) {
                        const existing = await ctx.db.query.maintenanceRecords.findFirst({
                            where: eq(maintenanceRecords.id, id),
                        });
                        const entree = data.entree !== undefined ? data.entree : (existing?.entree ?? null);
                        const sortie = data.sortie !== undefined ? data.sortie : (existing?.sortie ?? null);

                        if (entree && sortie && sortie < entree) {
                            throw new Error(`Ligne ${id}: La date de sortie est antérieure à l'entrée.`);
                        }
                    }

                    const res = await ctx.db
                        .update(maintenanceRecords)
                        .set(data)
                        .where(eq(maintenanceRecords.id, id))
                        .returning();
                    results.push(res[0]);
                }
                return results;
            } catch (error) {
                console.error("Error in maintenance.updateBatch:", error);
                throw error;
            }
        }),

    delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.db
                .delete(maintenanceRecords)
                .where(eq(maintenanceRecords.id, input.id))
                .returning();
        }),

    deleteBatch: publicProcedure
        .input(z.array(z.number()))
        .mutation(async ({ ctx, input }) => {
            const results = [];
            for (const id of input) {
                const res = await ctx.db
                    .delete(maintenanceRecords)
                    .where(eq(maintenanceRecords.id, id))
                    .returning();
                results.push(...res);
            }
            return results;
        }),

    duplicate: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const original = await ctx.db.query.maintenanceRecords.findFirst({
                where: eq(maintenanceRecords.id, input.id),
            });

            if (!original) {
                throw new Error("Record not found");
            }

            const { id, createdAt, updatedAt, ...rest } = original;
            return await ctx.db.insert(maintenanceRecords).values(rest).returning();
        }),
});
