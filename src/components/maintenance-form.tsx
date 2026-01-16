"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getWeek } from "date-fns";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { CustomDatePicker } from "~/components/ui/custom-date-picker";
import { useEffect } from "react";

const formSchema = z.object({
    id: z.number().optional(),
    flotte: z.string().min(1, "Flotte est obligatoire"),
    engin: z.string().min(1, "Engin est obligatoire"),
    site: z.string().nullable().optional(),
    semaine: z.number().optional(),
    entree: z.date({
        required_error: "Date d'entrée est obligatoire",
    }).nullable().optional(),
    sortie: z.date({
        required_error: "Date de sortie est obligatoire",
    }).nullable().optional(),
    codeOperation: z.string().min(1, "Code opération est obligatoire"),
    libelle: z.string().nullable().optional(),
    numDi: z.string().nullable().optional(),
    butee: z.string().nullable().optional(),
    validationRdv: z.string().nullable().optional().default("En attente"),
    commentaires: z.string().nullable().optional(),
}).refine((data) => {
    if (data.entree && data.sortie) {
        return data.sortie > data.entree;
    }
    return true;
}, {
    message: "La date de sortie ne peut pas être antérieure à la date d'entrée",
    path: ["sortie"],
});

type MaintenanceFormValues = z.infer<typeof formSchema>;

interface MaintenanceFormProps {
    initialValues?: any;
    onSubmit: (values: MaintenanceFormValues) => void;
    onCancel: () => void;
}

export function MaintenanceForm({
    initialValues,
    onSubmit,
    onCancel,
}: MaintenanceFormProps) {
    const form = useForm<MaintenanceFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            flotte: "",
            engin: "",
            site: "",
            codeOperation: "",
            libelle: "",
            numDi: "",
            butee: "",
            validationRdv: "En attente",
            commentaires: "",
            ...initialValues,
            // Ensure dates are actual Date objects or undefined
            entree: initialValues?.entree ? new Date(initialValues.entree) : undefined,
            sortie: initialValues?.sortie ? new Date(initialValues.sortie) : undefined,
        },
    });

    const entree = form.watch("entree");

    useEffect(() => {
        if (entree) {
            form.setValue("semaine", getWeek(entree));
        }
    }, [entree, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="flotte"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Flotte *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="N° Flotte"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            field.onChange(val);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="engin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Engin *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Identifiant Engin" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="site"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Site</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nom du site" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="semaine"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Semaine</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="entree"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Entrée *</FormLabel>
                                <FormControl>
                                    <CustomDatePicker
                                        date={field.value}
                                        setDate={field.onChange}
                                        defaultTime={{ hours: 9, minutes: 0 }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sortie"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sortie *</FormLabel>
                                <FormControl>
                                    <CustomDatePicker
                                        date={field.value}
                                        setDate={field.onChange}
                                        defaultTime={{ hours: 17, minutes: 0 }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="codeOperation"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Code opération *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Code OP" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="libelle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Libellé</FormLabel>
                                <FormControl>
                                    <Input placeholder="Description" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="numDi"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>N° DI</FormLabel>
                                <FormControl>
                                    <Input placeholder="Numéro ID" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="butee"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Butée</FormLabel>
                                <FormControl>
                                    <Input placeholder="Km / Date / Heures" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="validationRdv"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Validation RDV</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? "En attente"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choisir un statut" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Accepté">Accepté</SelectItem>
                                        <SelectItem value="En attente">En attente</SelectItem>
                                        <SelectItem value="Refusé">Refusé</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="commentaires"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Commentaires</FormLabel>
                            <FormControl>
                                <Input placeholder="Annotations..." {...field} value={field.value ?? ""} />
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
