'use client';

import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, User, GraduationCap, BookOpen, Wallet, FileText, Check, ChevronRight, Save, Users, MapPin, Phone, Mail } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { DocumentTakeover } from '@/components/common/DocumentTakeover';
import { INDIAN_STATES, SCHOOL_BOARDS } from '@/lib/utils';

const STANDARD_INPUT_STYLE = "h-10 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md text-sm";
const BLUE_INPUT_STYLE = "h-10 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-md text-sm";

// Section configuration
const SECTIONS = [
    { id: 'student-info', label: 'Student Info', icon: User, color: 'teal' },
    { id: 'family-address', label: 'Family & Address', icon: Users, color: 'purple' },
    { id: 'academic', label: 'Academic Details', icon: GraduationCap, color: 'blue' },
    { id: 'preferences', label: 'Study Preferences', icon: BookOpen, color: 'indigo' },
    { id: 'payment', label: 'Registration & Payment', icon: Wallet, color: 'orange' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'slate' },
];

const registrationSchema = z.object({
    studentName: z.string().min(1, "Required"),
    email: z.string().email("Required"),
    mobile: z.string().min(10, "Required"),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    dateOfBirth: z.string().min(1, "Required"),
    fatherName: z.string().min(1, "Required"),
    motherName: z.string().min(1, "Required"),
    fatherOccupation: z.string().optional(),
    motherOccupation: z.string().optional(),
    fatherMobile: z.string().optional(),
    motherMobile: z.string().optional(),
    permanentAddress: z.string().min(1, "Required"),
    familyPlace: z.string().optional(),
    familyState: z.string().optional(),

    schoolName: z.string().optional(),
    schoolBoard: z.string().optional(),
    schoolPlace: z.string().optional(),
    schoolState: z.string().optional(),
    class10SchoolName: z.string().optional(),
    class10Board: z.string().optional(),
    class10Place: z.string().optional(),
    class10State: z.string().optional(),
    class10PassingYear: z.string().optional(),
    class10Percentage: z.coerce.number().optional(),
    class12Percentage: z.coerce.number().optional(),
    class12PassingYear: z.string().optional(),
    gapYear: z.boolean().default(false),
    gapYearFrom: z.coerce.number().optional(),
    gapYearTo: z.coerce.number().optional(),

    pcbPercentage: z.coerce.number().optional(),
    pcmPercentage: z.coerce.number().optional(),
    physicsMarks: z.coerce.number().optional(),
    chemistryMarks: z.coerce.number().optional(),
    biologyMarks: z.coerce.number().optional(),
    mathsMarks: z.coerce.number().optional(),
    previousNeetMarks: z.coerce.number().optional(),
    presentNeetMarks: z.coerce.number().optional(),

    registrationFee: z.coerce.number().min(0),
    paymentMethod: z.enum(['Cash', 'Card', 'UPI', 'Other']),
    paymentStatus: z.enum(['Paid', 'Pending', 'Partial']),
    needsLoan: z.boolean().default(false),

    preferences: z.array(z.object({
        courseName: z.string().min(1, "Required"),
        location: z.string().min(1, "Required"),
        priority: z.coerce.number().min(1),
    })).min(1, "At least one preference required"),
    documents: z.array(z.any()).optional(),

    student_documents: z.array(z.object({
        name: z.string(),
        document_number: z.string().optional(),
        remarks: z.string().optional()
    })).optional(),
    documentTakeoverEnabled: z.boolean().default(false),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface ProfileRegistrationFormProps {
    onSubmit: (data: RegistrationFormValues) => void;
    isLoading: boolean;
    initialData?: any;
}

export function ProfileRegistrationForm({ onSubmit, isLoading, initialData }: ProfileRegistrationFormProps) {
    const [activeSection, setActiveSection] = useState('student-info');
    const [academicSubTab, setAcademicSubTab] = useState<'class10' | 'class12' | 'scorecard'>('class10');
    const [documentsSubTab, setDocumentsSubTab] = useState<'upload' | 'takeover'>('upload');
    const [prefilledDocs, setPrefilledDocs] = useState<any[]>([]);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<RegistrationFormValues>({
        // @ts-ignore
        resolver: zodResolver(registrationSchema),
        defaultValues: initialData || {
            paymentMethod: 'Cash',
            paymentStatus: 'Paid',
            needsLoan: false,
            registrationFee: 5000,
            preferences: [{ courseName: '', location: '', priority: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "preferences",
    });

    const physicsMarks = watch('physicsMarks');
    const chemistryMarks = watch('chemistryMarks');
    const biologyMarks = watch('biologyMarks');
    const mathsMarks = watch('mathsMarks');
    const formValues = watch();

    // Auto-calculate PCB and PCM
    useEffect(() => {
        const isValid = (val: any) => val !== '' && val !== undefined && val !== null && !isNaN(Number(val));
        if (isValid(physicsMarks) && isValid(chemistryMarks) && isValid(biologyMarks)) {
            const pcb = (Number(physicsMarks) + Number(chemistryMarks) + Number(biologyMarks)) / 3;
            setValue('pcbPercentage', parseFloat(pcb.toFixed(2)));
        }
        if (isValid(physicsMarks) && isValid(chemistryMarks) && isValid(mathsMarks)) {
            const pcm = (Number(physicsMarks) + Number(chemistryMarks) + Number(mathsMarks)) / 3;
            setValue('pcmPercentage', parseFloat(pcm.toFixed(2)));
        }
    }, [physicsMarks, chemistryMarks, biologyMarks, mathsMarks, setValue]);

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const handleFormSubmit: SubmitHandler<RegistrationFormValues> = (data) => {
        const processedPreferences = data.preferences.flatMap(pref => {
            if (pref.location && pref.location.includes(',')) {
                return pref.location.split(',').map(loc => ({
                    ...pref,
                    location: loc.trim()
                })).filter(p => p.location);
            }
            return pref;
        });
        onSubmit({ ...data, preferences: processedPreferences });
    };

    const colorClasses: Record<string, { bg: string; text: string; activeBg: string }> = {
        teal: { bg: 'bg-teal-50', text: 'text-teal-700', activeBg: 'bg-teal-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', activeBg: 'bg-purple-600' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', activeBg: 'bg-blue-600' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', activeBg: 'bg-indigo-600' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', activeBg: 'bg-orange-600' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-700', activeBg: 'bg-slate-700' },
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit as any)} className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-56 shrink-0">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-2 lg:sticky lg:top-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Sections</h4>
                    <div className="space-y-1">
                        {SECTIONS.map((section) => {
                            const isActive = activeSection === section.id;
                            const Icon = section.icon;
                            const colors = colorClasses[section.color];
                            const hasSubItems = section.id === 'academic' || section.id === 'documents';

                            return (
                                <div key={section.id}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${isActive ? `${colors.activeBg} text-white shadow-sm` : `hover:bg-slate-50 text-slate-700`}`}
                                    >
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : colors.bg}`}>
                                            <Icon size={12} className={isActive ? 'text-white' : colors.text} />
                                        </div>
                                        <span className={`text-xs font-medium truncate ${isActive ? 'text-white' : ''}`}>{section.label}</span>
                                        {isActive && <ChevronRight size={12} className="ml-auto text-white/70" />}
                                    </button>

                                    {/* Academic Sub-buttons */}
                                    {section.id === 'academic' && isActive && (
                                        <div className="ml-4 mt-1 pl-5 border-l-2 border-blue-200 space-y-1">
                                            <button type="button" onClick={() => setAcademicSubTab('class10')} className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${academicSubTab === 'class10' ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                Class 10
                                            </button>
                                            <button type="button" onClick={() => setAcademicSubTab('class12')} className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${academicSubTab === 'class12' ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                Class 12
                                            </button>
                                            <button type="button" onClick={() => setAcademicSubTab('scorecard')} className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${academicSubTab === 'scorecard' ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                Scorecard
                                            </button>
                                        </div>
                                    )}

                                    {/* Documents Sub-buttons */}
                                    {section.id === 'documents' && isActive && (
                                        <div className="ml-4 mt-1 pl-5 border-l-2 border-slate-200 space-y-1">
                                            <button type="button" onClick={() => setDocumentsSubTab('upload')} className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${documentsSubTab === 'upload' ? 'bg-slate-200 text-slate-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                Upload
                                            </button>
                                            <button type="button" onClick={() => setDocumentsSubTab('takeover')} className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${documentsSubTab === 'takeover' ? 'bg-slate-200 text-slate-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                Physical Docs
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                {/* Student Info */}
                {activeSection === 'student-info' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-teal-50/50 px-4 py-3 border-b border-teal-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center">
                                <User size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Student Information</h3>
                                <p className="text-xs text-slate-500">Basic details and contact</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Student Name <span className="text-red-500">*</span></Label>
                                    <Input {...register('studentName')} placeholder="Full Name" className={STANDARD_INPUT_STYLE} />
                                    {errors.studentName && <p className="text-xs text-red-500">{errors.studentName.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Gender</Label>
                                    <Controller name="gender" control={control} render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Phone size={10} /> Mobile <span className="text-red-500">*</span></Label>
                                    <Input {...register('mobile')} placeholder="10-digit" className={STANDARD_INPUT_STYLE} />
                                    {errors.mobile && <p className="text-xs text-red-500">{errors.mobile.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Mail size={10} /> Email <span className="text-red-500">*</span></Label>
                                    <Input {...register('email')} placeholder="email@example.com" className={STANDARD_INPUT_STYLE} />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Date of Birth <span className="text-red-500">*</span></Label>
                                    <Input type="date" {...register('dateOfBirth')} className={STANDARD_INPUT_STYLE} />
                                    {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Family & Address */}
                {activeSection === 'family-address' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-purple-50/50 px-4 py-3 border-b border-purple-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
                                <Users size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Family & Address</h3>
                                <p className="text-xs text-slate-500">Parents and location</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Father */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Father's Info</h4>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-600">Name <span className="text-red-500">*</span></Label>
                                        <Input {...register('fatherName')} placeholder="Father's Name" className={STANDARD_INPUT_STYLE} />
                                        {errors.fatherName && <p className="text-xs text-red-500">{errors.fatherName.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-600">Occupation</Label>
                                        <Input {...register('fatherOccupation')} placeholder="Occupation" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-600">Mobile</Label>
                                        <Input {...register('fatherMobile')} placeholder="Mobile" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                </div>
                                {/* Mother */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Mother's Info</h4>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-600">Name <span className="text-red-500">*</span></Label>
                                        <Input {...register('motherName')} placeholder="Mother's Name" className={STANDARD_INPUT_STYLE} />
                                        {errors.motherName && <p className="text-xs text-red-500">{errors.motherName.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-600">Occupation</Label>
                                        <Input {...register('motherOccupation')} placeholder="Occupation" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-600">Mobile</Label>
                                        <Input {...register('motherMobile')} placeholder="Mobile" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                </div>
                            </div>
                            {/* Address */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><MapPin size={10} /> Permanent Address <span className="text-red-500">*</span></Label>
                                    <Input {...register('permanentAddress')} placeholder="Full Address" className={STANDARD_INPUT_STYLE} />
                                    {errors.permanentAddress && <p className="text-xs text-red-500">{errors.permanentAddress.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-600">City</Label>
                                        <Input {...register('familyPlace')} placeholder="City" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-600">State</Label>
                                        <Select onValueChange={(val) => setValue('familyState', val)} value={watch('familyState') || undefined}>
                                            <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Academic Details */}
                {activeSection === 'academic' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                                <GraduationCap size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Academic Details</h3>
                                <p className="text-xs text-slate-500">Class 10, 12 & marks</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-6">
                            {/* Gap Year */}
                            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Controller name="gapYear" control={control} render={({ field }) => (
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} id="gapYear" />
                                    )} />
                                    <Label htmlFor="gapYear" className="text-xs font-medium cursor-pointer">Gap Year?</Label>
                                </div>
                                {watch('gapYear') && (
                                    <div className="flex items-center gap-2">
                                        <Input type="number" {...register('gapYearFrom')} className={STANDARD_INPUT_STYLE + " w-20"} placeholder="From" />
                                        <span className="text-slate-400">-</span>
                                        <Input type="number" {...register('gapYearTo')} className={STANDARD_INPUT_STYLE + " w-20"} placeholder="To" />
                                    </div>
                                )}
                            </div>

                            {/* Class 10 */}
                            {academicSubTab === 'class10' && (
                                <div className="bg-white border rounded-lg overflow-hidden border-slate-200 relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
                                        <span className="text-xs font-bold text-slate-700">● HSLC (Class 10)</span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-2 space-y-1.5">
                                                <Label className="text-xs text-slate-600">School</Label>
                                                <Input {...register('class10SchoolName')} className={STANDARD_INPUT_STYLE} placeholder="School Name" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">Board</Label>
                                                <Select onValueChange={(val) => setValue('class10Board', val)} value={watch('class10Board') || undefined}>
                                                    <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        {SCHOOL_BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">Year of Passing</Label>
                                                <Input {...register('class10PassingYear')} className={STANDARD_INPUT_STYLE} placeholder="YYYY" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">Percentage</Label>
                                                <Input type="number" step="0.01" {...register('class10Percentage')} className={STANDARD_INPUT_STYLE} placeholder="%" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">City</Label>
                                                <Input {...register('class10Place')} className={STANDARD_INPUT_STYLE} placeholder="City" />
                                            </div>
                                            <div className="sm:col-span-2 space-y-1.5">
                                                <Label className="text-xs text-slate-600">State</Label>
                                                <Select onValueChange={(val) => setValue('class10State', val)} value={watch('class10State') || undefined}>
                                                    <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Class 12 */}
                            {academicSubTab === 'class12' && (
                                <div className="bg-white border rounded-lg overflow-hidden border-blue-200 relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="bg-blue-50 px-3 py-2 border-b border-blue-100">
                                        <span className="text-xs font-bold text-blue-900">● HSSLC (Class 12)</span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-2 space-y-1.5">
                                                <Label className="text-xs text-slate-600">School</Label>
                                                <Input {...register('schoolName')} className={BLUE_INPUT_STYLE} placeholder="School Name" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">Board</Label>
                                                <Select onValueChange={(val) => setValue('schoolBoard', val)} value={watch('schoolBoard') || undefined}>
                                                    <SelectTrigger className={BLUE_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        {SCHOOL_BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">Year of Passing</Label>
                                                <Input {...register('class12PassingYear')} className={BLUE_INPUT_STYLE} placeholder="YYYY" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">Percentage</Label>
                                                <Input type="number" step="0.01" {...register('class12Percentage')} className={BLUE_INPUT_STYLE} placeholder="%" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">City</Label>
                                                <Input {...register('schoolPlace')} className={BLUE_INPUT_STYLE} placeholder="City" />
                                            </div>
                                            <div className="sm:col-span-2 space-y-1.5">
                                                <Label className="text-xs text-slate-600">State</Label>
                                                <Select onValueChange={(val) => setValue('schoolState', val)} value={watch('schoolState') || undefined}>
                                                    <SelectTrigger className={BLUE_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Science Scorecard */}
                            {academicSubTab === 'scorecard' && (
                                <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Science Scorecard</h4>
                                        <span className="text-[10px] text-slate-500 bg-white border px-1.5 py-0.5 rounded">Auto-calc</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-4">
                                            <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                                                <Label className="text-[9px] text-green-700 font-bold uppercase block">PCB %</Label>
                                                <div className="text-sm font-bold text-green-700">{watch('pcbPercentage') || '-'}%</div>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                                                <Label className="text-[9px] text-blue-700 font-bold uppercase block">PCM %</Label>
                                                <div className="text-sm font-bold text-blue-700">{watch('pcmPercentage') || '-'}%</div>
                                            </div>
                                            <div className="col-span-2 sm:col-span-4 grid grid-cols-4 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] text-slate-500 uppercase">Phy</Label>
                                                    <Input type="number" {...register('physicsMarks')} className="h-8 text-xs" placeholder="Mk" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] text-slate-500 uppercase">Chem</Label>
                                                    <Input type="number" {...register('chemistryMarks')} className="h-8 text-xs" placeholder="Mk" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] text-slate-500 uppercase">Bio</Label>
                                                    <Input type="number" {...register('biologyMarks')} className="h-8 text-xs" placeholder="Mk" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] text-slate-500 uppercase">Math</Label>
                                                    <Input type="number" {...register('mathsMarks')} className="h-8 text-xs" placeholder="Mk" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pt-3 border-t border-slate-100">
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-xs font-medium text-slate-700">Previous NEET</Label>
                                                <Input type="number" {...register('previousNeetMarks')} className={STANDARD_INPUT_STYLE} placeholder="Score" />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-xs font-medium text-slate-700">Present NEET</Label>
                                                <Input type="number" {...register('presentNeetMarks')} className={STANDARD_INPUT_STYLE} placeholder="Score" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Study Preferences */}
                {activeSection === 'preferences' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center">
                                <BookOpen size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Study Preferences</h3>
                                <p className="text-xs text-slate-500">Course and location choices</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs text-slate-600">Course</Label>
                                        <Input {...register(`preferences.${index}.courseName`)} placeholder="e.g. MBBS" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs text-slate-600">Location (comma separated)</Label>
                                        <Input {...register(`preferences.${index}.location`)} placeholder="e.g. Bangalore, Delhi" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <div className="w-16 space-y-1.5">
                                        <Label className="text-xs text-slate-600">Priority</Label>
                                        <Input type="number" {...register(`preferences.${index}.priority`)} className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ courseName: '', location: '', priority: fields.length + 1 })}
                                className="text-teal-600 border-teal-200 hover:bg-teal-50"
                            >
                                <Plus size={14} className="mr-1" /> Add Preference
                            </Button>
                            {errors.preferences && <p className="text-xs text-red-500">{errors.preferences.message}</p>}
                        </div>
                    </div>
                )}

                {/* Registration & Payment */}
                {activeSection === 'payment' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-orange-50/50 px-4 py-3 border-b border-orange-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                <Wallet size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Registration & Payment</h3>
                                <p className="text-xs text-slate-500">Fee and payment details</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Registration Fee</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                                        <Input type="number" {...register('registrationFee')} className={STANDARD_INPUT_STYLE + " pl-7"} />
                                    </div>
                                    {errors.registrationFee && <p className="text-xs text-red-500">{errors.registrationFee.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Payment Method</Label>
                                    <Controller name="paymentMethod" control={control} render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cash">Cash</SelectItem>
                                                <SelectItem value="Card">Card</SelectItem>
                                                <SelectItem value="UPI">UPI</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Payment Status</Label>
                                    <Controller name="paymentStatus" control={control} render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Paid">Paid</SelectItem>
                                                <SelectItem value="Pending">Pending</SelectItem>
                                                <SelectItem value="Partial">Partial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 w-fit">
                                <Controller name="needsLoan" control={control} render={({ field }) => (
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="needsLoan" />
                                )} />
                                <Label htmlFor="needsLoan" className="text-xs font-medium cursor-pointer">Needs Education Loan</Label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents */}
                {activeSection === 'documents' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center">
                                <FileText size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Documents</h3>
                                <p className="text-xs text-slate-500">Upload and manage documents</p>
                            </div>
                        </div>
                        <div className="p-4">
                            {documentsSubTab === 'upload' && (
                                <DocumentUpload
                                    registrationId={initialData?.id || undefined}
                                    studentName={watch('studentName')}
                                    initialDocuments={prefilledDocs.length > 0 ? prefilledDocs : (initialData?.documents || [])}
                                    onDocumentsChange={(docs) => setValue('documents', docs)}
                                    readOnly={false}
                                    variant="minimal"
                                />
                            )}
                            {documentsSubTab === 'takeover' && (
                                <DocumentTakeover
                                    control={control}
                                    register={register}
                                    setValue={setValue}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isLoading} className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm">
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                                Updating...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save size={16} />
                                Save Changes
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
