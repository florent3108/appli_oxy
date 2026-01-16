"use client";

import * as React from "react";
import { type Cell, flexRender } from "@tanstack/react-table";
import { CustomDatePicker } from "~/components/ui/custom-date-picker";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { format, parseISO, isValid, getWeek, getYear, addDays } from "date-fns";

interface EditableCellProps<TData, TValue> {
    cell: Cell<TData, TValue>;
}

export function EditableCell<TData, TValue>({ cell }: EditableCellProps<TData, TValue>) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [isInlineEditing, setIsInlineEditing] = React.useState(false);
    const [value, setValue] = React.useState<TValue>(cell.getValue());
    const isDateField = cell.column.id === "entree" || cell.column.id === "sortie";
    const isValidationRdvField = cell.column.id === "validationRdv";
    const isFlotteField = cell.column.id === "flotte";
    const isBoldField = cell.column.id === "engin" || cell.column.id === "entree" || cell.column.id === "butee";

    // Fields that require double-click to edit
    const requiresDoubleClick = isDateField || isValidationRdvField;

    // @ts-ignore
    const enableEditing = cell.column.columnDef.enableEditing !== false;

    const onSave = (newValue?: TValue) => {
        const valToSave = newValue !== undefined ? newValue : value;
        setIsEditing(false);
        setIsInlineEditing(false);
        if (valToSave !== cell.getValue()) {
            // @ts-ignore
            cell.getContext().table.options.meta?.updateCell(
                // @ts-ignore
                cell.row.original.id,
                cell.column.id,
                valToSave
            );
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onSave();
        }
        if (e.key === "Escape") {
            setValue(cell.getValue());
            setIsEditing(false);
        }
    };

    React.useEffect(() => {
        setValue(cell.getValue());
    }, [cell.getValue()]);

    // Check if butee column contains "kms"
    const isButeeField = cell.column.id === "butee";
    const isKmsValue = isButeeField && typeof cell.getValue() === "string" && (cell.getValue() as string).toLowerCase().includes("kms");

    // Check if butee column contains a date that is before today
    const isPastDateValue = React.useMemo(() => {
        if (!isButeeField || typeof cell.getValue() !== "string") return false;
        const cellValue = cell.getValue() as string;

        // Check if the value matches DD/MM/YYYY format
        const dateMatch = cellValue.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!dateMatch) return false;

        try {
            const [, day, month, year] = dateMatch;
            const buteeDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to midnight for comparison

            return buteeDate < today;
        } catch {
            return false;
        }
    }, [isButeeField, cell.getValue()]);

    // Display value - for dates, format directly without useMemo to avoid stale references
    let displayValue: React.ReactNode;
    if (isDateField) {
        try {
            // @ts-ignore
            const dateVal = cell.row.original[cell.column.id];
            if (dateVal) {
                const date = dateVal instanceof Date ? dateVal : new Date(dateVal as string);
                displayValue = isValid(date) ? format(date, "dd/MM/yyyy HH:mm") : "";
            } else {
                displayValue = "";
            }
        } catch (e) {
            console.error(`[${cell.column.id}] Error formatting date:`, e);
            displayValue = "";
        }
    } else {
        displayValue = flexRender(cell.column.columnDef.cell, cell.getContext());
    }

    if (isEditing || isInlineEditing) {
        if (isDateField) {
            const isEntreeField = cell.column.id === "entree";

            return (
                <div className="h-full w-full relative">
                    {/* Render original value while picker is open */}
                    <div className="h-full w-full flex items-center px-2 opacity-50">
                        {value instanceof Date ? format(value, "dd/MM/yyyy HH:mm") : (value ? format(new Date(value as any), "dd/MM/yyyy HH:mm") : "")}
                    </div>
                    <CustomDatePicker
                        date={value instanceof Date ? value : (value ? new Date(value as any) : null)}
                        setDate={(newDate) => {
                            setValue(newDate as unknown as TValue);
                            setIsEditing(false);

                            // For "entree" column, update both entree and semaine in batch
                            if (isEntreeField) {
                                const weekNumber = getWeek(newDate, { weekStartsOn: 1, firstWeekContainsDate: 4 });
                                const yearOfDate = getYear(newDate);
                                const currentYear = getYear(new Date());

                                const semaineValue = yearOfDate > currentYear
                                    ? `${String(weekNumber).padStart(2, '0')}/${yearOfDate}`
                                    : String(weekNumber).padStart(2, '0');

                                // Update both columns in a single batch operation to avoid race conditions
                                // @ts-ignore
                                cell.getContext().table.options.meta?.updateBatch([
                                    {
                                        // @ts-ignore
                                        id: cell.row.original.id,
                                        entree: newDate,
                                        semaine: semaineValue,
                                    }
                                ]);
                            } else {
                                // For sortie, just update the single field
                                // @ts-ignore
                                cell.getContext().table.options.meta?.updateCell(
                                    // @ts-ignore
                                    cell.row.original.id,
                                    cell.column.id,
                                    newDate
                                );
                            }
                        }}
                        defaultTime={isEntreeField ? { hours: 7, minutes: 0 } : { hours: 9, minutes: 0 }}
                        autoOpen={true}
                        hideTrigger={true}
                        onClose={() => setIsEditing(false)}
                    />
                </div>
            );
        }

        if (isValidationRdvField) {
            return (
                <Select
                    value={(value as string) || "_EMPTY_"}
                    onValueChange={(newValue) => {
                        const finalValue = newValue === "_EMPTY_" ? null : newValue;
                        setValue(finalValue as unknown as TValue);
                        onSave(finalValue as unknown as TValue);
                    }}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setIsEditing(false);
                    }}
                >
                    <SelectTrigger className="h-full border-2 border-blue-500 rounded-none focus:ring-0 px-2 bg-slate-900 text-white">
                        <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent className="dark bg-slate-950 text-white border-slate-800">
                        <SelectItem value="_EMPTY_">Vide</SelectItem>
                        <SelectItem value="Validé PHP">Validé PHP</SelectItem>
                        <SelectItem value="Validé Pré-Op/Tactique">Validé Pré-Op/Tactique</SelectItem>
                        <SelectItem value="En attente">En attente</SelectItem>
                        <SelectItem value="Refusé">Refusé</SelectItem>
                    </SelectContent>
                </Select>
            );
        }

        // Inline editing mode (simple click) - transparent input without visible border
        if (isInlineEditing) {
            // Determine text color for input - use the same logic as display
            const inputTextColor = isPastDateValue ? "red" : (isKmsValue ? "#0070C0" : undefined);

            return (
                <Input
                    value={(value as string) ?? ""}
                    onChange={(e) => {
                        setValue(e.target.value as unknown as TValue);
                    }}
                    onBlur={() => onSave()}
                    onKeyDown={onKeyDown}
                    autoFocus
                    className="h-full border-0 rounded-none focus-visible:ring-0 px-2 bg-transparent outline-none"
                    style={inputTextColor ? { color: inputTextColor } : undefined}
                />
            );
        }

        // Regular editing mode (double click) - visible border
        return (
            <Input
                value={(value as string) ?? ""}
                onChange={(e) => {
                    setValue(e.target.value as unknown as TValue);
                }}
                onBlur={() => onSave()}
                onKeyDown={onKeyDown}
                autoFocus
                className="h-full border-2 border-blue-500 rounded-none focus-visible:ring-0 px-2 bg-slate-900 text-white"
            />
        );
    }

    // Reduce right padding for validationRdv column
    const paddingClass = isValidationRdvField ? "pl-2 pr-0" : "px-2";

    // Determine color: red for past dates, blue for kms values
    const textColor = isPastDateValue ? "red" : (isKmsValue ? "#0070C0" : undefined);

    return (
        <div
            onClick={() => {
                // Single click for fields that don't require double-click - use inline editing (no visible border)
                if (!requiresDoubleClick && enableEditing) {
                    setIsInlineEditing(true);
                }
            }}
            onDoubleClick={() => {
                // Double click for date and validation fields - use regular editing (visible border)
                if (requiresDoubleClick && enableEditing) {
                    setIsEditing(true);
                }
            }}
            className={`min-h-7 w-full ${paddingClass} py-0.5 flex items-center cursor-cell select-none break-words whitespace-normal text-sm ${isBoldField ? "font-bold" : ""}`}
            style={textColor ? { color: textColor } : undefined}
        >
            <span>{displayValue as React.ReactNode}</span>
        </div>
    );
}
