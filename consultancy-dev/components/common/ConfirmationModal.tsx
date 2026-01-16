'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    isLoading?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
}

export function ConfirmationModal({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    isLoading = false,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = 'default'
}: ConfirmationModalProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px] rounded-xl bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-bold text-slate-900">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-slate-500">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading} className="mt-0 h-9 text-xs">{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={`h-9 text-xs ${variant === 'destructive' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                        {isLoading ? 'Processing...' : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
