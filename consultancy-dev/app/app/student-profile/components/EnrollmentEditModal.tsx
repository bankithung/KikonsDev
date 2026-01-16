'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { Enrollment } from '@/lib/types';
import { X, Loader2 } from 'lucide-react';

const editSchema = z.object({
    programName: z.string().min(1, "Program Name is required"),
    university: z.string().min(1, "University is required"),
    startDate: z.string().min(1, "Start Date is required"),
    durationMonths: z.coerce.number().min(1, "Duration is required"),

    // Fees
    serviceCharge: z.coerce.number().min(0),
    schoolFees: z.coerce.number().min(0),
    hostelFees: z.coerce.number().min(0),

    paymentType: z.enum(['Full', 'Installment']),

    // Loan
    loanRequired: z.boolean().default(false),
    loanAmount: z.coerce.number().optional(),

    // Status
    status: z.enum(['Active', 'Completed', 'Dropped']),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EnrollmentEditModalProps {
    open: boolean;
    onClose: () => void;
    initialData: Enrollment;
    onSuccess: () => void;
}

export function EnrollmentEditModal({ open, onClose, initialData, onSuccess }: EnrollmentEditModalProps) {
    const queryClient = useQueryClient();

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty }
    } = useForm<EditFormValues>({
        // @ts-ignore
        resolver: zodResolver(editSchema),
        defaultValues: {
            // Will be reset in useEffect
            programName: '',
            university: '',
            startDate: '',
            durationMonths: 12,
            serviceCharge: 0,
            schoolFees: 0,
            hostelFees: 0,
            paymentType: 'Full',
            loanRequired: false,
            loanAmount: 0,
            status: 'Active'
        }
    });

    useEffect(() => {
        if (open && initialData) {
            reset({
                programName: initialData.programName,
                university: initialData.university || '',
                startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
                durationMonths: initialData.durationMonths || 12,
                serviceCharge: initialData.serviceCharge || 0,
                schoolFees: initialData.schoolFees || 0,
                hostelFees: initialData.hostelFees || 0,
                paymentType: initialData.paymentType,
                loanRequired: initialData.loanRequired || false,
                loanAmount: initialData.loanAmount || 0,
                status: initialData.status
            });
        }
    }, [open, initialData, reset]);

    const { data: universities } = useQuery({
        queryKey: ['universities-select'],
        queryFn: apiClient.universities.list,
        enabled: open
    });

    const updateMutation = useMutation({
        mutationFn: (data: EditFormValues) => apiClient.enrollments.update(initialData.id, data),
        onSuccess: () => {
            toast.success('Enrollment updated successfully');
            queryClient.invalidateQueries({ queryKey: ['enrollment'] });
            onSuccess();
            onClose();
        },
        onError: (err) => {
            console.error(err);
            toast.error('Failed to update enrollment');
        }
    });

    const onSubmit = (data: EditFormValues) => {
        const totalFees = (Number(data.serviceCharge) || 0) + (Number(data.schoolFees) || 0) + (Number(data.hostelFees) || 0);
        updateMutation.mutate({ ...data, totalFees } as any);
    };

    const onError = (errors: any) => {
        console.error("Validation Errors:", errors);
        // Toast is redundant if form highlights errors, but keeping specific error generic
        // toast.error("Please check the form for errors");
    };

    const serviceCharge = watch('serviceCharge');
    const schoolFees = watch('schoolFees');
    const hostelFees = watch('hostelFees');
    const totalFees = (Number(serviceCharge) || 0) + (Number(schoolFees) || 0) + (Number(hostelFees) || 0);

    return (
        <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Dialog.Content aria-describedby={undefined} className="fixed left-[50%] top-[50%] w-[95vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <Dialog.Title className="text-lg font-bold text-slate-800">Edit Enrollment Details</Dialog.Title>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{initialData.enrollmentNo}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:bg-slate-100 rounded-full">
                            <X size={18} />
                        </Button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="edit-enrollment-form" onSubmit={handleSubmit(onSubmit as any, onError)} className="space-y-8">

                            {/* Group 1: Program Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 border-b pb-2 uppercase tracking-wider">Program Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Program Name</Label>
                                        <Input {...register('programName')} className="h-9" />
                                        {errors.programName && <p className="text-xs text-red-500">{errors.programName.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">University</Label>
                                        <Controller
                                            control={control}
                                            name="university"
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="h-9 w-full bg-white"><SelectValue placeholder="Select University" /></SelectTrigger>
                                                    <SelectContent>
                                                        {universities?.map((u: any) => (
                                                            <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.university && <p className="text-xs text-red-500">{errors.university.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Start Date</Label>
                                        <Input type="date" {...register('startDate')} className="h-9" />
                                        {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Duration (Months)</Label>
                                        <Input type="number" {...register('durationMonths')} className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Status</Label>
                                        <Controller
                                            control={control}
                                            name="status"
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Active">Active</SelectItem>
                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                        <SelectItem value="Dropped">Dropped</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Group 2: Fees */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 border-b pb-2 uppercase tracking-wider flex justify-between items-center">
                                    <span>Fee Structure</span>
                                    <span className="text-emerald-600">Total: ₹{totalFees.toLocaleString()}</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Service Charge</Label>
                                        <Input type="number" {...register('serviceCharge')} className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">School Fees</Label>
                                        <Input type="number" {...register('schoolFees')} className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Hostel Fees</Label>
                                        <Input type="number" {...register('hostelFees')} className="h-9" />
                                    </div>
                                </div>
                            </div>

                            {/* Group 3: Payment & Loan */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 border-b pb-2 uppercase tracking-wider">Payment & Loan</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Payment Type</Label>
                                        <Controller
                                            control={control}
                                            name="paymentType"
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Full">Full Payment</SelectItem>
                                                        <SelectItem value="Installment">Installment</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-3 pt-6">
                                        <div className="flex items-center gap-2">
                                            <Controller
                                                control={control}
                                                name="loanRequired"
                                                render={({ field }) => (
                                                    <Checkbox id="loanRequired" checked={field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <Label htmlFor="loanRequired" className="text-sm font-medium cursor-pointer">Loan Required</Label>
                                        </div>
                                        {watch('loanRequired') && (
                                            <div className="space-y-1.5 pl-6 animate-in fade-in slide-in-from-top-2">
                                                <Label className="text-xs text-slate-500">Loan Amount</Label>
                                                <Input type="number" {...register('loanAmount')} className="h-9" placeholder="Enter amount..." />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button
                            onClick={handleSubmit(onSubmit as any, onError)}
                            disabled={updateMutation.isPending}
                            className="bg-teal-600 hover:bg-teal-700 min-w-[100px]"
                        >
                            {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                        </Button>
                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
