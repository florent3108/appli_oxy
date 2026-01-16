"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

const formSchema = z.object({
    id: z.number().optional(),
    site: z.string().min(1, "Site est obligatoire"),
    nom: z.string().min(1, "Nom est obligatoire"),
    fonction: z.string().nullable().optional(),
    ligneInterne: z.string().nullable().optional(),
    lignePortable: z.string().nullable().optional(),
    observations: z.string().nullable().optional(),
});

type ContactFormValues = z.infer<typeof formSchema>;

interface ContactFormProps {
    initialValues?: any;
    onSubmit: (values: ContactFormValues) => void;
    onCancel: () => void;
}

export function ContactForm({
    initialValues,
    onSubmit,
    onCancel,
}: ContactFormProps) {
    const form = useForm<ContactFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            site: "",
            nom: "",
            fonction: "",
            ligneInterne: "",
            lignePortable: "",
            observations: "",
            ...initialValues,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="site"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Site *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nom du site" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nom complet" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fonction"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fonction</FormLabel>
                                <FormControl>
                                    <Input placeholder="Poste occupé" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="ligneInterne"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ligne Interne</FormLabel>
                                <FormControl>
                                    <Input placeholder="Numéro interne" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lignePortable"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ligne Portable</FormLabel>
                                <FormControl>
                                    <Input placeholder="Numéro portable" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observations</FormLabel>
                            <FormControl>
                                <Input placeholder="Notes..." {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Annuler
                    </Button>
                    <Button type="submit">
                        Valider
                    </Button>
                </div>
            </form>
        </Form>
    );
}
