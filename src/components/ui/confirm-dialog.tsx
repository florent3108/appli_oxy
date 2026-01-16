"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "./button";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmation",
    description,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "danger",
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className={cn(
                        "fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-1 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl",
                        "bg-gradient-to-br from-[#001f3f] to-[#000a1a] border border-[#00b3d5]/30 shadow-[0_0_50px_-12px_rgba(0,179,213,0.3)] shadow-[#00b3d5]/20"
                    )}
                >
                    <div className="relative overflow-hidden rounded-[calc(1rem-1px)] bg-[#000a1a]/40 p-6 backdrop-blur-xl">
                        {/* Background Decorative Element */}
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#00b3d5]/10 blur-3xl" />

                        <div className="flex flex-col items-center text-center">
                            <div className={cn(
                                "mb-4 flex h-14 w-14 items-center justify-center rounded-full border shadow-inner",
                                variant === "danger" ? "border-red-500/50 bg-red-500/10 text-red-400 shadow-red-500/20" :
                                variant === "warning" ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400 shadow-yellow-500/20" :
                                    "border-[#00b3d5]/50 bg-[#00b3d5]/10 text-[#00b3d5] shadow-[#00b3d5]/20"
                            )}>
                                <AlertTriangle className="h-8 w-8" />
                            </div>

                            <DialogPrimitive.Title className="text-xl font-bold tracking-tight text-white mb-2">
                                {title}
                            </DialogPrimitive.Title>

                            <DialogPrimitive.Description className="text-blue-100/70 text-sm leading-relaxed mb-6">
                                {description}
                            </DialogPrimitive.Description>

                            <div className="flex w-full gap-3">
                                <Button
                                    onClick={onClose}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    className={cn(
                                        "flex-1 font-bold py-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                                        variant === "danger"
                                            ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                                            : "bg-[#00b3d5] hover:bg-[#00d4ff] text-[#000a1a] shadow-[0_0_20px_rgba(0,179,213,0.3)]"
                                    )}
                                >
                                    {confirmText}
                                </Button>
                            </div>
                        </div>

                        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Fermer</span>
                        </DialogPrimitive.Close>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
