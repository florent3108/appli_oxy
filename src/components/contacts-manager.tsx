"use client";

import * as React from "react";
import { api } from "~/trpc/react";
import { ContactsTable } from "./contacts-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { ContactForm } from "~/components/contacts-form";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";

type Contact = {
    id: number;
    ordre: number;
    site: string;
    nom: string;
    fonction: string | null;
    ligneInterne: string | null;
    lignePortable: string | null;
    observations: string | null;
    createdAt: Date;
    updatedAt: Date | null;
};

export function ContactsManager() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingContact, setEditingContact] = React.useState<Contact | null>(null);
    const [deleteConfirm, setDeleteConfirm] = React.useState<{ isOpen: boolean; contactId: number | null }>({
        isOpen: false,
        contactId: null,
    });

    const utils = api.useUtils();
    const { data: contacts = [], isLoading } = api.contacts.getAll.useQuery();

    const createMutation = api.contacts.create.useMutation({
        onSuccess: () => {
            void utils.contacts.getAll.invalidate();
            setIsDialogOpen(false);
            setEditingContact(null);
        },
        onError: (error) => {
            console.error("Error creating contact:", error);
            alert("Erreur lors de la création du contact: " + error.message);
        },
    });

    const updateMutation = api.contacts.update.useMutation({
        onSuccess: () => {
            void utils.contacts.getAll.invalidate();
            setIsDialogOpen(false);
            setEditingContact(null);
        },
        onError: (error) => {
            console.error("Error updating contact:", error);
            alert("Erreur lors de la modification du contact: " + error.message);
        },
    });

    const deleteMutation = api.contacts.delete.useMutation({
        onSuccess: () => void utils.contacts.getAll.invalidate(),
    });

    const reorderMutation = api.contacts.reorder.useMutation({
        onSuccess: () => void utils.contacts.getAll.invalidate(),
    });

    const columns: ColumnDef<Contact, any>[] = [
        { accessorKey: "site", header: "Site", size: 150 },
        { accessorKey: "nom", header: "Nom", size: 200 },
        { accessorKey: "fonction", header: "Fonction", size: 200 },
        { accessorKey: "ligneInterne", header: "Ligne Interne", size: 150 },
        { accessorKey: "lignePortable", header: "Ligne Portable", size: 150 },
        { accessorKey: "observations", header: "Observations", size: 300 },
        {
            id: "actions",
            header: () => null,
            size: 55,
            maxSize: 55,
            cell: ({ row, ...context }: any) => {
                const dragHandleProps = context.dragHandleProps || {};
                return (
                    <div className="flex items-center justify-between px-0.5">
                        <div {...dragHandleProps} className="p-0.5 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex gap-0.5 items-center">
                            <button
                                onClick={() => handleEdit(row.original)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors group"
                                title="Modifier"
                            >
                                <Pencil className="w-4 h-4 text-slate-400 group-hover:text-[#00b3d5]" />
                            </button>
                            <button
                                onClick={() => handleDelete(row.original.id)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors group"
                                title="Supprimer"
                            >
                                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                            </button>
                        </div>
                    </div>
                );
            },
        },
    ];

    const handleAdd = () => {
        setEditingContact(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteConfirm({ isOpen: true, contactId: id });
    };

    const confirmDelete = () => {
        if (deleteConfirm.contactId !== null) {
            deleteMutation.mutate({ id: deleteConfirm.contactId });
        }
    };

    const handleReorder = (items: { id: number; ordre: number }[]) => {
        reorderMutation.mutate(items);
    };

    const handleSubmit = (values: any) => {
        if (editingContact) {
            updateMutation.mutate({
                id: editingContact.id,
                site: values.site,
                nom: values.nom,
                fonction: values.fonction || null,
                ligneInterne: values.ligneInterne || null,
                lignePortable: values.lignePortable || null,
                observations: values.observations || null,
            });
        } else {
            createMutation.mutate({
                site: values.site,
                nom: values.nom,
                fonction: values.fonction || null,
                ligneInterne: values.ligneInterne || null,
                lignePortable: values.lignePortable || null,
                observations: values.observations || null,
            });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    return (
        <div className="h-[calc(100vh_-_52px)] bg-slate-950 flex flex-col">
            <div className="flex-1 px-8 pt-8 pb-4 bg-slate-950 flex flex-col">
                <div className="flex-1 bg-slate-950 rounded-lg shadow-2xl p-4 overflow-hidden border border-slate-800">
                    <ContactsTable
                        columns={columns}
                        data={contacts}
                        onAdd={handleAdd}
                        onReorder={handleReorder}
                    />
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingContact(null);
            }}>
                <DialogContent className="dark max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-950 text-white border-slate-800">
                    <DialogHeader>
                        <DialogTitle>{editingContact ? "Modifier le contact" : "Ajouter un nouveau contact"}</DialogTitle>
                        <DialogDescription>
                            {editingContact
                                ? "Modifiez les informations du contact ci-dessous."
                                : "Remplissez le formulaire ci-dessous pour ajouter un nouveau contact au répertoire."}
                        </DialogDescription>
                    </DialogHeader>
                    <ContactForm
                        initialValues={editingContact}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setIsDialogOpen(false);
                            setEditingContact(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, contactId: null })}
                onConfirm={confirmDelete}
                title="Supprimer le contact"
                description="Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />
        </div>
    );
}
