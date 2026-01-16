'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const refundSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    reason: z.string().min(10, 'Please provide at least 10 characters explaining the reason'),
    refundMethod: z.string().min(1, 'Refund method is required'),
    refundDate: z.string().min(1, 'Refund date is required'),
});

type RefundFormData = z.infer<typeof refundSchema>;

interface RefundModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    payment: {
        id: number;
        amount: number;
        date: string;
        method: string;
        studentName: string;
    };
    isLoading?: boolean;
}

export function RefundModal({ open, onClose, onSubmit, payment, isLoading = false }: RefundModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<RefundFormData>({
        resolver: zodResolver(refundSchema),
        defaultValues: {
            amount: payment.amount,
            refundMethod: payment.method,
            refundDate: new Date().toISOString().split('T')[0],
        },
    });

    const refundMethod = watch('refundMethod');
    const amount = watch('amount');

    const handleFormSubmit = async (data: RefundFormData) => {
        await onSubmit({
            paymentId: payment.id,
            amount: data.amount,
            reason: data.reason,
            refundMethod: data.refundMethod,
            refundDate: data.refundDate,
            studentName: payment.studentName,
        });
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Request Refund</DialogTitle>
                    <DialogDescription>
                        Request a refund for payment of ₹{payment.amount.toLocaleString()}
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                    <h4 className="text-sm font-semibold mb-2">Payment Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-slate-500">Student:</div>
                        <div className="font-medium">{payment.studentName}</div>
                        <div className="text-slate-500">Original Amount:</div>
                        <div className="font-medium">₹{payment.amount.toLocaleString()}</div>
                        <div className="text-slate-500">Payment Method:</div>
                        <div className="font-medium">{payment.method}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Refund Amount (₹) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="Enter refund amount"
                                {...register('amount', { valueAsNumber: true })}
                            />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="refundDate">Refund Date *</Label>
                            <Input
                                id="refundDate"
                                type="date"
                                {...register('refundDate')}
                            />
                            {errors.refundDate && <p className="text-sm text-red-500">{errors.refundDate.message}</p>}
                        </div>
                    </div>
                    {amount > payment.amount && (
                        <p className="text-sm text-orange-500">Refund amount cannot exceed original payment amount</p>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="refundMethod">Refund Method *</Label>
                        <Select onValueChange={(val) => setValue('refundMethod', val)} value={refundMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select refund method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.refundMethod && <p className="text-sm text-red-500">{errors.refundMethod.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Refund *</Label>
                        <textarea
                            id="reason"
                            placeholder="Explain why this refund is being requested..."
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            {...register('reason')}
                        />
                        {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || amount > payment.amount}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Request Refund
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
