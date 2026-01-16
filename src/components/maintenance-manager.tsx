"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MaintenanceTable } from "~/components/data-table/data-table";
import { api } from "~/trpc/react";
import { format, getWeek } from "date-fns";
import { CustomAlertDialog } from "~/components/ui/custom-alert-dialog";

type MaintenanceRecord = {
    id: number;
    flotte: string;
    engin: string;
    site: string | null;
    entree: Date | null;
    sortie: Date | null;
    codeOperation: string;
    libelle: string | null;
    numDi: string | null;
    butee: string | null;
    validationRdv: string | null;
    commentaires: string | null;
    semaine: string | null;
    createdAt: Date;
    updatedAt: Date | null;
};

export function MaintenanceManager() {
    const [alertConfig, setAlertConfig] = React.useState<{ isOpen: boolean; title?: string; message: string } | null>(null);

    const showAlert = (message: string, title?: string) => {
        setAlertConfig({ isOpen: true, message, title });
    };

    const utils = api.useUtils();
    const { data: records = [], isLoading } = api.maintenance.getAll.useQuery();

    const createMutation = api.maintenance.create.useMutation({
        onMutate: async (newRecord) => {
            // Cancel outgoing refetches
            await utils.maintenance.getAll.cancel();

            // Snapshot the previous value
            const previousRecords = utils.maintenance.getAll.getData();

            // Optimistically update with a temporary ID
            utils.maintenance.getAll.setData(undefined, (old) => {
                if (!old) return old;
                return [...old, {
                    id: Date.now(), // Temporary ID
                    flotte: newRecord.flotte,
                    engin: newRecord.engin,
                    site: newRecord.site ?? null,
                    semaine: newRecord.semaine ?? null,
                    entree: newRecord.entree ?? null,
                    sortie: newRecord.sortie ?? null,
                    codeOperation: newRecord.codeOperation,
                    libelle: newRecord.libelle ?? null,
                    numDi: newRecord.numDi ?? null,
                    butee: newRecord.butee ?? null,
                    validationRdv: newRecord.validationRdv ?? null,
                    commentaires: newRecord.commentaires ?? null,
                    createdAt: new Date(),
                    updatedAt: null,
                }];
            });

            return { previousRecords };
        },
        onSuccess: () => {
            void utils.maintenance.getAll.invalidate();
        },
        onError: (err, newRecord, context) => {
            // Rollback on error
            utils.maintenance.getAll.setData(undefined, context?.previousRecords);
            showAlert(err.message, "Erreur de création");
        }
    });

    // Track if we're currently creating/deleting empty rows to avoid infinite loops
    const isCreatingEmptyRows = React.useRef(false);
    const isBatchUpdating = React.useRef(false);

    // Ensure we always have exactly 5 empty rows for data entry
    React.useEffect(() => {
        // Debounce the cleanup to avoid excessive re-renders during large paste operations
        const timer = setTimeout(() => {
            if (!isLoading && records && !isCreatingEmptyRows.current && !isBatchUpdating.current) {
                // Use isEmptyRecord to check ALL fields, not just flotte/engin/codeOperation
                const emptyRows = records.filter(r => isEmptyRecord(r));

                const currentEmptyCount = emptyRows.length;

                // Create missing empty rows
                if (currentEmptyCount < 5) {
                    isCreatingEmptyRows.current = true;
                    const neededRows = 5 - currentEmptyCount;

                    for (let i = 0; i < neededRows; i++) {
                        createMutation.mutate({
                            flotte: "",
                            engin: "",
                            codeOperation: "",
                            site: null,
                            semaine: null,
                            entree: null,
                            sortie: null,
                            libelle: null,
                            numDi: null,
                            butee: null,
                            validationRdv: null,
                            commentaires: null,
                        }, {
                            onSettled: () => {
                                // Reset flag after last creation
                                setTimeout(() => {
                                    isCreatingEmptyRows.current = false;
                                }, 100);
                            }
                        });
                    }
                }
                // Delete excess empty rows (keep only 5)
                else if (currentEmptyCount > 5) {
                    isCreatingEmptyRows.current = true;

                    // Sort empty rows by createdAt (oldest first) to delete the oldest ones
                    const sortedEmptyRows = [...emptyRows].sort((a, b) =>
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );

                    // Only delete rows that are older than 5 seconds (avoid deleting rows just created during paste)
                    const now = Date.now();
                    const rowsOldEnough = sortedEmptyRows.filter(row =>
                        now - new Date(row.createdAt).getTime() > 5000
                    );

                    // Calculate how many to delete from the old rows
                    const excessCount = currentEmptyCount - 5;
                    const rowsToDelete = rowsOldEnough.slice(0, Math.min(excessCount, rowsOldEnough.length));

                    // Only proceed if we have rows to delete
                    if (rowsToDelete.length > 0) {
                        // Always use batch delete for better performance
                        const idsToDelete = rowsToDelete.map(row => row.id);
                        deleteBatchMutation.mutate(idsToDelete, {
                            onSettled: () => {
                                setTimeout(() => {
                                    isCreatingEmptyRows.current = false;
                                }, 100);
                            }
                        });
                    } else {
                        // No rows to delete, reset flag immediately
                        isCreatingEmptyRows.current = false;
                    }
                }
            }
        }, 1000); // Wait 1 second before cleaning up empty rows

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, records]);

    const updateMutation = api.maintenance.update.useMutation({
        onMutate: async (updatedRecord) => {
            // Cancel outgoing refetches
            await utils.maintenance.getAll.cancel();

            // Snapshot the previous value
            const previousRecords = utils.maintenance.getAll.getData();

            // Optimistically update
            utils.maintenance.getAll.setData(undefined, (old) => {
                if (!old) return old;
                return old.map((record) => {
                    if (record.id === updatedRecord.id) {
                        return {
                            ...record,
                            flotte: updatedRecord.flotte ?? record.flotte,
                            engin: updatedRecord.engin ?? record.engin,
                            site: updatedRecord.site !== undefined ? updatedRecord.site : record.site,
                            semaine: updatedRecord.semaine !== undefined ? updatedRecord.semaine : record.semaine,
                            entree: updatedRecord.entree !== undefined ? (updatedRecord.entree as Date | null) : record.entree,
                            sortie: updatedRecord.sortie !== undefined ? (updatedRecord.sortie as Date | null) : record.sortie,
                            codeOperation: updatedRecord.codeOperation ?? record.codeOperation,
                            libelle: updatedRecord.libelle !== undefined ? updatedRecord.libelle : record.libelle,
                            numDi: updatedRecord.numDi !== undefined ? updatedRecord.numDi : record.numDi,
                            butee: updatedRecord.butee !== undefined ? updatedRecord.butee : record.butee,
                            validationRdv: updatedRecord.validationRdv !== undefined ? updatedRecord.validationRdv : record.validationRdv,
                            commentaires: updatedRecord.commentaires !== undefined ? updatedRecord.commentaires : record.commentaires,
                            updatedAt: new Date(),
                        };
                    }
                    return record;
                });
            });

            return { previousRecords };
        },
        onSuccess: (data) => {
            // Don't invalidate - rely on optimistic update to avoid re-fetching and losing data
            // void utils.maintenance.getAll.invalidate();
        },
        onError: (err, updatedRecord, context) => {
            // Rollback on error
            utils.maintenance.getAll.setData(undefined, context?.previousRecords);
            showAlert(err.message, "Erreur de mise à jour");
        },
    });

    const deleteBatchMutation = api.maintenance.deleteBatch.useMutation({
        onSuccess: () => {
            void utils.maintenance.getAll.invalidate();
        },
        onError: (err) => {
            showAlert(err.message, "Erreur de suppression");
        },
    });

    const deleteMutation = api.maintenance.delete.useMutation({
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await utils.maintenance.getAll.cancel();

            // Snapshot the previous value
            const previousRecords = utils.maintenance.getAll.getData();

            // Optimistically remove the deleted record
            utils.maintenance.getAll.setData(undefined, (old) => {
                if (!old) return old;
                return old.filter((record) => record.id !== variables.id);
            });

            return { previousRecords };
        },
        onSuccess: () => {
            void utils.maintenance.getAll.invalidate();
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            utils.maintenance.getAll.setData(undefined, context?.previousRecords);
        },
    });

    const duplicateMutation = api.maintenance.duplicate.useMutation({
        onSuccess: () => void utils.maintenance.getAll.invalidate(),
    });

    const updateBatchMutation = api.maintenance.updateBatch.useMutation({
        onMutate: () => {
            isBatchUpdating.current = true;
        },
        onError: (err) => {
            showAlert(err.message, "Erreur de mise à jour");
            setTimeout(() => {
                isBatchUpdating.current = false;
            }, 1000);
        },
        onSettled: () => {
            void utils.maintenance.getAll.invalidate();
            setTimeout(() => {
                isBatchUpdating.current = false;
            }, 1000);
        },
    });

    const columns: ColumnDef<MaintenanceRecord, any>[] = [
        { accessorKey: "flotte", header: "Flotte", size: 65 },
        { accessorKey: "engin", header: "Engin", size: 70 },
        { accessorKey: "site", header: "Site", size: 65 },
        {
            accessorKey: "semaine",
            header: "Semaine",
            size: 40,
        },
        {
            accessorKey: "entree",
            header: "Entrée",
            size: 110,
        },
        {
            accessorKey: "sortie",
            header: "Sortie",
            size: 110,
        },
        { accessorKey: "codeOperation", header: "Code opération", size: 175 },
        { accessorKey: "libelle", header: "Libellé", size: 520 },
        { accessorKey: "numDi", header: "N° DI", size: 65 },
        { accessorKey: "butee", header: "Butée", size: 95 },
        { accessorKey: "validationRdv", header: "Validation RDV", size: 132 },
        { accessorKey: "commentaires", header: "Commentaires", size: 230 },
    ];

    const createBatchMutation = api.maintenance.createBatch.useMutation({
        onSuccess: () => {
            void utils.maintenance.getAll.invalidate();
        },
        onError: (err) => {
            showAlert(err.message, "Erreur de création");
        },
    });

    // Create empty row silently (without opening dialog) for paste operations
    const handleAddEmptyRow = () => {
        isBatchUpdating.current = true;
        createMutation.mutate({
            flotte: "", engin: "", codeOperation: "",
            site: null, semaine: null, entree: null, sortie: null,
            libelle: null, numDi: null, butee: null,
            validationRdv: null, commentaires: null,
        });
    };

    // Create multiple empty rows in batch for large paste operations
    const handleAddEmptyRowBatch = (count: number) => {
        isBatchUpdating.current = true;

        // Split into chunks of 100 to avoid overwhelming the database
        const chunkSize = 100;
        const chunks = Math.ceil(count / chunkSize);

        for (let i = 0; i < chunks; i++) {
            const remaining = count - (i * chunkSize);
            const currentChunkSize = Math.min(chunkSize, remaining);

            const emptyRows = Array.from({ length: currentChunkSize }, () => ({
                flotte: "", engin: "", codeOperation: "",
                site: null, semaine: null, entree: null, sortie: null,
                libelle: null, numDi: null, butee: null,
                validationRdv: null, commentaires: null,
            }));

            createBatchMutation.mutate(emptyRows);
        }
    };

    const isEmptyRecord = React.useCallback((record: any) => {
        const fieldsToCheck = ["flotte", "engin", "site", "entree", "sortie", "codeOperation", "libelle", "numDi", "butee", "validationRdv", "commentaires", "semaine"];
        return fieldsToCheck.every(field => {
            const val = record[field as keyof MaintenanceRecord];
            return val === null || val === "" || val === undefined;
        });
    }, []);

    // Clear localStorage on mount (remove old draft system)
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('maintenance-drafts');
        }
    }, []);

    const castedRecords = React.useMemo(() => {
        const mapped = records.map(r => ({
            ...r,
            entree: r.entree ? new Date(r.entree) : null,
            sortie: r.sortie ? new Date(r.sortie) : null,
            createdAt: new Date(r.createdAt),
            updatedAt: r.updatedAt ? new Date(r.updatedAt) : null,
        })) as MaintenanceRecord[];

        // Sort: filled rows first, then empty rows at the bottom
        // Within each group, sort by ID (ascending = oldest first)
        return mapped.sort((a, b) => {
            const aIsEmpty = isEmptyRecord(a);
            const bIsEmpty = isEmptyRecord(b);

            // If one is empty and other is not, non-empty goes first
            if (aIsEmpty && !bIsEmpty) return 1;
            if (!aIsEmpty && bIsEmpty) return -1;

            // Both empty or both filled: sort by ID ascending (oldest first)
            return a.id - b.id;
        });
    }, [records, isEmptyRecord]);

    const parseFrenchDate = (dateStr: string): Date | null => {
        // Handle French format: JJ/MM/AAAA HH:MM or DD/MM/YYYY HH:MM
        const frenchDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/;
        const match = dateStr.trim().match(frenchDateRegex);

        if (match) {
            const [, day, month, year, hours, minutes] = match;
            const date = new Date(
                parseInt(year!),
                parseInt(month!) - 1, // Month is 0-indexed
                parseInt(day!),
                parseInt(hours!),
                parseInt(minutes!)
            );
            return isNaN(date.getTime()) ? null : date;
        }

        // Try parsing as ISO date or other standard formats
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    };

    const handleUpdateCell = (id: number, columnId: string, value: any) => {
        let finalValue = value;
        const nullableFields = ["site", "libelle", "numDi", "butee", "validationRdv", "commentaires", "entree", "sortie", "semaine"];

        if (columnId === "entree" || columnId === "sortie") {
            if (value === "" || value === null || value === undefined) {
                finalValue = null;
            } else if (typeof value === 'string') {
                // Parse French date format from Excel paste
                const parsedDate = parseFrenchDate(value);
                if (!parsedDate) {
                    console.warn(`Invalid date value for ${columnId}:`, value);
                    return;
                }
                finalValue = parsedDate;
            } else if (value instanceof Date) {
                finalValue = value;
            } else {
                const d = new Date(value);
                if (isNaN(d.getTime())) {
                    console.warn(`Invalid date value for ${columnId}:`, value);
                    return;
                }
                finalValue = d;
            }
        } else if (columnId === "semaine") {
            // Keep as string to support formats like "15" or "15/2027"
            finalValue = value === "" || value === null || value === undefined ? null : String(value);
        } else if (value === "" && nullableFields.includes(columnId)) {
            finalValue = null;
        }

        if (columnId === "entree" || columnId === "sortie") {
            const currentRecord = castedRecords.find(r => r.id === id);
            const entree = columnId === "entree" ? finalValue : (currentRecord?.entree ? new Date(currentRecord.entree) : null);
            const sortie = columnId === "sortie" ? finalValue : (currentRecord?.sortie ? new Date(currentRecord.sortie) : null);

            if (entree && sortie && sortie < entree) {
                showAlert("La date de sortie ne peut pas être antérieure à la date d'entrée.", "Validation des dates");
                return;
            }
        }

        // Update existing record in database
        const currentRecord = castedRecords.find(r => r.id === id);
        if (!currentRecord) return;
        const updatedData = { ...currentRecord, [columnId]: finalValue };

        // Count how many empty rows we currently have
        const currentEmptyRows = castedRecords.filter(r => isEmptyRecord(r)).length;

        // Only delete if we have more than 5 empty rows
        if (isEmptyRecord(updatedData) && currentEmptyRows > 5) {
            deleteMutation.mutate({ id });
        } else {
            updateMutation.mutate({ id, [columnId]: finalValue });
        }
    };

    const handleUpdateBatch = (updates: any[]) => {
        isBatchUpdating.current = true;
        const rowsToUpdate: any[] = [];
        const rowsToDelete: number[] = [];

        // Filter out updates for rows with temporary IDs (created optimistically)
        // Temporary IDs are much larger than normal PostgreSQL sequence IDs
        const validUpdates = updates.filter(update => update.id < 1000000000);

        // Group updates by record ID
        const updatesByRow = validUpdates.reduce((acc: Record<number, any>, update) => {
            if (!acc[update.id]) acc[update.id] = {};
            const { id, ...data } = update;
            Object.assign(acc[update.id], data);
            return acc;
        }, {});

        for (const [idStr, rowUpdate] of Object.entries(updatesByRow)) {
            const id = parseInt(idStr);
            const currentRecord = castedRecords.find(r => r.id === id);
            if (!currentRecord) continue;

            const mergedRecord = { ...currentRecord } as any;
            const processedRowUpdate: any = {};

            for (const [columnId, rawValue] of Object.entries(rowUpdate as any)) {
                let finalValue = rawValue;
                const nullableFields = ["site", "libelle", "numDi", "butee", "validationRdv", "commentaires", "entree", "sortie", "semaine"];

                if (columnId === "semaine") {
                    // Keep as string to support formats like "15" or "15/2027"
                    finalValue = rawValue === "" || rawValue === null || rawValue === undefined ? null : String(rawValue);
                } else if (columnId === "entree" || columnId === "sortie") {
                    if (rawValue === "" || rawValue === null || rawValue === undefined) {
                        finalValue = null;
                    } else if (typeof rawValue === 'string') {
                        // Parse French date format from Excel paste
                        const parsedDate = parseFrenchDate(rawValue);
                        if (!parsedDate) {
                            console.warn(`Invalid date value for ${columnId}:`, rawValue);
                            continue;
                        }
                        finalValue = parsedDate;
                    } else if (rawValue instanceof Date) {
                        finalValue = rawValue;
                    } else if (typeof rawValue === 'string' || typeof rawValue === 'number') {
                        const d = new Date(rawValue);
                        if (!isNaN(d.getTime())) {
                            finalValue = d;
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    }
                } else if (rawValue === "" && nullableFields.includes(columnId!)) {
                    finalValue = null;
                }

                mergedRecord[columnId] = finalValue;
                processedRowUpdate[columnId] = finalValue;
            }

            // Date validation
            if (mergedRecord.entree && mergedRecord.sortie && mergedRecord.sortie < mergedRecord.entree) {
                showAlert(`Erreur ligne ${id}: La date de sortie ne peut pas être antérieure à la date d'entrée.`, "Validation des dates");
                return;
            }

            if (isEmptyRecord(mergedRecord)) {
                // Add to delete list (will be filtered later based on empty row count)
                rowsToDelete.push(id);
            } else {
                rowsToUpdate.push({ id, ...processedRowUpdate });
            }
        }

        // Count current empty rows
        const currentEmptyRows = castedRecords.filter(r => isEmptyRecord(r)).length;

        // Only delete empty rows if we have more than 5
        const rowsToActuallyDelete = currentEmptyRows > 5
            ? rowsToDelete
            : [];

        // For rows that shouldn't be deleted, convert to updates
        const rowsToKeepAsEmpty = rowsToDelete.filter(id => !rowsToActuallyDelete.includes(id));
        rowsToKeepAsEmpty.forEach(id => {
            if (!rowsToUpdate.find(r => r.id === id)) {
                const update = updatesByRow[id];
                if (update && Object.keys(update).length > 0) {
                    rowsToUpdate.push({ id, ...update });
                }
            }
        });

        // Execute mutations
        if (rowsToActuallyDelete.length > 0) {
            rowsToActuallyDelete.forEach(id => deleteMutation.mutate({ id }));
        }
        if (rowsToUpdate.length > 0) {
            updateBatchMutation.mutate(rowsToUpdate);
        }

        // Reset flag if no mutations were triggered
        if (rowsToActuallyDelete.length === 0 && rowsToUpdate.length === 0) {
            setTimeout(() => { isBatchUpdating.current = false; }, 500);
        }
    };

    return (
        <div className="h-[calc(100vh_-_52px)] bg-slate-950 flex flex-col">
            <div className="flex-1 px-8 pt-8 pb-4 bg-slate-950 flex flex-col">

                <div className="flex-1 bg-slate-950 rounded-lg shadow-2xl p-4 overflow-hidden border border-slate-800">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">Chargement...</div>
                    ) : (
                        <MaintenanceTable
                            columns={columns as any}
                            data={castedRecords}
                            onAddEmptyRow={handleAddEmptyRow}
                            onAddEmptyRowBatch={handleAddEmptyRowBatch}
                            onUpdateCell={handleUpdateCell}
                            onUpdateBatch={handleUpdateBatch}
                            isEmptyRecord={isEmptyRecord}
                        />
                    )}
                </div>

                <CustomAlertDialog
                    isOpen={!!alertConfig?.isOpen}
                    onClose={() => setAlertConfig(null)}
                    title={alertConfig?.title}
                    description={alertConfig?.message ?? ""}
                />
            </div>
        </div>
    );
}
