'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDIAN_STATES, SCHOOL_BOARDS } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Enquiry } from '@/lib/types';
import { User, GraduationCap, Users, BookOpen, Phone, Mail, MapPin, Check, Settings, Save, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';

const STANDARD_INPUT_STYLE = "h-10 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md text-sm";
const BLUE_INPUT_STYLE = "h-10 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-md text-sm";

// Section configuration
const SECTIONS = [
    {
        id: 'student-details',
        label: 'Student Details',
        icon: User,
        color: 'teal',
        fields: ['date', 'candidateName', 'mobile', 'email', 'gender', 'dob', 'caste', 'religion'],
    },
    {
        id: 'family-address',
        label: 'Family & Address',
        icon: Users,
        color: 'purple',
        fields: ['fatherName', 'motherName', 'fatherOccupation', 'motherOccupation', 'fatherMobile', 'motherMobile', 'permanentAddress', 'familyPlace', 'familyState'],
    },
    {
        id: 'academic-profile',
        label: 'Academic Profile',
        icon: GraduationCap,
        color: 'blue',
        fields: ['courseInterested', 'schoolName', 'stream', 'schoolBoard', 'class12PassingYear', 'class12Percentage', 'schoolPlace', 'schoolState', 'class10SchoolName', 'class10Board', 'class10PassingYear', 'class10Percentage', 'class10Place', 'class10State'],
    },
    {
        id: 'preferences',
        label: 'Preferences',
        icon: Settings,
        color: 'orange',
        fields: ['preferredLocations', 'otherLocation', 'paymentAmount'],
    },
];

const enquirySchema = z.object({
    date: z.string().min(1, "Date is required"),
    schoolName: z.string().min(1, "School Name is required"),
    stream: z.enum(['Science', 'Commerce', 'Arts']),
    candidateName: z.string().min(1, "Candidate Name is required"),
    courseInterested: z.string().min(1, "Course is required"),
    mobile: z.string().min(10, "Valid mobile number is required"),
    email: z.string().email("Valid email is required"),
    fatherName: z.string().min(1, "Father's Name is required"),
    motherName: z.string().min(1, "Mother's Name is required"),
    fatherOccupation: z.string().optional(),
    motherOccupation: z.string().optional(),
    fatherMobile: z.string().optional(),
    motherMobile: z.string().optional(),
    permanentAddress: z.string().min(1, "Address is required"),
    class12PassingYear: z.string().optional(),
    class10Percentage: z.coerce.number().optional(),
    class12Percentage: z.coerce.number().optional(),
    schoolBoard: z.string().optional(),
    schoolPlace: z.string().optional(),
    schoolState: z.string().optional(),
    class10SchoolName: z.string().optional(),
    class10Board: z.string().optional(),
    class10PassingYear: z.string().optional(),
    class10Place: z.string().optional(),
    class10State: z.string().optional(),
    familyPlace: z.string().optional(),
    familyState: z.string().optional(),
    gender: z.string().optional(),
    dob: z.string().optional(),
    caste: z.string().optional(),
    religion: z.string().optional(),
    gapYearFrom: z.coerce.number().optional(),
    gapYearTo: z.coerce.number().optional(),
    pcbPercentage: z.coerce.number().optional(),
    pcmPercentage: z.coerce.number().optional(),
    physicsMarks: z.coerce.number().optional(),
    mathsMarks: z.coerce.number().optional(),
    chemistryMarks: z.coerce.number().optional(),
    biologyMarks: z.coerce.number().optional(),
    previousNeetMarks: z.coerce.number().optional(),
    presentNeetMarks: z.coerce.number().optional(),
    gapYear: z.boolean().default(false),
    collegeDropout: z.boolean().default(false),
    preferredLocations: z.array(z.string()).optional(),
    otherLocation: z.string().optional(),
    paymentAmount: z.coerce.number().optional(),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

interface ProfileEnquiryFormProps {
    initialData?: Enquiry;
    onSubmit: (data: EnquiryFormValues) => void;
    isLoading: boolean;
}

export function ProfileEnquiryForm({ initialData, onSubmit, isLoading }: ProfileEnquiryFormProps) {
    const [activeSection, setActiveSection] = useState('student-details');
    const [academicSubTab, setAcademicSubTab] = useState<'class10' | 'class12' | 'scorecard'>('class10');

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, dirtyFields },
    } = useForm<EnquiryFormValues>({
        // @ts-ignore
        resolver: zodResolver(enquirySchema),
        defaultValues: initialData ? {
            ...initialData,
            date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        } : {
            date: new Date().toISOString().split('T')[0],
            gapYear: false,
            collegeDropout: false,
            stream: 'Science',
        },
    });

    const formValues = watch();
    const selectedStream = watch('stream');
    const physicsMarks = watch('physicsMarks');
    const chemistryMarks = watch('chemistryMarks');
    const biologyMarks = watch('biologyMarks');
    const mathsMarks = watch('mathsMarks');

    // Calculate section completion
    const sectionProgress = useMemo(() => {
        const progress: Record<string, number> = {};
        SECTIONS.forEach((section) => {
            const filledFields = section.fields.filter((field) => {
                const value = formValues[field as keyof EnquiryFormValues];
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'number') return !isNaN(value) && value !== 0;
                return !!value && String(value).trim() !== '';
            });
            progress[section.id] = section.fields.length > 0 ? Math.round((filledFields.length / section.fields.length) * 100) : 0;
        });
        return progress;
    }, [formValues]);

    // Auto-calculate percentages
    useEffect(() => {
        if (physicsMarks && chemistryMarks && biologyMarks) {
            const pcb = (Number(physicsMarks) + Number(chemistryMarks) + Number(biologyMarks)) / 3;
            setValue('pcbPercentage', parseFloat(pcb.toFixed(2)));
        } else {
            setValue('pcbPercentage', undefined);
        }
    }, [physicsMarks, chemistryMarks, biologyMarks, setValue]);

    useEffect(() => {
        if (physicsMarks && chemistryMarks && mathsMarks) {
            const pcm = (Number(physicsMarks) + Number(chemistryMarks) + Number(mathsMarks)) / 3;
            setValue('pcmPercentage', parseFloat(pcm.toFixed(2)));
        } else {
            setValue('pcmPercentage', undefined);
        }
    }, [physicsMarks, chemistryMarks, mathsMarks, setValue]);

    const colorClasses: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
        teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', activeBg: 'bg-teal-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', activeBg: 'bg-purple-600' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', activeBg: 'bg-blue-600' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', activeBg: 'bg-orange-600' },
    };

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data as any))} className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-56 shrink-0">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-2 lg:sticky lg:top-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Sections</h4>
                    <div className="space-y-1">
                        {SECTIONS.map((section) => {
                            const isActive = activeSection === section.id;
                            const isComplete = sectionProgress[section.id] === 100;
                            const Icon = section.icon;
                            const colors = colorClasses[section.color];

                            return (
                                <div key={section.id}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${isActive
                                            ? `${colors.activeBg} text-white shadow-sm`
                                            : `hover:bg-slate-50 text-slate-700`
                                            }`}
                                    >
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : isComplete ? 'bg-green-100 text-green-600' : colors.bg
                                            }`}>
                                            {isComplete && !isActive ? <Check size={14} /> : <Icon size={14} className={isActive ? 'text-white' : colors.text} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>{section.label}</p>
                                            {isComplete && !isActive && <p className="text-[10px] text-green-600">Complete</p>}
                                        </div>
                                        {isActive && <ChevronRight size={14} className="text-white/70" />}
                                    </button>

                                    {/* Academic Profile Sub-buttons */}
                                    {section.id === 'academic-profile' && isActive && (
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
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                {/* Student Details Section */}
                {activeSection === 'student-details' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-teal-50/50 px-4 py-3 border-b border-teal-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center">
                                <User size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Student Details</h3>
                                <p className="text-xs text-slate-500">Personal information and contact</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Enquiry Date <span className="text-red-500">*</span></Label>
                                    <Input type="date" {...register('date')} className={STANDARD_INPUT_STYLE} />
                                    {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                                </div>
                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Candidate Name <span className="text-red-500">*</span></Label>
                                    <Input {...register('candidateName')} placeholder="Full Name" className={STANDARD_INPUT_STYLE} />
                                    {errors.candidateName && <p className="text-xs text-red-500">{errors.candidateName.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Phone size={12} /> Mobile <span className="text-red-500">*</span></Label>
                                    <Input {...register('mobile')} placeholder="10-digit number" className={STANDARD_INPUT_STYLE} />
                                    {errors.mobile && <p className="text-xs text-red-500">{errors.mobile.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Mail size={12} /> Email <span className="text-red-500">*</span></Label>
                                    <Input type="email" {...register('email')} placeholder="email@example.com" className={STANDARD_INPUT_STYLE} />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Gender</Label>
                                    <Controller
                                        name="gender"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Date of Birth</Label>
                                    <Input type="date" {...register('dob')} className={STANDARD_INPUT_STYLE} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Caste</Label>
                                    <Controller
                                        name="caste"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="General">General</SelectItem>
                                                    <SelectItem value="OBC">OBC</SelectItem>
                                                    <SelectItem value="MOBC">MOBC</SelectItem>
                                                    <SelectItem value="SC">SC</SelectItem>
                                                    <SelectItem value="ST">ST</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600">Religion</Label>
                                    <Controller
                                        name="religion"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Hindu">Hindu</SelectItem>
                                                    <SelectItem value="Christian">Christian</SelectItem>
                                                    <SelectItem value="Muslim">Muslim</SelectItem>
                                                    <SelectItem value="Sikh">Sikh</SelectItem>
                                                    <SelectItem value="Jain">Jain</SelectItem>
                                                    <SelectItem value="Buddhist">Buddhist</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Family & Address Section */}
                {activeSection === 'family-address' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-purple-50/50 px-4 py-3 border-b border-purple-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
                                <Users size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Family & Address</h3>
                                <p className="text-xs text-slate-500">Guardian and location details</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-6">
                            {/* Parents Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Father */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Father's Info</h4>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">Name <span className="text-red-500">*</span></Label>
                                        <Input {...register('fatherName')} placeholder="Father's Name" className={STANDARD_INPUT_STYLE} />
                                        {errors.fatherName && <p className="text-xs text-red-500">{errors.fatherName.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">Occupation</Label>
                                        <Input {...register('fatherOccupation')} placeholder="Occupation" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">Mobile</Label>
                                        <Input {...register('fatherMobile')} placeholder="Mobile Number" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                </div>
                                {/* Mother */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Mother's Info</h4>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">Name <span className="text-red-500">*</span></Label>
                                        <Input {...register('motherName')} placeholder="Mother's Name" className={STANDARD_INPUT_STYLE} />
                                        {errors.motherName && <p className="text-xs text-red-500">{errors.motherName.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">Occupation</Label>
                                        <Input {...register('motherOccupation')} placeholder="Occupation" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">Mobile</Label>
                                        <Input {...register('motherMobile')} placeholder="Mobile Number" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                </div>
                            </div>
                            {/* Address */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><MapPin size={12} /> Permanent Address <span className="text-red-500">*</span></Label>
                                    <Input {...register('permanentAddress')} placeholder="Street, Colony, House No." className={STANDARD_INPUT_STYLE} />
                                    {errors.permanentAddress && <p className="text-xs text-red-500">{errors.permanentAddress.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">City / Place</Label>
                                        <Input {...register('familyPlace')} placeholder="City" className={STANDARD_INPUT_STYLE} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">State</Label>
                                        <Controller
                                            name="familyState"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Academic Profile Section */}
                {activeSection === 'academic-profile' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                                <GraduationCap size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Academic Profile</h3>
                                <p className="text-xs text-slate-500">Education history and marks</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-6">
                            {/* Course Interest */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><BookOpen size={12} /> Course Interested <span className="text-red-500">*</span></Label>
                                        <Controller
                                            name="courseInterested"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MBBS">MBBS</SelectItem>
                                                        <SelectItem value="BDS">BDS</SelectItem>
                                                        <SelectItem value="Engineering">Engineering</SelectItem>
                                                        <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                                                        <SelectItem value="Nursing">Nursing</SelectItem>
                                                        <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.courseInterested && <p className="text-xs text-red-500">{errors.courseInterested.message}</p>}
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200">
                                            <Controller name="gapYear" control={control} render={({ field }) => (
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="gapYear" />
                                            )} />
                                            <Label htmlFor="gapYear" className="cursor-pointer text-xs font-medium text-slate-700">Gap Year?</Label>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200">
                                            <Controller name="collegeDropout" control={control} render={({ field }) => (
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="collegeDropout" />
                                            )} />
                                            <Label htmlFor="collegeDropout" className="cursor-pointer text-xs font-medium text-slate-700">Dropout?</Label>
                                        </div>
                                    </div>
                                    {watch('gapYear') && (
                                        <div className="flex items-end gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-slate-500">From</Label>
                                                <Input type="number" {...register('gapYearFrom')} className={STANDARD_INPUT_STYLE + " w-20"} placeholder="YYYY" />
                                            </div>
                                            <span className="pb-2 text-slate-400">-</span>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-slate-500">To</Label>
                                                <Input type="number" {...register('gapYearTo')} className={STANDARD_INPUT_STYLE + " w-20"} placeholder="YYYY" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Class 10 & 12 Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                {/* HSLC Box */}
                                {academicSubTab === 'class10' && (
                                    <div className="bg-white border rounded-lg overflow-hidden border-slate-200 relative">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
                                            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> HSLC (Class 10)
                                            </span>
                                        </div>
                                        <div className="p-3 space-y-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">School Name</Label>
                                                <Input {...register('class10SchoolName')} className={STANDARD_INPUT_STYLE} placeholder="School" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">Board</Label>
                                                    <Controller name="class10Board" control={control} render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                            <SelectContent>{SCHOOL_BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    )} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">Year</Label>
                                                    <Input {...register('class10PassingYear')} className={STANDARD_INPUT_STYLE} placeholder="YYYY" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">Percentage</Label>
                                                    <Input type="number" step="0.01" {...register('class10Percentage')} className={STANDARD_INPUT_STYLE} placeholder="%" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">City</Label>
                                                    <Input {...register('class10Place')} className={STANDARD_INPUT_STYLE} placeholder="City" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">State</Label>
                                                <Controller name="class10State" control={control} render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger className={STANDARD_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* HSSLC Box */}
                                {academicSubTab === 'class12' && (
                                    <div className="bg-white border rounded-lg overflow-hidden border-blue-200 relative">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                        <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-blue-900 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> HSSLC (Class 12)
                                            </span>
                                            <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Higher Sec</span>
                                        </div>
                                        <div className="p-3 space-y-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-600">School Name <span className="text-red-500">*</span></Label>
                                                <Input {...register('schoolName')} className={BLUE_INPUT_STYLE} placeholder="School" />
                                                {errors.schoolName && <p className="text-xs text-red-500">{errors.schoolName.message}</p>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">Board</Label>
                                                    <Controller name="schoolBoard" control={control} render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className={BLUE_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                            <SelectContent>{SCHOOL_BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    )} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">Stream <span className="text-red-500">*</span></Label>
                                                    <Controller name="stream" control={control} render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className={BLUE_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Science">Science</SelectItem>
                                                                <SelectItem value="Commerce">Commerce</SelectItem>
                                                                <SelectItem value="Arts">Arts</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">Year</Label>
                                                    <Input {...register('class12PassingYear')} className={BLUE_INPUT_STYLE} placeholder="YYYY" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">Percentage</Label>
                                                    <Input type="number" step="0.01" {...register('class12Percentage')} className={BLUE_INPUT_STYLE} placeholder="%" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">City</Label>
                                                    <Input {...register('schoolPlace')} className={BLUE_INPUT_STYLE} placeholder="City" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-600">State</Label>
                                                    <Controller name="schoolState" control={control} render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className={BLUE_INPUT_STYLE}><SelectValue placeholder="Select" /></SelectTrigger>
                                                            <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Science Marks Scorecard */}
                            {selectedStream === 'Science' && academicSubTab === 'scorecard' && (
                                <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Science Scorecard</h4>
                                        <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">Auto-calc</span>
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

                {/* Preferences Section */}
                {activeSection === 'preferences' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-orange-50/50 px-4 py-3 border-b border-orange-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Preferences & Payment</h3>
                                <p className="text-xs text-slate-500">Location and budget preferences</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-700">Preferred Education Hubs</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Mumbai', 'Pune', 'Kota', 'Overseas'].map((city) => (
                                        <Controller
                                            key={city}
                                            name="preferredLocations"
                                            control={control}
                                            render={({ field }) => {
                                                const currentVal = Array.isArray(field.value) ? field.value : [];
                                                const isChecked = currentVal.includes(city);
                                                return (
                                                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                                                        <Checkbox
                                                            id={`loc-${city}`}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    field.onChange([...currentVal, city]);
                                                                } else {
                                                                    field.onChange(currentVal.filter((c: string) => c !== city));
                                                                }
                                                            }}
                                                        />
                                                        <Label htmlFor={`loc-${city}`} className="text-xs font-normal cursor-pointer text-slate-700">{city}</Label>
                                                    </div>
                                                );
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">Other Location</Label>
                                    <Input {...register('otherLocation')} placeholder="E.g. Kolkata, Guwahati" className={STANDARD_INPUT_STYLE} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">Budget / Payment Limit</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                                        <Input type="number" {...register('paymentAmount')} placeholder="0.00" className={STANDARD_INPUT_STYLE + " pl-7"} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isLoading} className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm">
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                                Saving...
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
