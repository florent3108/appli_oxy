"use client";

import * as React from "react";
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    getFacetedRowModel,
    getFacetedUniqueValues,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import {
    Search,
    X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { ColumnFilter } from "./column-filter";
import { EditableCell } from "./editable-cell";
import { useTableSelection } from "./use-table-selection";

interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    onAddEmptyRow?: () => void;
    onAddEmptyRowBatch?: (count: number) => void;
    onUpdateCell: (rowId: number, columnId: string, value: any) => void;
    onUpdateBatch: (updates: { id: number;[key: string]: any }[]) => void;
    isEmptyRecord?: (record: TData) => boolean;
}

export function MaintenanceTable<TData extends { id: number; validationRdv?: string | null }>({
    columns,
    data,
    onAddEmptyRow,
    onAddEmptyRowBatch,
    onUpdateCell,
    onUpdateBatch,
    isEmptyRecord,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, _columnId, filterValue) => {
            // Always show empty rows, regardless of filter
            if (isEmptyRecord && isEmptyRecord(row.original)) {
                return true;
            }
            // For non-empty rows, apply normal filtering
            const search = filterValue.toLowerCase();
            return Object.values(row.original).some((value) =>
                String(value ?? "").toLowerCase().includes(search)
            );
        },
        filterFns: {
            auto: (row, columnId, filterValue) => {
                // Always show empty rows, regardless of column filter
                if (isEmptyRecord && isEmptyRecord(row.original)) {
                    return true;
                }
                // For non-empty rows, apply normal filtering
                const cellValue = row.getValue(columnId);

                // Handle array filter values (from column filters)
                if (Array.isArray(filterValue)) {
                    if (filterValue.length === 0) return true;

                    // Check if cell value matches any of the filter values
                    const cellStr = String(cellValue ?? "");
                    return filterValue.some(fv => cellStr.includes(fv));
                }

                // Handle string filter values
                const search = String(filterValue ?? "").toLowerCase();
                return String(cellValue ?? "").toLowerCase().includes(search);
            },
        },
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        meta: {
            updateCell: onUpdateCell,
            updateBatch: onUpdateBatch,
        },
    });

    const { rows } = table.getRowModel();
    const parentRef = React.useRef<HTMLDivElement>(null);

    // Initialize selection hook with table dimensions
    const maxCols = columns.length;
    const { range, onMouseDown, onMouseEnter, isSelected, isFilling, fillEnd, onFillHandleMouseDown, onFillHandleMouseEnter, getFillRange, clearFillEnd } = useTableSelection(rows.length, maxCols);

    // Track previous isFilling state to detect when filling ends
    const prevIsFillingRef = React.useRef(isFilling);

    React.useEffect(() => {
        // Detect when filling just ended (was filling, now not filling)
        if (prevIsFillingRef.current && !isFilling) {
            const fillRange = getFillRange();
            if (fillRange && fillRange.targetEnd.rowIdx > fillRange.sourceEnd.rowIdx) {
                // Perform the fill operation
                const updates: { id: number; [key: string]: any }[] = [];

                // Get source data from the selected range
                const sourceHeight = fillRange.sourceEnd.rowIdx - fillRange.sourceStart.rowIdx + 1;
                const sourceWidth = fillRange.sourceEnd.colIdx - fillRange.sourceStart.colIdx + 1;

                // For each target row
                for (let targetRowIdx = fillRange.sourceEnd.rowIdx + 1; targetRowIdx <= fillRange.targetEnd.rowIdx; targetRowIdx++) {
                    const targetRow = rows[targetRowIdx];
                    if (!targetRow) continue;

                    const rowUpdate: any = { id: targetRow.original.id };

                    // Calculate which source row to copy from (repeat pattern)
                    const sourceRowOffset = (targetRowIdx - fillRange.sourceStart.rowIdx) % sourceHeight;
                    const sourceRowIdx = fillRange.sourceStart.rowIdx + sourceRowOffset;
                    const sourceRow = rows[sourceRowIdx];

                    if (!sourceRow) continue;

                    // Copy each column in the range
                    for (let colOffset = 0; colOffset < sourceWidth; colOffset++) {
                        const colIdx = fillRange.sourceStart.colIdx + colOffset;
                        const sourceCell = sourceRow.getVisibleCells()[colIdx];
                        const targetCell = targetRow.getVisibleCells()[colIdx];

                        if (sourceCell && targetCell) {
                            const columnId = targetCell.column.id;
                            const value = sourceCell.getValue();
                            rowUpdate[columnId] = value;
                        }
                    }

                    updates.push(rowUpdate);
                }

                // Apply all updates at once
                if (updates.length > 0) {
                    onUpdateBatch(updates);
                }
            }

            // Clear the fill end state
            clearFillEnd();
        }

        prevIsFillingRef.current = isFilling;
    }, [isFilling, getFillRange, clearFillEnd, rows, onUpdateBatch]);

    // Calculate row counts (exclude empty rows from count)
    const totalRows = React.useMemo(() => {
        if (isEmptyRecord) {
            return data.filter(record => !isEmptyRecord(record)).length;
        }
        return data.length;
    }, [data, isEmptyRecord]);

    const filteredRows = React.useMemo(() => {
        if (isEmptyRecord) {
            return rows.filter(row => !isEmptyRecord(row.original)).length;
        }
        return rows.length;
    }, [rows, isEmptyRecord]);

    const isFiltered = React.useMemo(() => {
        return !!(columnFilters.length > 0 || globalFilter);
    }, [columnFilters, globalFilter]);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 52,
        overscan: 10,
    });

    const virtualRows = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
    const paddingBottom =
        virtualRows.length > 0
            ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
            : 0;

    const getRowColor = (status?: string | null) => {
        switch (status) {
            case "Validé PHP":
                return "bg-[#68d67d] text-black";
            case "Validé Pré-Op/Tactique":
                return "bg-[#68a4d8] text-black";
            case "En attente":
                return "bg-[#ffc000] text-black";
            case "Refusé":
                return "bg-[#da7c87] text-black";
            default:
                return "text-white";
        }
    };

    const handleCopy = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "c" && range) {
            e.preventDefault();
            let copyText = "";
            for (let r = range.start.rowIdx; r <= range.end.rowIdx; r++) {
                const rowData = rows[r]?.getVisibleCells().slice(range.start.colIdx, range.end.colIdx + 1);
                if (rowData) {
                    copyText += rowData.map((cell) => cell.getValue() ?? "").join("\t") + "\n";
                }
            }
            navigator.clipboard.writeText(copyText);
        }
    };

    const [pendingPaste, setPendingPaste] = React.useState<{
        pastedRows: string[][];
        range: { start: { rowIdx: number; colIdx: number }; end: { rowIdx: number; colIdx: number } };
    } | null>(null);

    // Effect to process pending paste after rows are added
    React.useEffect(() => {
        if (pendingPaste) {
            const { pastedRows, range: pasteRange } = pendingPaste;
            const updatesMap = new Map<number, { id: number;[key: string]: any }>();

            // Check if we have enough rows
            const totalRowsNeeded = pasteRange.start.rowIdx + pastedRows.length;
            if (rows.length < totalRowsNeeded) {
                // Not enough rows yet, wait for more to be created
                return;
            }

            // Check if all target rows have real IDs (not temporary)
            let hasTemporaryIds = false;
            for (let rIdx = 0; rIdx < pastedRows.length; rIdx++) {
                const rowIdx = pasteRange.start.rowIdx + rIdx;
                const targetRow = rows[rowIdx];
                if (targetRow && targetRow.original.id >= 1000000000) {
                    hasTemporaryIds = true;
                    break;
                }
            }

            // If there are still temporary IDs, wait for real ones
            if (hasTemporaryIds) {
                return;
            }

            // Process the paste
            pastedRows.forEach((pastedRow, rIdx) => {
                const rowIdx = pasteRange.start.rowIdx + rIdx;
                const targetRow = rows[rowIdx];
                if (targetRow) {
                    const rowId = targetRow.original.id;

                    // Get or create update object for this row
                    if (!updatesMap.has(rowId)) {
                        updatesMap.set(rowId, { id: rowId });
                    }
                    const rowUpdate = updatesMap.get(rowId)!;

                    pastedRow.forEach((value, cIdx) => {
                        const colIdx = pasteRange.start.colIdx + cIdx;
                        const targetCell = targetRow.getVisibleCells()[colIdx];
                        if (targetCell) {
                            // Convert empty strings to null for optional fields
                            const processedValue = value.trim() === "" ? null : value;
                            rowUpdate[targetCell.column.id] = processedValue;
                        }
                    });
                }
            });

            const updates = Array.from(updatesMap.values());
            if (updates.length > 0) {
                onUpdateBatch(updates);
            }

            setPendingPaste(null);
        }
    }, [rows, pendingPaste, onUpdateBatch]);

    const handlePaste = async (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "v" && range) {
            e.preventDefault();
            const text = await navigator.clipboard.readText();
            const pastedRows = text.split("\n").filter(r => r.trim() !== "").map(r => r.split("\t"));

            // Calculate how many rows we need
            const startRowIdx = range.start.rowIdx;
            const totalRowsNeeded = startRowIdx + pastedRows.length;
            const currentRowCount = rows.length;
            const missingRowCount = Math.max(0, totalRowsNeeded - currentRowCount);

            // If we need more rows, store the paste data and trigger row creation
            if (missingRowCount > 0) {
                setPendingPaste({ pastedRows, range });

                // Use batch creation for large pastes (more than 10 rows), otherwise create one by one
                if (missingRowCount > 10 && onAddEmptyRowBatch) {
                    onAddEmptyRowBatch(missingRowCount);
                } else if (onAddEmptyRow) {
                    // Trigger creation of missing rows one by one
                    for (let i = 0; i < missingRowCount; i++) {
                        onAddEmptyRow();
                    }
                }
                return;
            }

            // Process paste data (update existing rows)
            const updatesMap = new Map<number, { id: number;[key: string]: any }>();

            pastedRows.forEach((pastedRow, rIdx) => {
                const targetRowIdx = range.start.rowIdx + rIdx;
                const targetRow = rows[targetRowIdx];
                if (targetRow) {
                    const rowId = targetRow.original.id;

                    // Get or create update object for this row
                    if (!updatesMap.has(rowId)) {
                        updatesMap.set(rowId, { id: rowId });
                    }
                    const rowUpdate = updatesMap.get(rowId)!;

                    pastedRow.forEach((value, cIdx) => {
                        const targetColIdx = range.start.colIdx + cIdx;
                        const targetCell = targetRow.getVisibleCells()[targetColIdx];
                        if (targetCell) {
                            // Convert empty strings to null for optional fields
                            const processedValue = value.trim() === "" ? null : value;
                            rowUpdate[targetCell.column.id] = processedValue;
                        }
                    });
                }
            });

            const updates = Array.from(updatesMap.values());
            if (updates.length > 0) {
                onUpdateBatch(updates);
            }
        }
    };

    const handleDelete = (e: React.KeyboardEvent) => {
        if (e.key === "Delete" && range) {
            e.preventDefault();
            const updates: { id: number;[key: string]: any }[] = [];
            for (let r = range.start.rowIdx; r <= range.end.rowIdx; r++) {
                const row = rows[r];
                if (row) {
                    for (let c = range.start.colIdx; c <= range.end.colIdx; c++) {
                        const cell = row.getVisibleCells()[c];
                        if (cell) {
                            updates.push({ id: row.original.id, [cell.column.id]: "" });
                        }
                    }
                }
            }
            if (updates.length > 0) {
                onUpdateBatch(updates);
            }
        }
    };

    return (
        <div
            className="flex flex-col h-full space-y-4 outline-none"
            tabIndex={0}
            onKeyDown={(e) => {
                handleCopy(e);
                handlePaste(e);
                handleDelete(e);
            }}
        >
            <div className="flex justify-end items-center px-4">
                <div className="flex items-center gap-4">
                    <div className="text-slate-400 text-sm font-medium">
                        {isFiltered ? (
                            <span>{filteredRows} ligne{filteredRows > 1 ? 's' : ''} sur {totalRows}</span>
                        ) : (
                            <span>{totalRows} ligne{totalRows > 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <div className="relative w-54">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher..."
                            value={globalFilter ?? ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            onKeyDown={(e) => {
                                // Stop propagation to prevent parent handlers from interfering
                                e.stopPropagation();
                            }}
                            onPaste={(e) => {
                                // Stop propagation to allow paste in search bar
                                e.stopPropagation();
                            }}
                            className="pl-8 pr-8 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
                        />
                        {globalFilter && (
                            <button
                                onClick={() => setGlobalFilter("")}
                                className="absolute right-2 top-2.5 h-4 w-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div
                ref={parentRef}
                className="overflow-auto border border-slate-800 rounded-md bg-slate-950 custom-scrollbar"
                style={{ height: "calc(100vh - 200px)", fontFamily: "Calibri, sans-serif" }}
            >
                <table className="border-collapse w-full relative caption-bottom" style={{ fontFamily: "Calibri, sans-serif" }}>
                    <TableHeader className="sticky top-0 z-20 bg-slate-950">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-800">
                                {headerGroup.headers.map((header) => {
                                    const isStatusColumn = ["validationRdv", "commentaires"].includes(header.id);
                                    const isActionsColumn = header.id === "actions";
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                "border border-slate-800 relative group px-2 py-2 min-h-11 select-none whitespace-normal break-words",
                                                isStatusColumn ? "bg-[#c29762] text-black" : "bg-[#00b3d5] text-white",
                                                isActionsColumn && "border-none bg-transparent p-0"
                                            )}
                                            style={{ width: header.getSize() }}
                                        >
                                            {!isActionsColumn && (
                                                <div className="flex items-center justify-between">
                                                    <span>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </span>
                                                    <ColumnFilter column={header.column} />
                                                </div>
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="border-slate-800">
                        {paddingTop > 0 && (
                            <tr>
                                <td style={{ height: `${paddingTop}px` }} />
                            </tr>
                        )}
                        {virtualRows.map((virtualRow) => {
                            const row = rows[virtualRow.index]!;
                            const statusColor = getRowColor(row.original.validationRdv);

                            // Determine if this row is part of a group and its position within the group
                            const currentRow = row.original;

                            // Skip grouping logic for empty rows
                            const isCurrentRowEmpty = isEmptyRecord ? isEmptyRecord(currentRow) : false;

                            // Use the FULL filtered row model to access previous/next rows
                            // (rows array is virtualized and only contains visible rows)
                            const allFilteredRows = table.getFilteredRowModel().rows;
                            const actualRowIndex = virtualRow.index;
                            const prevRow = actualRowIndex > 0 ? allFilteredRows[actualRowIndex - 1]?.original : null;
                            const nextRow = actualRowIndex < allFilteredRows.length - 1 ? allFilteredRows[actualRowIndex + 1]?.original : null;

                            const isPrevRowEmpty = prevRow && isEmptyRecord ? isEmptyRecord(prevRow) : false;
                            const isNextRowEmpty = nextRow && isEmptyRecord ? isEmptyRecord(nextRow) : false;

                            // Check if current row should be grouped with previous row (both must be non-empty)
                            const curr = currentRow as Record<string, unknown>;
                            const prev = prevRow as Record<string, unknown> | null;
                            const next = nextRow as Record<string, unknown> | null;
                            const isSameGroupAsPrev = !!(
                                !isCurrentRowEmpty && !isPrevRowEmpty && prev &&
                                curr.engin === prev.engin &&
                                curr.site === prev.site &&
                                (curr.semaine === prev.semaine ||
                                 (curr.entree && prev.entree &&
                                  new Date(curr.entree as string).getTime() === new Date(prev.entree as string).getTime()))
                            );

                            // Check if current row should be grouped with next row (both must be non-empty)
                            const isSameGroupAsNext = !!(
                                !isCurrentRowEmpty && !isNextRowEmpty && next &&
                                curr.engin === next.engin &&
                                curr.site === next.site &&
                                (curr.semaine === next.semaine ||
                                 (curr.entree && next.entree &&
                                  new Date(curr.entree as string).getTime() === new Date(next.entree as string).getTime()))
                            );

                            const isGroupStart = !isSameGroupAsPrev && isSameGroupAsNext;
                            const isGroupEnd = isSameGroupAsPrev && !isSameGroupAsNext;
                            const isGroupMiddle = isSameGroupAsPrev && isSameGroupAsNext;

                            return (
                                <React.Fragment key={row.id}>
                                    {isGroupStart && (
                                        <tr style={{ height: '4px', border: 'none' }}>
                                            <td
                                                colSpan={row.getVisibleCells().length}
                                                style={{
                                                    padding: 0,
                                                    border: 'none',
                                                    height: '4px',
                                                    backgroundColor: '#020617'
                                                }}
                                            />
                                        </tr>
                                    )}
                                    <TableRow
                                        data-index={virtualRow.index}
                                        ref={virtualizer.measureElement}
                                        className={cn(
                                            "border-slate-800",
                                            statusColor
                                        )}
                                    >
                                    {row.getVisibleCells().map((cell, colIdx) => {
                                        const selected = isSelected(virtualRow.index, colIdx);

                                        // Check if we're in the fill area
                                        const isInFillArea = fillEnd && range &&
                                            virtualRow.index > range.end.rowIdx &&
                                            virtualRow.index <= fillEnd.rowIdx &&
                                            colIdx >= range.start.colIdx &&
                                            colIdx <= range.end.colIdx;

                                        let borderClasses = "";
                                        const isBottomRightCorner = range &&
                                            virtualRow.index === range.end.rowIdx &&
                                            colIdx === range.end.colIdx;

                                        // No borders needed - using spacing instead
                                        const groupBorderParts: string[] = [];

                                        if (selected && range) {
                                            // Check if cell is on the edge of selection
                                            const isTopEdge = virtualRow.index === range.start.rowIdx;
                                            const isBottomEdge = virtualRow.index === range.end.rowIdx;
                                            const isLeftEdge = colIdx === range.start.colIdx;
                                            const isRightEdge = colIdx === range.end.colIdx;

                                            // Only add border on the outer edges
                                            const borderParts = [];
                                            if (isTopEdge) borderParts.push("border-t-2 border-t-blue-500");
                                            if (isBottomEdge) borderParts.push("border-b-2 border-b-blue-500");
                                            if (isLeftEdge) borderParts.push("border-l-2 border-l-blue-500");
                                            if (isRightEdge) borderParts.push("border-r-2 border-r-blue-500");

                                            borderClasses = [...groupBorderParts, ...borderParts].join(" ");
                                        } else {
                                            borderClasses = groupBorderParts.join(" ");
                                        }

                                        if (isInFillArea) {
                                            const borderParts = [];
                                            if (colIdx === range.start.colIdx) borderParts.push("border-l-2 border-l-blue-400");
                                            if (colIdx === range.end.colIdx) borderParts.push("border-r-2 border-r-blue-400");
                                            if (virtualRow.index === fillEnd.rowIdx) borderParts.push("border-b-2 border-b-blue-400");
                                            borderClasses = [...groupBorderParts, ...borderParts].join(" ");
                                        }

                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(
                                                    "border border-slate-800 p-0 whitespace-normal break-words relative",
                                                    selected && "z-10 bg-blue-500/5",
                                                    isInFillArea && "bg-blue-400/10",
                                                    borderClasses
                                                )}
                                                style={{ width: cell.column.getSize() }}
                                                onMouseDown={() => onMouseDown(virtualRow.index, colIdx)}
                                                onMouseEnter={() => {
                                                    onMouseEnter(virtualRow.index, colIdx);
                                                    onFillHandleMouseEnter(virtualRow.index, colIdx);
                                                }}
                                            >
                                                <EditableCell cell={cell} />
                                                {isBottomRightCorner && (
                                                    <div
                                                        className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 cursor-crosshair z-20 hover:w-2.5 hover:h-2.5"
                                                        onMouseDown={onFillHandleMouseDown}
                                                        style={{ transform: 'translate(50%, 50%)' }}
                                                    />
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                                </React.Fragment>
                            );
                        })}
                        {paddingBottom > 0 && (
                            <tr>
                                <td style={{ height: `${paddingBottom}px` }} />
                            </tr>
                        )}
                    </TableBody>
                </table>
            </div>
        </div>
    );
}
