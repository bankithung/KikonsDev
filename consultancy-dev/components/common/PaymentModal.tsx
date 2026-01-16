'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, Landmark, Banknote, QrCode, Wallet, Hash, FileText, CheckCircle2, User, Calendar, ChevronsUpDown, Check, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    paymentDate: z.string().min(1, 'Payment date is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    purpose: z.string().optional(),
    referenceNumber: z.string().optional(),
    // Dynamic fields
    chequeNo: z.string().optional(),
    bankName: z.string().optional(),
    chequeDate: z.string().optional(),
    upiId: z.string().optional(),
    transactionId: z.string().optional(),
    // Card fields
    cardLast4: z.string().length(4).optional().or(z.literal('')),
    cardNetwork: z.string().optional(),
    // Student Selection if manual
    manualStudentName: z.string().optional(),
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
        formState,
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

    const { errors } = formState;
    const paymentMethod = watch('paymentMethod');
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all possibilities if studentName is not provided
    const { data: enquiries = [] } = useQuery({ queryKey: ['enquiries'], queryFn: apiClient.enquiries.list, enabled: !studentName && open });
    const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: apiClient.registrations.list, enabled: !studentName && open });
    const { data: enrollments = [] } = useQuery({ queryKey: ['enrollments'], queryFn: apiClient.enrollments.list, enabled: !studentName && open });

    const allStudents = useMemo(() => {
        if (studentName) return [];

        const list = [
            ...enrollments.map((e: any) => ({
                id: `enr-${e.id}`,
                name: e.studentName,
                type: 'Enrollment',
                detail: e.enrollmentNo || e.programName
            })),
            ...registrations.map((r: any) => ({
                id: `reg-${r.id}`,
                name: r.studentName,
                type: 'Registration',
                detail: r.registrationNo || r.mobile
            })),
            ...enquiries.map((e: any) => ({
                id: `enq-${e.id}`,
                name: e.candidateName,
                type: 'Enquiry',
                detail: e.mobile || e.courseInterested
            }))
        ];

        // Unique by name for payments? Or allow duplicates if same name?
        // Since we pass `studentName` to create payment, we need the name.
        // If there are duplicates, the user might be confused.
        // We will just list them all.
        return list;
    }, [enquiries, registrations, enrollments, studentName]);

    const handleFormSubmit = async (data: PaymentFormData) => {
        const finalStudentName = studentName || selectedStudent || data.manualStudentName;

        if (!finalStudentName) {
            formState.errors.manualStudentName = { type: 'required', message: 'Student name is required' };
            return;
        }

        const metadata: any = {};
        if (data.paymentMethod === 'Cheque') {
            if (data.chequeNo) metadata.chequeNo = data.chequeNo;
            if (data.bankName) metadata.bankName = data.bankName;
            if (data.chequeDate) metadata.chequeDate = data.chequeDate;
        } else if (data.paymentMethod === 'Bank Transfer') {
            if (data.transactionId) metadata.transactionId = data.transactionId;
            if (data.bankName) metadata.bankName = data.bankName;
        } else if (data.paymentMethod === 'UPI') {
            if (data.upiId) metadata.upiId = data.upiId;
            if (data.transactionId) metadata.transactionId = data.transactionId;
        } else if (data.paymentMethod === 'Card') {
            if (data.cardLast4) metadata.cardLast4 = data.cardLast4;
            if (data.cardNetwork) metadata.cardNetwork = data.cardNetwork;
            if (data.transactionId) metadata.transactionId = data.transactionId;
        }

        await onSubmit({
            studentName: finalStudentName,
            amount: data.amount,
            date: data.paymentDate,
            method: data.paymentMethod,
            type: data.purpose || 'Payment',
            referenceNumber: data.referenceNumber,
            metadata: metadata,
        });
        reset();
        setSelectedStudent('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="fixed left-[50%] top-[50%] w-[95vw] max-w-[950px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl z-50 border border-slate-200 overflow-hidden outline-none p-0 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600 border border-teal-100/50 shadow-sm">
                            <Wallet size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900 font-heading leading-tight tracking-tight">Record Payment</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                                Enter transaction details and student information
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col md:flex-row h-[70vh] md:h-auto overflow-hidden">

                    {/* LEFT COLUMN: Primary Fields */}
                    <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[60vh] md:max-h-none md:border-r border-slate-100">

                        {/* Student Selection (Custom Dropdown) */}
                        {!studentName && (
                            <div className="space-y-2 relative">
                                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    Student <span className="text-red-500">*</span>
                                </Label>

                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search for a student..."
                                            className="pl-9 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white shadow-sm"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setOpenCombobox(true);
                                                setSelectedStudent('');
                                            }}
                                            onFocus={() => setOpenCombobox(true)}
                                        />
                                        {selectedStudent && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Selected
                                            </div>
                                        )}
                                    </div>

                                    {openCombobox && searchTerm && (
                                        <div className="absolute top-full left-0 w-full z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-[250px] overflow-y-auto">
                                            {allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                <div className="p-4 text-center text-sm text-slate-500">
                                                    No student found matching "{searchTerm}"
                                                </div>
                                            ) : (
                                                <div className="py-1">
                                                    {allStudents
                                                        .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                        .slice(0, 50)
                                                        .map((student) => (
                                                            <div
                                                                key={`${student.id}-${student.type}`}
                                                                className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0 border-slate-50 transition-colors"
                                                                onClick={() => {
                                                                    setSelectedStudent(student.name);
                                                                    setSearchTerm(student.name);
                                                                    setOpenCombobox(false);
                                                                }}
                                                            >
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-semibold text-sm text-slate-900">{student.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${student.type === 'Enrollment' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                            student.type === 'Registration' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                                            }`}>
                                                                            {student.type}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500">{student.detail}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {openCombobox && <div className="fixed inset-0 z-40" onClick={() => setOpenCombobox(false)}></div>}

                                <div className="flex items-center gap-2 pt-1">
                                    <div className="h-px bg-slate-100 flex-1"></div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">OR</span>
                                    <div className="h-px bg-slate-100 flex-1"></div>
                                </div>
                                <Input
                                    {...register('manualStudentName')}
                                    placeholder="Enter Student Name Manually"
                                    className="h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-5">
                            {/* Payment Method */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    Method <span className="text-red-500">*</span>
                                </Label>
                                <Select onValueChange={(val) => setValue('paymentMethod', val)} value={paymentMethod}>
                                    <SelectTrigger className="h-11 border-slate-200 focus:ring-teal-500 bg-white font-medium">
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Card">Card</SelectItem>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Payment Date */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    className="h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 cursor-pointer"
                                    {...register('paymentDate')}
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                Amount <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-lg">₹</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-8 h-12 text-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 font-bold text-slate-900 shadow-sm"
                                    {...register('amount', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.amount && <p className="text-xs font-medium text-red-500 mt-1">{errors.amount.message}</p>}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Payment Notes
                            </Label>
                            <textarea
                                placeholder="Add any additional remarks (optional)..."
                                rows={2}
                                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                                {...register('purpose')}
                            />
                        </div>
                    </div>


                    {/* RIGHT COLUMN: Dynamic Details Panel */}
                    <div className="w-full md:w-[320px] lg:w-[350px] bg-slate-50/80 p-6 flex flex-col border-l border-slate-100/50">
                        <div className="mb-6 pb-4 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                {paymentMethod === 'Cash' ? <Banknote size={16} className="text-teal-600" /> :
                                    paymentMethod === 'Card' ? <CreditCard size={16} className="text-blue-600" /> :
                                        paymentMethod === 'UPI' ? <QrCode size={16} className="text-indigo-600" /> :
                                            paymentMethod === 'Bank Transfer' ? <Landmark size={16} className="text-emerald-600" /> :
                                                <FileText size={16} className="text-amber-600" />
                                }
                                {paymentMethod} Details
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Enter specific transaction details below</p>
                        </div>

                        <div className="flex-1 space-y-4">
                            {/* Always Show Reference Number if needed, or put it in left col. User asked for specific right side details for methods. keeping Ref in dynamic or left? Let's put Ref here as it relates to tracking */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-600">Reference / Receipt No.</Label>
                                <Input
                                    className="bg-white border-slate-200 h-9"
                                    placeholder="e.g. REC-001"
                                    {...register('referenceNumber')}
                                />
                            </div>

                            {/* DYNAMIC FIELDS */}
                            {paymentMethod === 'Card' && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">Last 4 Digits</Label>
                                        <Input placeholder="XXXX" maxLength={4} {...register('cardLast4')} className="bg-white border-slate-200 h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">Card Network</Label>
                                        <Select onValueChange={(val) => setValue('cardNetwork', val)}>
                                            <SelectTrigger className="bg-white border-slate-200 h-9 text-xs">
                                                <SelectValue placeholder="Select Network" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Visa">Visa</SelectItem>
                                                <SelectItem value="MasterCard">MasterCard</SelectItem>
                                                <SelectItem value="RuPay">RuPay</SelectItem>
                                                <SelectItem value="Amex">Amex</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {paymentMethod === 'UPI' && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">UPI ID</Label>
                                        <Input placeholder="user@upi" {...register('upiId')} className="bg-white border-slate-200 h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">Transaction ID</Label>
                                        <Input placeholder="Txn Ref ID" {...register('transactionId')} className="bg-white border-slate-200 h-9" />
                                    </div>
                                </>
                            )}

                            {paymentMethod === 'Bank Transfer' && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">Bank Name</Label>
                                        <Input placeholder="e.g. HDFC Bank" {...register('bankName')} className="bg-white border-slate-200 h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">Transaction ID</Label>
                                        <Input placeholder="IMPS/NEFT Ref" {...register('transactionId')} className="bg-white border-slate-200 h-9" />
                                    </div>
                                </>
                            )}

                            {paymentMethod === 'Cheque' && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">Cheque Number</Label>
                                        <Input placeholder="XXXXXX" {...register('chequeNo')} className="bg-white border-slate-200 h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">Bank Name</Label>
                                        <Input placeholder="Issuing Bank" {...register('bankName')} className="bg-white border-slate-200 h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600">Cheque Date</Label>
                                        <Input type="date" {...register('chequeDate')} className="bg-white border-slate-200 h-9" />
                                    </div>
                                </>
                            )}

                            {paymentMethod === 'Cash' && (
                                <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded-lg text-xs text-teal-700 flex flex-col gap-1 text-center">
                                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 opacity-50" />
                                    <span className="font-semibold">Cash Payment Selected</span>
                                    <span className="opacity-80">Reference number helps in tracking cash receipts.</span>
                                </div>
                            )}
                        </div>

                        {/* Footer in Right Col or spans? Let's put Main Action here or keep footer generic */}
                        <div className="mt-auto pt-6 border-t border-slate-200 flex flex-col gap-2">
                            <Button
                                type="submit"
                                disabled={isLoading || formState.isSubmitting}
                                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50 font-semibold rounded-lg text-sm"
                            >
                                {(isLoading || formState.isSubmitting) ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Payment
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full h-9 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium"
                            >
                                Cancel Transaction
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
