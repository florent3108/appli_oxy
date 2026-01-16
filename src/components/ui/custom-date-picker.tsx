"use client";

import * as React from "react";
import { format, getWeek, setHours, setMinutes, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";

interface CustomDatePickerProps {
    date?: Date | null;
    setDate: (date: Date) => void;
    placeholder?: string;
    defaultTime?: { hours: number; minutes: number };
    autoOpen?: boolean;
    hideTrigger?: boolean;
    onClose?: () => void;
}

export function CustomDatePicker({
    date,
    setDate,
    placeholder = "Sélectionner une date",
    defaultTime = { hours: 9, minutes: 0 },
    autoOpen = false,
    hideTrigger = false,
    onClose,
}: CustomDatePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
        date ?? undefined
    );
    const [month, setMonth] = React.useState<Date>(date ?? new Date());
    const [open, setOpen] = React.useState(autoOpen);

    React.useEffect(() => {
        if (autoOpen) {
            setOpen(true);
        }
    }, [autoOpen]);

    // Update month if date prop changes from external source
    React.useEffect(() => {
        if (date) {
            const hasChanged = !selectedDate || date.getTime() !== selectedDate.getTime();
            if (hasChanged) {
                setMonth(date);
                setSelectedDate(date);
            }
        }
    }, [date]);

    // Initialize with default time if no date selected
    React.useEffect(() => {
        if (!selectedDate && open) {
            const tomorrow = addDays(new Date(), 1);
            const initialDate = setHours(setMinutes(tomorrow, defaultTime.minutes), defaultTime.hours);
            setSelectedDate(initialDate);
            setMonth(initialDate);
        }
    }, [open, defaultTime]); // Removed selectedDate dependency to avoid infinite loop or unnecessary resets

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(":").map(Number);
        if (selectedDate && hours !== undefined && minutes !== undefined) {
            setSelectedDate(setMinutes(setHours(selectedDate, hours), minutes));
        }
    };

    const confirmDate = () => {
        if (selectedDate) {
            setDate(selectedDate);
        }
        setOpen(false);
        onClose?.();
    };

    return (
        <Popover
            open={open}
            onOpenChange={(newOpen) => {
                setOpen(newOpen);
                if (!newOpen) onClose?.();
            }}
        >
            <PopoverTrigger asChild>
                {!hideTrigger ? (
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd/MM/yyyy HH:mm") : <span>{placeholder}</span>}
                    </Button>
                ) : (
                    <div className="absolute inset-0 invisible pointer-events-none" />
                )}
            </PopoverTrigger>
            <PopoverContent className="dark w-auto p-0 bg-slate-950 text-white border-slate-800" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(newDate) => {
                        if (newDate) {
                            // Preserve the default time when selecting a new day
                            const dateWithTime = setHours(setMinutes(newDate, defaultTime.minutes), defaultTime.hours);
                            setSelectedDate(dateWithTime);
                        } else {
                            setSelectedDate(newDate);
                        }
                    }}
                    month={month}
                    onMonthChange={setMonth}
                    initialFocus
                    locale={fr}
                    showWeekNumber
                />
                <div className="p-3 border-t border-slate-800 flex justify-between items-center bg-slate-950">
                    <div className="flex items-center gap-2 pl-[24px]">
                        <Clock className="h-4 w-4 text-[#00b3d5]" />
                        <Input
                            type="time"
                            className="h-8 w-[100px] bg-slate-800 border-slate-700 text-white focus:ring-[#00b3d5]"
                            value={selectedDate ? format(selectedDate, "HH:mm") : ""}
                            onChange={handleTimeChange}
                        />
                    </div>
                    <Button size="sm" onClick={confirmDate} className="bg-[#00b3d5] hover:bg-[#0091ad] text-white font-medium">
                        OK
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
