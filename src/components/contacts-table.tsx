"use client";

import * as React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Plus, Search, X } from "lucide-react";
import { cn } from "~/lib/utils";

interface ContactsTableProps<TData extends { id: number; ordre: number }> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    onAdd: () => void;
    onReorder: (items: { id: number; ordre: number }[]) => void;
}

function SortableRow<TData extends { id: number; ordre: number }>({
    row,
}: {
    row: any;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } =
        useSortable({ id: row.original.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn("border-slate-800 text-white", isDragging && "z-50")}
        >
            {row.getVisibleCells().map((cell: any) => (
                <TableCell
                    key={cell.id}
                    className={cn(
                        "border border-slate-800 px-2 py-1 whitespace-normal break-words text-base",
                        cell.column.id === "actions" && "px-0"
                    )}
                    style={{
                        width: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                        minWidth: cell.column.getSize()
                    }}
                >
                    {flexRender(cell.column.columnDef.cell, {
                        ...cell.getContext(),
                        dragHandleProps: cell.column.id === "actions" ? {
                            ...attributes,
                            ...listeners,
                            ref: setActivatorNodeRef,
                        } : undefined,
                    })}
                </TableCell>
            ))}
        </TableRow>
    );
}

export function ContactsTable<TData extends { id: number; ordre: number }>({
    columns,
    data,
    onAdd,
    onReorder,
}: ContactsTableProps<TData>) {
    const [items, setItems] = React.useState(data);
    const [globalFilter, setGlobalFilter] = React.useState("");

    React.useEffect(() => {
        setItems(data);
    }, [data]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const table = useReactTable({
        data: items,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: "includesString",
        enableColumnResizing: false,
        columnResizeMode: "onChange",
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);

            // Update ordre values and send to server
            const reorderData = newItems.map((item, index) => ({
                id: item.id,
                ordre: index,
            }));
            onReorder(reorderData);
        }
    };

    const filteredRows = table.getFilteredRowModel().rows.length;
    const totalRows = items.length;
    const isFiltered = globalFilter !== "";

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-4">
                <Button onClick={onAdd} className="bg-[#00b3d5] hover:bg-[#0091ad] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                </Button>
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

            <div className="overflow-auto border border-slate-800 rounded-md bg-slate-950 custom-scrollbar" style={{ height: "calc(100vh - 200px)" }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    autoScroll={false}
                >
                    <Table className="border-collapse w-full relative caption-bottom text-base" style={{ fontFamily: "Calibri, sans-serif" }}>
                        <TableHeader className="sticky top-0 z-20 bg-slate-950">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-800">
                                    {headerGroup.headers.map((header) => {
                                        const isActionsColumn = header.id === "actions";
                                        return (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    "border border-slate-800 relative group px-2 py-2 min-h-11 select-none whitespace-normal break-words bg-[#00b3d5] text-white",
                                                    isActionsColumn && "p-0"
                                                )}
                                                style={{
                                                    width: header.getSize(),
                                                    maxWidth: header.getSize(),
                                                    minWidth: header.getSize()
                                                }}
                                            >
                                                {!isActionsColumn && (
                                                    <span>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </span>
                                                )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody className="border-slate-800">
                            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                {table.getRowModel().rows.map((row) => (
                                    <SortableRow key={row.original.id} row={row} />
                                ))}
                            </SortableContext>
                        </TableBody>
                    </Table>
                </DndContext>
            </div>
        </div>
    );
}
