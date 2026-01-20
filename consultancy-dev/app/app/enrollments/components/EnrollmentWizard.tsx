'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Check, Loader2, User, GraduationCap, Wallet, CreditCard, FileText, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { toast } from '@/store/toastStore';

const DRAFT_KEY = 'enrollment_wizard_draft';

const COMMON_DOCUMENTS = [
    "Class 10 Marksheet", "Class 10 Passing Certificate", "Class 12 Marksheet",
    "Class 12 Passing Certificate", "Admit Card", "Migration Certificate",
    "Transfer Certificate (TC)", "Character Certificate", "Aadhaar Card",
    "PAN Card", "Passport", "NEET Score Card", "Gap Certificate",
    "Domicile Certificate", "Caste Certificate", "Income Certificate", "Passport Size Photos"
];

const enrollmentSchema = z.object({
    studentId: z.string().min(1, "Please select a student"),
    studentName: z.string().optional(),
    university: z.string().min(1, "University is required"),
    programName: z.string().min(1, "Program name is required"),
    programDuration: z.coerce.number().min(1, "Duration is required"),
    startDate: z.string().min(1, "Start date is required"),
    serviceCharge: z.coerce.number().min(0),
    schoolFees: z.coerce.number().min(0),
    hostelFees: z.coerce.number().min(0),
    paymentType: z.enum(['Full', 'Partial', 'Installment', 'Advance', 'One-time']).optional(),
    installmentsCount: z.coerce.number().optional(),
    installmentAmount: z.coerce.number().optional(),
    // Payment Method Fields
    paymentMethod: z.enum(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque']).optional(),
    paymentDate: z.string().optional(),
    paymentReference: z.string().optional(),
    cardLast4: z.string().optional(),
    cardNetwork: z.string().optional(),
    upiId: z.string().optional(),
    bankName: z.string().optional(),
    chequeNumber: z.string().optional(),
    documents: z.array(z.any()).optional(),
    documentTakeoverEnabled: z.boolean().default(false),
    student_documents: z.array(z.object({
        name: z.string(),
        document_number: z.string().optional(),
        remarks: z.string().optional()
    })).optional(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

interface EnrollmentWizardProps {
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

const STEPS = [
    { id: 1, name: 'Student', icon: User },
    { id: 2, name: 'Program', icon: GraduationCap },
    { id: 3, name: 'Fees', icon: Wallet },
    { id: 4, name: 'Documents', icon: FileText },
    { id: 5, name: 'Payment', icon: CreditCard },
];

export function EnrollmentWizard({ onSubmit, isLoading }: EnrollmentWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedStudentName, setSelectedStudentName] = useState<string>('');
    const [isDirty, setIsDirty] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    // Fetch registrations (students available for enrollment)
    const { data: registrations } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    // Fetch existing enrollments to filter out already-enrolled students
    const { data: enrollments } = useQuery({
        queryKey: ['enrollments'],
        queryFn: apiClient.enrollments.list,
    });

    // Fetch universities for the account
    const { data: universities } = useQuery({
        queryKey: ['universities'],
        queryFn: apiClient.universities.list,
    });

    // Filter: only show registered students who are NOT already enrolled
    const enrolledStudentIds = new Set(enrollments?.map(e => e.studentId) || []);
    const availableStudents = registrations?.filter(r => !enrolledStudentIds.has(r.id)) || [];

    // Load draft from localStorage
    const loadDraft = () => {
        try {
            const draft = localStorage.getItem(DRAFT_KEY);
            if (draft) {
                const parsed = JSON.parse(draft);
                return parsed;
            }
        } catch (e) {
            console.error('Failed to load draft:', e);
        }
        return null;
    };

    const savedDraft = loadDraft();

    const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<EnrollmentFormValues>({
        resolver: zodResolver(enrollmentSchema) as any,
        defaultValues: savedDraft || {
            studentId: '', university: '', programName: '', programDuration: 12, startDate: '',
            serviceCharge: 0, schoolFees: 0, hostelFees: 0,
            installmentsCount: 1, installmentAmount: 0, documents: [],
            documentTakeoverEnabled: false, student_documents: [],
        }
    });

    const { fields, append, remove, replace } = useFieldArray({ control, name: 'student_documents' });
    const watchedValues = watch();
    const totalFees = (Number(watchedValues.serviceCharge) || 0) + (Number(watchedValues.schoolFees) || 0) + (Number(watchedValues.hostelFees) || 0);

    // Set selectedStudentName from draft if exists
    useEffect(() => {
        if (savedDraft?.studentId && availableStudents.length > 0) {
            const student = availableStudents.find(s => String(s.id) === String(savedDraft.studentId));
            if (student) {
                setSelectedStudentName(student.studentName);
            }
        }
    }, [availableStudents, savedDraft?.studentId]);

    // Watch for form changes to set dirty state
    useEffect(() => {
        const hasData = watchedValues.studentId || watchedValues.university || watchedValues.programName;
        setIsDirty(!!hasData);
    }, [watchedValues]);

    // Warn before leaving if form has data
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Handle student selection - USE String() for comparison
    const handleStudentSelect = (studentId: string) => {
        const student = availableStudents.find(s => String(s.id) === studentId);
        if (student) {
            setSelectedStudentName(student.studentName);
            setValue('studentId', studentId);
            setValue('studentName', student.studentName);

            // Populate physical documents
            if (student.student_documents && student.student_documents.length > 0) {
                replace(student.student_documents);
                setValue('documentTakeoverEnabled', true);
            } else {
                replace([]);
                setValue('documentTakeoverEnabled', false);
            }
        }
    };

    // Save draft to localStorage
    const saveDraft = () => {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(watchedValues));
            toast.success('Draft Saved!', 'You can continue later.');
        } catch (e) {
            console.error('Failed to save draft:', e);
            toast.error('Save Failed', 'Unable to save draft. Please try again.');
        }
    };

    // Clear draft
    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
    };

    const getCompletionPercentage = () => {
        let filled = 0;
        if (watchedValues.studentId) filled++;
        if (watchedValues.university) filled++;
        if (watchedValues.programName) filled++;
        if (watchedValues.startDate) filled++;
        if (totalFees > 0) filled++;
        if (watchedValues.documents?.length || fields.length > 0) filled++;
        return Math.round((filled / 6) * 100);
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return !!watchedValues.studentId;
            case 2: return !!watchedValues.university && !!watchedValues.programName && !!watchedValues.startDate;
            case 3: return true; // Fees are optional
            case 4: return true; // Documents are optional
            case 5: return !!watchedValues.paymentMethod; // Payment method is required
            default: return false;
        }
    };

    const handleFormSubmit = (data: EnrollmentFormValues) => {
        const payload = {
            student: data.studentId,
            studentName: data.studentName,
            university: data.university,
            programName: data.programName,
            startDate: data.startDate,
            durationMonths: data.programDuration,
            serviceCharge: data.serviceCharge,
            schoolFees: data.schoolFees,
            hostelFees: data.hostelFees,
            totalFees: totalFees,
            paymentType: data.paymentType,
            installmentsCount: data.installmentsCount,
            installmentAmount: data.installmentAmount,
            // Payment Method Details
            paymentMethod: data.paymentMethod,
            paymentDate: data.paymentDate,
            paymentReference: data.paymentReference,
            cardLast4: data.cardLast4,
            cardNetwork: data.cardNetwork,
            upiId: data.upiId,
            bankName: data.bankName,
            chequeNumber: data.chequeNumber,
            documents: data.documents,
            student_documents: data.student_documents,
        };
        clearDraft(); // Clear draft on successful submit
        onSubmit(payload);
    };

    const handleBack = () => {
        if (isDirty) {
            setShowLeaveModal(true);
        } else {
            window.history.back();
        }
    };

    const handleLeaveWithoutSaving = () => {
        setShowLeaveModal(false);
        clearDraft();
        window.history.back();
    };

    const handleSaveAndLeave = () => {
        saveDraft();
        setShowLeaveModal(false);
        window.history.back();
    };

    return (
        <>
            <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium">
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div className="flex items-center gap-4">
                            <Button type="button" variant="outline" size="sm" onClick={saveDraft} className="h-8 text-xs border-slate-300">
                                <Save size={14} className="mr-1" /> Save Draft
                            </Button>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 uppercase font-medium">Progress</span>
                                <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500 transition-all" style={{ width: `${getCompletionPercentage()}%` }} />
                                </div>
                                <span className="text-xs font-bold text-teal-600">{getCompletionPercentage()}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="px-6 py-4 bg-white border-b border-slate-100">
                    <div className="flex justify-center items-center gap-0">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                                        currentStep === step.id ? "bg-teal-600 text-white"
                                            : currentStep > step.id ? "bg-teal-100 text-teal-600"
                                                : "bg-slate-100 text-slate-400"
                                    )}>
                                        {currentStep > step.id ? <Check size={18} /> : <step.icon size={18} />}
                                    </div>
                                    <span className={cn("text-[10px] mt-1.5 font-medium uppercase tracking-wide", currentStep === step.id ? "text-teal-600" : "text-slate-400")}>{step.name}</span>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={cn("w-10 h-0.5 mx-2", currentStep > step.id ? "bg-teal-500" : "bg-slate-200")} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <div className="px-6 py-6 min-h-[340px]">

                        {/* Step 1: Student Selection */}
                        {currentStep === 1 && (
                            <div className="max-w-lg mx-auto space-y-5">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Select Student</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Choose from registered students</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Student</Label>
                                    <Select value={watchedValues.studentId} onValueChange={handleStudentSelect}>
                                        <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                                            <span className={selectedStudentName ? "text-slate-900" : "text-slate-400"}>
                                                {selectedStudentName || "Select a student..."}
                                            </span>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {availableStudents.length === 0 ? (
                                                <div className="p-3 text-sm text-slate-400 text-center">No students available</div>
                                            ) : (
                                                availableStudents.map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                                                {s.studentName?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-800">{s.studentName}</p>
                                                                <p className="text-[10px] text-slate-400">{s.mobile} • {s.email}</p>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.studentId && <p className="text-xs text-red-500">{errors.studentId.message}</p>}
                                </div>
                                {selectedStudentName && (
                                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                                {selectedStudentName.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{selectedStudentName}</p>
                                                <p className="text-xs text-slate-500">Selected for enrollment</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Program Details */}
                        {currentStep === 2 && (
                            <div className="max-w-lg mx-auto space-y-5">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Program Details</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Enter course and institution info</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">University</Label>
                                        <Controller
                                            name="university"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-teal-500">
                                                        <SelectValue placeholder="Select university..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-60">
                                                        {universities && universities.length > 0 ? (
                                                            universities.map((u: any) => (
                                                                <SelectItem key={u.id} value={u.name}>{u.name} ({u.country})</SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-sm text-slate-400 text-center">No universities found.</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.university && <p className="text-xs text-red-500">{errors.university.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Program / Course</Label>
                                        <Input {...register('programName')} placeholder="e.g. MBBS" className="h-11 bg-white border-slate-200 focus:border-teal-500" />
                                        {errors.programName && <p className="text-xs text-red-500">{errors.programName.message}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Duration (Months)</Label>
                                            <Input type="number" {...register('programDuration')} placeholder="12" className="h-11 bg-white border-slate-200 focus:border-teal-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Start Date</Label>
                                            <Input type="date" {...register('startDate')} className="h-11 bg-white border-slate-200 focus:border-teal-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Fee Structure */}
                        {currentStep === 3 && (
                            <div className="max-w-lg mx-auto space-y-5">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Fee Structure</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Enter fee breakdown</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Service Charge</Label>
                                        <Input type="number" {...register('serviceCharge')} placeholder="0" className="h-11 bg-white border-slate-200 focus:border-teal-500" readOnly={false} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">School Fees</Label>
                                        <Input type="number" {...register('schoolFees')} placeholder="0" className="h-11 bg-white border-slate-200 focus:border-teal-500" readOnly={false} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Hostel Fees</Label>
                                        <Input type="number" {...register('hostelFees')} placeholder="0" className="h-11 bg-white border-slate-200 focus:border-teal-500" readOnly={false} />
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex justify-between items-center">
                                    <span className="text-sm text-green-700 font-medium">Total Fees</span>
                                    <span className="text-2xl font-bold text-green-700">₹{totalFees.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Documents */}
                        {currentStep === 4 && (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {/* Header */}
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-slate-800">Documents</h3>
                                    <p className="text-sm text-slate-500 mt-1">Upload or track documents</p>
                                </div>

                                {/* Digital Uploads Section */}
                                <Card className="overflow-hidden border-slate-200">
                                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-3 border-b border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-800">Digital Uploads</h4>
                                                <p className="text-xs text-slate-500">Upload digital copies of documents</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <DocumentUpload
                                            registrationId={watchedValues.studentId || undefined}
                                            studentName={selectedStudentName || ''}
                                            initialDocuments={availableStudents.find(s => String(s.id) === String(watchedValues.studentId))?.documents || []}
                                            onDocumentsChange={(docs) => setValue('documents', docs)}
                                            readOnly={false}
                                        />
                                    </div>
                                </Card>

                                {/* Physical Documents Section */}
                                <Card className="overflow-hidden border-slate-200">
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-3 border-b border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-800">Physical Documents</h4>
                                                    <p className="text-xs text-slate-500">Track physical document submissions</p>
                                                </div>
                                            </div>
                                            <Controller
                                                control={control}
                                                name="documentTakeoverEnabled"
                                                render={({ field }) => (
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id="physDocs"
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => {
                                                                field.onChange(checked);
                                                                if (checked && fields.length === 0) append({ name: '', document_number: '', remarks: '' });
                                                            }}
                                                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                                        />
                                                        <Label htmlFor="physDocs" className="text-sm font-medium text-slate-700 cursor-pointer">Enable</Label>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {watchedValues.documentTakeoverEnabled && (
                                        <div className="p-5 space-y-3">
                                            {fields.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                                        <FileText className="w-8 h-8 text-slate-400" />
                                                    </div>
                                                    <p className="text-sm text-slate-500 mb-3">No physical documents tracked yet</p>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => append({ name: '', document_number: '', remarks: '' })}
                                                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                                    >
                                                        <Plus size={16} className="mr-2" /> Add First Document
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid gap-3">
                                                        {fields.map((field, index) => (
                                                            <div key={field.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-purple-300 transition-colors">
                                                                <div className="grid grid-cols-12 gap-3 items-start">
                                                                    <div className="col-span-4">
                                                                        <Label className="text-xs text-slate-600 mb-1.5 block">Document Name</Label>
                                                                        <Input
                                                                            list={`docs-${index}`}
                                                                            {...register(`student_documents.${index}.name`)}
                                                                            placeholder="e.g. Class 10 Marksheet"
                                                                            className="h-9 bg-white border-slate-300 text-sm"
                                                                        />
                                                                        <datalist id={`docs-${index}`}>
                                                                            {COMMON_DOCUMENTS.map(d => <option key={d} value={d} />)}
                                                                        </datalist>
                                                                    </div>
                                                                    <div className="col-span-3">
                                                                        <Label className="text-xs text-slate-600 mb-1.5 block">Document Number</Label>
                                                                        <Input
                                                                            {...register(`student_documents.${index}.document_number`)}
                                                                            placeholder="e.g. 123456"
                                                                            className="h-9 bg-white border-slate-300 text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-4">
                                                                        <Label className="text-xs text-slate-600 mb-1.5 block">Remarks</Label>
                                                                        <Input
                                                                            {...register(`student_documents.${index}.remarks`)}
                                                                            placeholder="Optional notes"
                                                                            className="h-9 bg-white border-slate-300 text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-1 flex items-end justify-center">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => remove(index)}
                                                                            className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => append({ name: '', document_number: '', remarks: '' })}
                                                        className="w-full text-purple-600 border-purple-200 hover:bg-purple-50 mt-2"
                                                    >
                                                        <Plus size={16} className="mr-2" /> Add Another Document
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {!watchedValues.documentTakeoverEnabled && (
                                        <div className="px-5 pb-5 pt-2">
                                            <div className="bg-slate-50 rounded-lg p-4 text-center border border-dashed border-slate-300">
                                                <p className="text-sm text-slate-500">Enable physical document tracking to add documents</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}

                        {/* Step 5: Payment */}
                        {currentStep === 5 && (
                            <div className="max-w-2xl mx-auto space-y-5">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Payment Details</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Enter payment method and transaction details</p>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Payment Method *</Label>
                                    <Controller
                                        name="paymentMethod"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-teal-500">
                                                    <SelectValue placeholder="Select payment method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Card">Card</SelectItem>
                                                    <SelectItem value="UPI">UPI</SelectItem>
                                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.paymentMethod && <p className="text-xs text-red-500">{errors.paymentMethod.message}</p>}
                                </div>

                                {/* Payment Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Payment Date</Label>
                                        <Input
                                            type="date"
                                            {...register('paymentDate')}
                                            className="h-11 bg-white border-slate-200 focus:border-teal-500"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    {/* Payment Type */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 font-medium uppercase tracking-wide">Payment Type</Label>
                                        <Controller
                                            name="paymentType"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-teal-500">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Full">Full Payment</SelectItem>
                                                        <SelectItem value="Partial">Partial Payment</SelectItem>
                                                        <SelectItem value="Installment">Installment</SelectItem>
                                                        <SelectItem value="Advance">Advance Payment</SelectItem>
                                                        <SelectItem value="One-time">One-time Payment</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                                {errors.paymentMethod && <p className="text-xs text-red-500 -mt-3">{errors.paymentMethod.message}</p>}
                                {!watchedValues.paymentMethod && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                                        <p className="text-xs text-amber-700">Please select a payment method to continue</p>
                                    </div>
                                )}

                                {/* Conditional Fields Based on Payment Method */}
                                {watchedValues.paymentMethod === 'Card' && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                                        <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <CreditCard size={16} /> Card Details
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">Reference / Receipt No.</Label>
                                                <Input {...register('paymentReference')} placeholder="e.g. REC-001" className="h-10 bg-white border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">Last 4 Digits</Label>
                                                <Input {...register('cardLast4')} placeholder="XXXX" maxLength={4} className="h-10 bg-white border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">Card Network</Label>
                                                <Controller
                                                    name="cardNetwork"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <SelectTrigger className="h-10 bg-white border-slate-200">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Visa">Visa</SelectItem>
                                                                <SelectItem value="Mastercard">Mastercard</SelectItem>
                                                                <SelectItem value="RuPay">RuPay</SelectItem>
                                                                <SelectItem value="AmEx">AmEx</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {watchedValues.paymentMethod === 'UPI' && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                                        <h4 className="text-sm font-medium text-slate-700">UPI Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">Transaction ID</Label>
                                                <Input {...register('paymentReference')} placeholder="e.g. 123456789012" className="h-10 bg-white border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">UPI ID</Label>
                                                <Input {...register('upiId')} placeholder="e.g. user@upi" className="h-10 bg-white border-slate-200" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {watchedValues.paymentMethod === 'Bank Transfer' && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                                        <h4 className="text-sm font-medium text-slate-700">Bank Transfer Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">Reference Number</Label>
                                                <Input {...register('paymentReference')} placeholder="e.g. REF123456" className="h-10 bg-white border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">Bank Name</Label>
                                                <Input {...register('bankName')} placeholder="e.g. HDFC Bank" className="h-10 bg-white border-slate-200" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {watchedValues.paymentMethod === 'Cheque' && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                                        <h4 className="text-sm font-medium text-slate-700">Cheque Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">Cheque Number</Label>
                                                <Input {...register('chequeNumber')} placeholder="e.g. 123456" className="h-10 bg-white border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-600">Bank Name</Label>
                                                <Input {...register('bankName')} placeholder="e.g. HDFC Bank" className="h-10 bg-white border-slate-200" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {watchedValues.paymentMethod === 'Cash' && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-600">Reference / Receipt No. (Optional)</Label>
                                            <Input {...register('paymentReference')} placeholder="e.g. CASH-001" className="h-10 bg-white border-slate-200" />
                                        </div>
                                    </div>
                                )}

                                {/* Installment Details */}
                                {watchedValues.paymentType === 'Installment' && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
                                        <h4 className="text-sm font-medium text-amber-800">Installment Plan</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-amber-700">Number of Installments</Label>
                                                <Input type="number" {...register('installmentsCount')} placeholder="4" className="h-10 bg-white border-amber-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-amber-700">Amount per Installment</Label>
                                                <Input type="number" {...register('installmentAmount')} placeholder="0" className="h-10 bg-white border-amber-200" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <Button type="button" variant="outline" onClick={() => currentStep > 1 && setCurrentStep(s => s - 1)} disabled={currentStep === 1} className="h-10 px-5 border-slate-200 text-slate-600">
                            <ArrowLeft size={16} className="mr-2" /> Previous
                        </Button>

                        {currentStep < 5 ? (
                            <Button type="button" onClick={() => canProceed() && setCurrentStep(s => s + 1)} disabled={!canProceed()} className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white">
                                Continue <ArrowRight size={16} className="ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isLoading || !canProceed()}
                                className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Enrollment'}
                            </Button>
                        )}
                    </div>
                </form>
            </Card >

            {/* Leave Confirmation Modal */}
            < Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <DialogTitle className="text-lg font-semibold text-slate-800">Unsaved Changes</DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-500">
                            You have unsaved enrollment data. Would you like to save it as a draft before leaving?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowLeaveModal(false)} className="flex-1 border-slate-200">
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={handleLeaveWithoutSaving} className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                            Discard & Leave
                        </Button>
                        <Button onClick={handleSaveAndLeave} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
                            <Save size={16} className="mr-2" /> Save Draft & Leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    );
}
