"use client";

import * as React from "react";
import { type Column } from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { ChevronDown, Search } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { format } from "date-fns";

interface ColumnFilterProps<TData, TValue> {
    column: Column<TData, TValue>;
}

export function ColumnFilter<TData, TValue>({ column }: ColumnFilterProps<TData, TValue>) {
    const [filterValue, setFilterValue] = React.useState<string[]>(
        (column.getFilterValue() as string[]) ?? []
    );
    const [searchValue, setSearchValue] = React.useState("");

    const isDateColumn = column.id === "entree" || column.id === "sortie";

    const uniqueValues = React.useMemo(() => {
        const values = new Set<string>();
        column.getFacetedRowModel().rows.forEach((row) => {
            const value = row.getValue(column.id);
            if (value !== null && value !== undefined) {
                // Format dates in French format
                if (isDateColumn && value instanceof Date) {
                    values.add(format(value, "dd/MM/yyyy HH:mm"));
                } else if (isDateColumn && typeof value === 'string') {
                    try {
                        values.add(format(new Date(value), "dd/MM/yyyy HH:mm"));
                    } catch {
                        values.add(String(value));
                    }
                } else {
                    values.add(String(value));
                }
            }
        });
        return Array.from(values).sort();
    }, [column, isDateColumn]);

    const filteredValues = React.useMemo(() => {
        if (!searchValue) return uniqueValues;
        return uniqueValues.filter((v) =>
            v.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [uniqueValues, searchValue]);

    const toggleValue = (value: string) => {
        const nextValue = filterValue.includes(value)
            ? filterValue.filter((v) => v !== value)
            : [...filterValue, value];
        setFilterValue(nextValue);
    };

    const selectAll = () => {
        if (filterValue.length === uniqueValues.length) {
            setFilterValue([]);
        } else {
            setFilterValue(uniqueValues);
        }
    };

    const applyFilter = () => {
        column.setFilterValue(filterValue.length === 0 ? undefined : filterValue);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-1">
                    <ChevronDown className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="dark w-64 p-2 bg-slate-950 text-white border-slate-800" align="start">
                <div className="flex items-center border rounded-md px-2 mb-2">
                    <Search className="h-4 w-4 text-muted-foreground mr-2" />
                    <Input
                        placeholder="Rechercher..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="border-0 focus-visible:ring-0 h-8 p-0"
                    />
                </div>

                <div className="flex items-center space-x-2 py-1 px-1 border-b mb-1">
                    <Checkbox
                        id={`all-${column.id}`}
                        checked={filterValue.length === uniqueValues.length && uniqueValues.length > 0}
                        onCheckedChange={selectAll}
                    />
                    <label
                        htmlFor={`all-${column.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                    >
                        (Sélectionner tout)
                    </label>
                </div>

                <div className="max-h-60 overflow-y-auto overflow-x-hidden py-1 space-y-1">
                    {filteredValues.map((value) => (
                        <div key={value} className="flex items-center space-x-2 px-1 hover:bg-slate-900 py-1 rounded">
                            <Checkbox
                                id={`val-${column.id}-${value}`}
                                checked={filterValue.includes(value)}
                                onCheckedChange={() => toggleValue(value)}
                            />
                            <label
                                htmlFor={`val-${column.id}-${value}`}
                                className="text-sm leading-none flex-1 truncate cursor-pointer"
                            >
                                {value}
                            </label>
                        </div>
                    ))}
                    {filteredValues.length === 0 && (
                        <div className="text-center py-2 text-sm text-muted-foreground">
                            Aucun résultat
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setFilterValue([]);
                            column.setFilterValue(undefined);
                        }}
                    >
                        Effacer
                    </Button>
                    <Button size="sm" onClick={applyFilter}>
                        OK
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
