'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const paymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    paymentDate: z.string().min(1, 'Payment date is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    purpose: z.string().optional(),
    referenceNumber: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    studentName: string;
    isLoading?: boolean;
}

export function PaymentModal({ open, onClose, onSubmit, studentName, isLoading = false }: PaymentModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
        },
    });

    const paymentMethod = watch('paymentMethod');

    const handleFormSubmit = async (data: PaymentFormData) => {
        await onSubmit({
            studentName,
            amount: data.amount,
            date: data.paymentDate,
            method: data.paymentMethod,
            type: data.purpose || 'Payment',
            referenceNumber: data.referenceNumber,
        });
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                    <DialogDescription>
                        Record a new payment for {studentName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="Enter amount"
                            {...register('amount', { valueAsNumber: true })}
                        />
                        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentDate">Payment Date *</Label>
                        <Input
                            id="paymentDate"
                            type="date"
                            {...register('paymentDate')}
                        />
                        {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method *</Label>
                        <Select onValueChange={(val) => setValue('paymentMethod', val)} value={paymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
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
                        {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose / Description</Label>
                        <textarea
                            id="purpose"
                            placeholder="Enter purpose of payment"
                            rows={2}
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            {...register('purpose')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="referenceNumber">Reference Number</Label>
                        <Input
                            id="referenceNumber"
                            placeholder="Transaction/Receipt number"
                            {...register('referenceNumber')}
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Payment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
