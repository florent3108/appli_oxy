import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { contacts } from "~/server/db/schema";
import { eq, asc, desc, sql } from "drizzle-orm";

export const contactsRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        try {
            return await ctx.db.query.contacts.findMany({
                orderBy: [asc(contacts.ordre)],
            });
        } catch (error) {
            console.error("Error in contacts.getAll query:", error);
            throw error;
        }
    }),

    create: publicProcedure
        .input(
            z.object({
                site: z.string(),
                nom: z.string(),
                fonction: z.string().optional().nullable(),
                ligneInterne: z.string().optional().nullable(),
                lignePortable: z.string().optional().nullable(),
                observations: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Get the max ordre value and add 1
            const maxOrdre = await ctx.db.query.contacts.findMany({
                orderBy: [desc(contacts.ordre)],
                limit: 1,
                columns: { ordre: true },
            });
            const newOrdre = maxOrdre.length > 0 ? (maxOrdre[0]?.ordre ?? 0) + 1 : 1;

            return await ctx.db.insert(contacts).values({
                ...input,
                ordre: newOrdre,
            }).returning();
        }),

    update: publicProcedure
        .input(
            z.object({
                id: z.number(),
                site: z.string().optional(),
                nom: z.string().optional(),
                fonction: z.string().optional().nullable(),
                ligneInterne: z.string().optional().nullable(),
                lignePortable: z.string().optional().nullable(),
                observations: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return await ctx.db
                .update(contacts)
                .set(data)
                .where(eq(contacts.id, id))
                .returning();
        }),

    updateBatch: publicProcedure
        .input(
            z.array(
                z.object({
                    id: z.number(),
                    site: z.string().optional(),
                    nom: z.string().optional(),
                    fonction: z.string().optional().nullable(),
                    ligneInterne: z.string().optional().nullable(),
                    lignePortable: z.string().optional().nullable(),
                    observations: z.string().optional().nullable(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const updatePromises = input.map(({ id, ...data }) =>
                ctx.db
                    .update(contacts)
                    .set(data)
                    .where(eq(contacts.id, id))
                    .returning()
            );
            return await Promise.all(updatePromises);
        }),

    delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.db
                .delete(contacts)
                .where(eq(contacts.id, input.id))
                .returning();
        }),

    deleteBatch: publicProcedure
        .input(z.array(z.number()))
        .mutation(async ({ ctx, input }) => {
            const deletePromises = input.map((id) =>
                ctx.db.delete(contacts).where(eq(contacts.id, id)).returning()
            );
            return await Promise.all(deletePromises);
        }),

    reorder: publicProcedure
        .input(
            z.array(
                z.object({
                    id: z.number(),
                    ordre: z.number(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const updatePromises = input.map(({ id, ordre }) =>
                ctx.db
                    .update(contacts)
                    .set({ ordre })
                    .where(eq(contacts.id, id))
                    .returning()
            );
            return await Promise.all(updatePromises);
        }),
});
