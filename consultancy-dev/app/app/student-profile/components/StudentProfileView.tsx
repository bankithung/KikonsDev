'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Wallet, FileText, UserCircle, GraduationCap, Phone, Mail, MapPin, Calendar, Clock, CheckCircle, Plus, Pencil } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { EnquiryForm } from '@/app/app/enquiries/components/EnquiryForm';
import { ProfileEnquiryForm } from './ProfileEnquiryForm';
import { RegistrationForm } from '@/app/app/registrations/components/RegistrationForm';
import { ProfileRegistrationForm } from './ProfileRegistrationForm';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { PaymentHistory } from './PaymentHistory';
import { DocumentList } from './DocumentList';
import { Enquiry, Registration, Enrollment, StudentDocument } from '@/lib/types';
import { format } from 'date-fns';
import { useState as useReactState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { PhysicalDocumentModal } from '@/components/common/PhysicalDocumentModal';
import { EnrollmentEditModal } from './EnrollmentEditModal';
import { RefundHistory } from './RefundHistory';
import { StudentRemarkList } from './StudentRemarkList';

interface StudentProfileViewProps {
    type: string;
    id: string;
}

// Compact helper for sidebar details
const SidebarDetail = ({ icon: Icon, value, label }: { icon: any, value: string | null | undefined, label?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 text-sm">
            <Icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="flex flex-col">
                <span className="text-slate-700 font-medium leading-tight break-all">{value}</span>
                {label && <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>}
            </div>
        </div>
    );
};

// Helper for main content details
const DetailRow = ({ label, value, icon: Icon, className = "" }: { label: string, value: React.ReactNode, icon?: any, className?: string }) => (
    <div className={`flex flex-col min-w-0 ${className}`}>
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-1.5 mb-0.5 shrink-0">
            {Icon && <Icon size={10} className="text-slate-400 shrink-0" />}
            <span className="truncate">{label}</span>
        </div>
        <div className="text-sm font-medium text-slate-800 leading-snug break-words" title={typeof value === 'string' ? value : ''}>
            {value || <span className="text-slate-300 italic text-xs">N/A</span>}
        </div>
    </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
    <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-500" />}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{title}</h3>
    </div>
);

export function StudentProfileView({ type, id }: StudentProfileViewProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDocs, setSelectedDocs] = useReactState<number[]>([]);
    const [documentView, setDocumentView] = useState<'digital' | 'physical'>('digital');
    const [journeyView, setJourneyView] = useState<'enquiry' | 'registration' | 'enrollment'>('enquiry');
    const [showPhysicalDocModal, setShowPhysicalDocModal] = useState(false);
    const [showEditEnrollment, setShowEditEnrollment] = useState(false);

    // 1. Fetch Primary Record
    const { data: primaryRecord, isLoading: isLoadingPrimary } = useQuery({
        queryKey: [type, id],
        queryFn: async () => {
            if (type === 'enquiry') return apiClient.enquiries.get(id);
            if (type === 'registration') return apiClient.registrations.get(id);
            if (type === 'enrollment') {
                const all = await apiClient.enrollments.list();
                return all.find(e => e.id.toString() === id);
            }
            return null;
        },
    });

    const validData = !!primaryRecord;
    const isEnquiry = (data: any): data is Enquiry => validData && type === 'enquiry';
    const isRegistration = (data: any): data is Registration => validData && type === 'registration';
    const isEnrollment = (data: any): data is Enrollment => validData && type === 'enrollment';

    // 2. Derive IDs
    const enrollmentId = isEnrollment(primaryRecord) ? primaryRecord.id : null;
    const registrationIdStr = isEnrollment(primaryRecord) ? primaryRecord.studentId : (isRegistration(primaryRecord) ? primaryRecord.id : null);

    // 3. Fetch Registration
    const { data: relatedRegistration } = useQuery({
        queryKey: ['registration', registrationIdStr],
        queryFn: () => apiClient.registrations.get(registrationIdStr!),
        enabled: !!registrationIdStr && type === 'enrollment',
    });
    const registrationData = isRegistration(primaryRecord) ? primaryRecord : relatedRegistration;

    // 4. Derive/Fetch Enquiry
    const enquiryId = isEnquiry(primaryRecord) ? primaryRecord.id : registrationData?.enquiry;
    const { data: relatedEnquiry } = useQuery({
        queryKey: ['enquiry', enquiryId],
        queryFn: () => apiClient.enquiries.get(enquiryId!.toString()),
        enabled: !!enquiryId && type !== 'enquiry',
    });
    const enquiryData = isEnquiry(primaryRecord) ? primaryRecord : relatedEnquiry;

    // Student Name
    const studentName = (isEnrollment(primaryRecord) ? primaryRecord.studentName : null) ||
        (registrationData ? registrationData.studentName : null) ||
        (enquiryData ? enquiryData.candidateName : null) || 'Student';

    // Mutations
    const updateEnquiryMutation = useMutation({
        mutationFn: (data: any) => apiClient.enquiries.update(enquiryData!.id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['enquiry'] }); toast.success('Updated'); },
        onError: () => toast.error('Failed to update')
    });
    const updateRegistrationMutation = useMutation({
        mutationFn: (data: any) => apiClient.registrations.update(registrationData!.id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['registration'] }); toast.success('Updated'); },
        onError: () => toast.error('Failed to update')
    });
    const returnDocsMutation = useMutation({
        mutationFn: (docIds: number[]) => apiClient.studentDocuments.returnDocs(docIds.map(String)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-documents'] });
            setSelectedDocs([]); toast.success('Returned');
        },
        onError: () => toast.error('Failed')
    });

    // Docs
    const { data: fetchedPhysicalDocs } = useQuery({
        queryKey: ['student-documents', registrationData?.id],
        queryFn: () => apiClient.studentDocuments.list(registrationData!.id),
        enabled: !!registrationData?.id
    });
    const physicalDocs = registrationData?.student_documents || fetchedPhysicalDocs;


    if (isLoadingPrimary) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
    if (!primaryRecord) return <div className="p-8 text-center text-slate-500">Record not found</div>;

    // Timeline Steps
    const steps = [
        { label: 'Enquiry', date: enquiryData?.date, status: enquiryData ? 'Completed' : 'Pending', active: !!enquiryData },
        { label: 'Registration', date: registrationData?.registrationDate, status: registrationData ? 'Completed' : 'Pending', active: !!registrationData },
        { label: 'Enrollment', date: isEnrollment(primaryRecord) ? primaryRecord.startDate : null, status: isEnrollment(primaryRecord) ? 'Active' : 'Pending', active: isEnrollment(primaryRecord) }
    ];

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-1 lg:px-6 lg:py-2 bg-slate-50/30 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <BackButton />
                <div className="flex gap-2 flex-wrap">
                    {type === 'enquiry' && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-sm text-xs sm:text-sm" onClick={() => router.push(`/app/registrations/new?enquiryId=${id}`)}>
                            <span className="hidden sm:inline">Convert to Registration</span>
                            <span className="sm:hidden">Convert</span>
                            <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )}
                    {type === 'registration' && (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 shadow-sm text-xs sm:text-sm" onClick={() => router.push(`/app/enrollments/new?regId=${id}`)}>
                            <span className="hidden sm:inline">Enroll Student</span>
                            <span className="sm:hidden">Enroll</span>
                            <GraduationCap className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">

                {/* --- SIDEBAR (Left Column) --- */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4">

                    {/* 1. Profile Card (Sticky-ish identity) */}
                    <Card className="border border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex flex-col items-center text-center">
                            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center text-white text-3xl font-bold shadow-inner mb-4 ring-2 ring-white/20">
                                {studentName.charAt(0)}
                            </div>
                            <h1 className="text-xl font-bold text-white leading-tight">{studentName}</h1>
                            <span className={`mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${type === 'enrollment' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                type === 'registration' ? 'bg-purple-500/20 text-purple-100 border-purple-500/30' :
                                    'bg-blue-500/20 text-blue-100 border-blue-500/30'
                                }`}>
                                {type}
                            </span>
                        </CardHeader>
                        <CardContent className="p-5 space-y-6">
                            {/* Contact Info */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <SidebarDetail icon={Phone} value={registrationData?.mobile || enquiryData?.mobile} label="Mobile" />
                                <SidebarDetail icon={Mail} value={registrationData?.email || enquiryData?.email} label="Email" />
                                <SidebarDetail icon={MapPin} value={registrationData?.permanentAddress || enquiryData?.permanentAddress} label="Address" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Personal Detail Card */}
                    <Card className="border border-slate-200 shadow-sm">
                        <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                            <SectionHeader title="Personal Details" icon={UserCircle} />
                        </CardHeader>
                        <CardContent className="p-3.5">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                <DetailRow label="Gender" value={registrationData?.gender || enquiryData?.gender} />
                                <DetailRow label="DOB" value={registrationData?.dateOfBirth ? format(new Date(registrationData.dateOfBirth), 'dd MMM yyyy') : (enquiryData?.dob ? format(new Date(enquiryData.dob), 'dd MMM yyyy') : null)} />
                                <DetailRow label="Caste" value={enquiryData?.caste} />
                                <DetailRow label="Religion" value={enquiryData?.religion} />

                                <div className="col-span-2 my-1 border-t border-slate-100"></div>

                                <div>
                                    <DetailRow label="Father" value={registrationData?.fatherName || enquiryData?.fatherName} />
                                    {(registrationData?.fatherOccupation || enquiryData?.fatherOccupation) && <div className="text-[10px] text-slate-400 font-medium pl-0.5 mt-0.5">{registrationData?.fatherOccupation || enquiryData?.fatherOccupation}</div>}
                                </div>
                                <div>
                                    <DetailRow label="Mother" value={registrationData?.motherName || enquiryData?.motherName} />
                                    {(registrationData?.motherOccupation || enquiryData?.motherOccupation) && <div className="text-[10px] text-slate-400 font-medium pl-0.5 mt-0.5">{registrationData?.motherOccupation || enquiryData?.motherOccupation}</div>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* --- MAIN CONTENT (Right Column) --- */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-4">

                    {/* 1. Progress Bar */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0">
                        {steps.map((step, idx) => (
                            <div key={idx} className={`flex items-center flex-1 ${idx < steps.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:mr-4 sm:pr-4' : ''}`}>
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-3 shrink-0 transition-colors ${step.active ? 'bg-teal-600 text-white shadow-md shadow-teal-200' : 'bg-slate-100 text-slate-300'}`}>
                                    {step.status === 'Active' || step.status === 'Completed' ? <CheckCircle size={14} className="text-white sm:w-4 sm:h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                </div>
                                <div>
                                    <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${step.active ? 'text-teal-700' : 'text-slate-400'}`}>{step.label}</p>
                                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{step.date ? format(new Date(step.date), 'dd MMM yyyy') : 'Pending'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 2. Tabs & Views */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="bg-white border border-slate-200 rounded-lg mb-4 shadow-sm overflow-x-auto">
                            <TabsList className="h-10 bg-white w-max min-w-full justify-start gap-2 sm:gap-6 px-2">
                                {['Overview', 'Values', 'Documents', 'Payments', 'Refunds', 'Remarks'].map((tab) => {
                                    if (tab === 'Values' && !(enquiryData || registrationData || isEnrollment(primaryRecord))) return null;
                                    if (tab === 'Remarks' && !registrationData) return null;
                                    const val = tab === 'Values' ? 'journey' : tab.toLowerCase();
                                    const label = tab === 'Values' ? 'Journey' : tab;
                                    return (
                                        <TabsTrigger
                                            key={val}
                                            value={val}
                                            className="h-10 rounded-none border-b-2 border-transparent px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 data-[state=active]:shadow-none transition-all whitespace-nowrap"
                                        >
                                            {label}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>

                        {/* Overview: Academic & Course */}
                        <TabsContent value="overview" className="space-y-4 focus-visible:outline-none mt-0">
                            {/* Course Banner */}
                            <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                    {/* Course Name */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                            <GraduationCap className="text-slate-400" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target Course</p>
                                            <p className="text-base sm:text-lg font-bold text-slate-800">{registrationData?.preferences?.[0]?.courseName || enquiryData?.courseInterested || 'Not Specified'}</p>
                                        </div>
                                    </div>
                                    {/* Details - inline on desktop, wrap on mobile */}
                                    <div className="flex flex-wrap items-start gap-x-6 gap-y-2 sm:border-l sm:border-slate-100 sm:pl-6">
                                        <DetailRow label="Preferred Locations" value={enquiryData?.preferredLocations?.length ? enquiryData.preferredLocations.join(', ') : (enquiryData?.otherLocation || null)} />
                                        <DetailRow label="Needs Loan" value={registrationData?.needsLoan ? 'Yes' : (registrationData?.needsLoan === false ? 'No' : null)} />
                                        <DetailRow label="College Dropout" value={enquiryData?.collegeDropout ? 'Yes' : (enquiryData?.collegeDropout === false ? 'No' : null)} />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Card */}
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                                    <SectionHeader title="Academic Background" icon={FileText} />
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                        {/* Class 10 */}
                                        <div className="p-5 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="h-2 w-2 rounded-full bg-teal-500" />
                                                <h4 className="text-sm font-bold text-slate-800">Class 10 (HSLC)</h4>
                                            </div>
                                            <DetailRow label="School" value={registrationData?.class10SchoolName || enquiryData?.class10SchoolName} />
                                            <div className="flex flex-wrap gap-8">
                                                <DetailRow label="Board" value={registrationData?.class10Board || enquiryData?.class10Board} />
                                                <DetailRow label="Year" value={registrationData?.class10PassingYear || enquiryData?.class10PassingYear} />
                                                <DetailRow label="Result" value={(registrationData?.class10Percentage || enquiryData?.class10Percentage) ? `${registrationData?.class10Percentage || enquiryData?.class10Percentage}%` : null} />
                                            </div>
                                            <DetailRow label="Location" value={[registrationData?.class10Place || enquiryData?.class10Place, registrationData?.class10State || enquiryData?.class10State].filter(Boolean).join(', ')} />
                                        </div>

                                        {/* Class 12 */}
                                        <div className="p-5 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                                <h4 className="text-sm font-bold text-slate-800">Class 12 (HSSLC)</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <DetailRow label="School" value={registrationData?.schoolName || enquiryData?.schoolName} />
                                                <DetailRow label="Stream" value={(registrationData as any)?.stream || enquiryData?.stream} />
                                            </div>
                                            <div className="flex flex-wrap gap-8">
                                                <DetailRow label="Board" value={registrationData?.schoolBoard || enquiryData?.schoolBoard} />
                                                <DetailRow label="Year" value={registrationData?.class12PassingYear || enquiryData?.class12PassingYear} />
                                                <DetailRow label="Result" value={(registrationData?.class12Percentage || enquiryData?.class12Percentage) ? `${registrationData?.class12Percentage || enquiryData?.class12Percentage}%` : null} />
                                            </div>
                                            <DetailRow label="Location" value={[registrationData?.schoolPlace || enquiryData?.schoolPlace, registrationData?.schoolState || enquiryData?.schoolState].filter(Boolean).join(', ')} />
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Group 1: Board/Subject Performance */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1 bg-indigo-100 rounded text-indigo-600"><FileText size={12} /></div>
                                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Subject Metrics</h4>
                                                </div>
                                                <div className="bg-white p-3 rounded border border-slate-100 shadow-sm space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <DetailRow label="PCB %" value={registrationData?.pcbPercentage || enquiryData?.pcbPercentage} />
                                                        <DetailRow label="PCM %" value={registrationData?.pcmPercentage || enquiryData?.pcmPercentage} />
                                                    </div>
                                                    <div className="border-t border-slate-50 pt-2 grid grid-cols-3 gap-2">
                                                        <DetailRow label="Physics" value={registrationData?.physicsMarks || enquiryData?.physicsMarks} />
                                                        <DetailRow label="Chem" value={registrationData?.chemistryMarks || enquiryData?.chemistryMarks} />
                                                        <DetailRow label="Bio" value={registrationData?.biologyMarks || enquiryData?.biologyMarks} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Group 2: Competitive Exams (NEET/JEE) */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1 bg-amber-100 rounded text-amber-600"><GraduationCap size={12} /></div>
                                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Competitive Exams</h4>
                                                </div>
                                                <div className="bg-white p-3 rounded border border-slate-100 shadow-sm space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <DetailRow
                                                            label="Previous NEET"
                                                            value={registrationData?.previousNeetMarks || enquiryData?.previousNeetMarks}
                                                            className="bg-slate-50 p-2 rounded"
                                                        />
                                                        <DetailRow
                                                            label="Current NEET"
                                                            value={registrationData?.presentNeetMarks || enquiryData?.presentNeetMarks}
                                                            className="bg-emerald-50/50 p-2 rounded border border-emerald-100/50"
                                                        />
                                                    </div>
                                                    {(registrationData?.gapYear || enquiryData?.gapYear) && (
                                                        <div className="flex items-center gap-2 text-[10px] bg-orange-50 text-orange-800 px-2 py-1.5 rounded border border-orange-100">
                                                            <Clock size={12} />
                                                            <span className="font-bold uppercase tracking-wide">Gap Year:</span>
                                                            <span className="font-medium">{registrationData?.gapYearFrom || enquiryData?.gapYearFrom} - {registrationData?.gapYearTo || enquiryData?.gapYearTo}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Journey Form */}
                        <TabsContent value="journey" className="mt-0 focus-visible:outline-none">
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-2 sm:py-3 px-3 sm:px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg flex-wrap gap-1">
                                        {enquiryData && <button onClick={() => setJourneyView('enquiry')} className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-md transition-all ${journeyView === 'enquiry' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Enquiry</button>}
                                        {registrationData && <button onClick={() => setJourneyView('registration')} className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-md transition-all ${journeyView === 'registration' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Registration</button>}
                                        {isEnrollment(primaryRecord) && <button onClick={() => setJourneyView('enrollment')} className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-md transition-all ${journeyView === 'enrollment' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Enrollment</button>}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    {journeyView === 'enquiry' && enquiryData && <ProfileEnquiryForm initialData={enquiryData} onSubmit={(data) => updateEnquiryMutation.mutate(data)} isLoading={updateEnquiryMutation.isPending} />}
                                    {journeyView === 'registration' && registrationData && <ProfileRegistrationForm initialData={registrationData} onSubmit={(data) => updateRegistrationMutation.mutate(data)} isLoading={updateRegistrationMutation.isPending} />}
                                    {journeyView === 'enrollment' && isEnrollment(primaryRecord) && (
                                        <div className="space-y-6">
                                            {/* Header with Edit */}
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md"><GraduationCap size={16} /></div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-800">Program Details</h4>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{primaryRecord.enrollmentNo}</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => setShowEditEnrollment(true)} className="h-7 text-xs text-slate-500 hover:text-teal-700 hover:bg-teal-50">
                                                    <Pencil size={12} className="mr-1.5" /> Edit Details
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                                {/* Left Column: Program Info */}
                                                <div className="space-y-4">
                                                    <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 space-y-4">
                                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Academic Info</h5>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <DetailRow label="University" value={primaryRecord.university} />
                                                            <DetailRow label="Program" value={primaryRecord.programName} />
                                                            <DetailRow label="Start Date" value={primaryRecord.startDate ? format(new Date(primaryRecord.startDate), 'dd MMM yyyy') : null} />
                                                            <DetailRow label="Duration" value={`${primaryRecord.durationMonths} Months`} />
                                                        </div>
                                                        <div className="pt-2 border-t border-slate-200/60">
                                                            <DetailRow label="Status" value={<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${primaryRecord.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{primaryRecord.status}</span>} />
                                                        </div>
                                                    </div>

                                                    {/* Loan Info if applicable */}
                                                    {primaryRecord.loanRequired && (
                                                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Education Loan</p>
                                                                <p className="text-sm font-bold text-blue-900">Required</p>
                                                            </div>
                                                            {primaryRecord.loanAmount && <span className="text-sm font-semibold text-blue-700">₹{primaryRecord.loanAmount.toLocaleString()}</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Column: Fees */}
                                                <div className="space-y-4">
                                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fee Structure</h5>
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">{primaryRecord.paymentType} Payment</span>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">Service Charge</span>
                                                                <span className="font-medium text-slate-700">₹{primaryRecord.serviceCharge?.toLocaleString() || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">School Fees</span>
                                                                <span className="font-medium text-slate-700">₹{primaryRecord.schoolFees?.toLocaleString() || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">Hostel Fees</span>
                                                                <span className="font-medium text-slate-700">₹{primaryRecord.hostelFees?.toLocaleString() || 0}</span>
                                                            </div>
                                                            <div className="border-t border-slate-100 pt-2 flex justify-between items-center mt-2">
                                                                <span className="font-bold text-slate-800">Total Fees</span>
                                                                <span className="text-lg font-bold text-teal-600">₹{primaryRecord.totalFees?.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Installments Table (Only if Installment type) */}
                                            {primaryRecord.paymentType === 'Installment' && primaryRecord.installments && primaryRecord.installments.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Installment Schedule</h5>
                                                    <div className="overflow-hidden rounded-lg border border-slate-200">
                                                        <table className="w-full text-left text-sm">
                                                            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                                                                <tr>
                                                                    <th className="px-3 py-2">No</th>
                                                                    <th className="px-3 py-2">Due Date</th>
                                                                    <th className="px-3 py-2 text-right">Amount</th>
                                                                    <th className="px-3 py-2 text-center">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                                {primaryRecord.installments.map((inst) => (
                                                                    <tr key={inst.number}>
                                                                        <td className="px-3 py-2 font-medium text-slate-700">#{inst.number}</td>
                                                                        <td className="px-3 py-2 text-slate-500">{inst.dueDate ? format(new Date(inst.dueDate), 'dd MMM yyyy') : '-'}</td>
                                                                        <td className="px-3 py-2 text-right font-medium text-slate-700">₹{inst.amount.toLocaleString()}</td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${inst.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : inst.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{inst.status}</span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Documents */}
                        <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-2 sm:py-3 px-3 sm:px-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center space-y-0">
                                    <CardTitle className="text-xs sm:text-sm font-bold text-slate-700">Student Documents</CardTitle>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                        <button onClick={() => setDocumentView('digital')} className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-md transition-all ${documentView === 'digital' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}>Digital</button>
                                        <button onClick={() => setDocumentView('physical')} className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-md transition-all ${documentView === 'physical' ? 'bg-white shadow-sm text-amber-700' : 'text-slate-500'}`}>Physical</button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {documentView === 'digital' ? (
                                        <div className="p-3 sm:p-4"><DocumentList studentName={studentName} registrationId={registrationData?.id ? String(registrationData.id) : undefined} /></div>
                                    ) : (
                                        registrationData ? (
                                            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                                <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center bg-amber-50 p-2 sm:p-3 rounded-lg border border-amber-100">
                                                    <span className="text-[10px] sm:text-xs font-semibold text-amber-900">{physicalDocs?.filter((d: any) => d.status === 'Held').length || 0} docs held</span>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="ghost" className="h-6 sm:h-7 text-[10px] sm:text-xs hover:bg-amber-100 text-amber-800" onClick={() => setShowPhysicalDocModal(true)}><Plus size={10} className="mr-1" /> Add</Button>
                                                        {selectedDocs.length > 0 && <Button size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => returnDocsMutation.mutate(selectedDocs)} disabled={returnDocsMutation.isPending}>Return</Button>}
                                                    </div>
                                                </div>
                                                {/* Physical Table (Simplified) */}
                                                {physicalDocs && physicalDocs.length > 0 ? (
                                                    <table className="w-full text-left border-collapse">
                                                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                                                            <tr><th className="p-2 w-8"></th><th className="p-2">Name</th><th className="p-2">Ref</th><th className="p-2">Status</th></tr>
                                                        </thead>
                                                        <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                                                            {physicalDocs.map((doc: any) => (
                                                                <tr key={doc.id}>
                                                                    <td className="p-2 text-center">{doc.status === 'Held' && <Checkbox checked={selectedDocs.includes(doc.id)} onCheckedChange={(ch) => ch ? setSelectedDocs([...selectedDocs, doc.id]) : setSelectedDocs(selectedDocs.filter(i => i !== doc.id))} className="h-3 w-3" />}</td>
                                                                    <td className="p-2 font-medium">{doc.name}</td>
                                                                    <td className="p-2 text-slate-500">{doc.document_number || '-'}</td>
                                                                    <td className="p-2"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${doc.status === 'Held' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{doc.status}</span></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : <div className="text-center py-4 text-xs text-slate-400">No records</div>}
                                            </div>
                                        ) : <div className="p-4 text-center text-xs text-slate-500">Registration needed.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="payments" className="mt-0 focus-visible:outline-none">
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-3 px-4 border-b border-slate-100"><CardTitle className="text-sm font-bold">Payments</CardTitle></CardHeader>
                                <CardContent className="p-4"><PaymentHistory studentName={studentName} /></CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="refunds" className="mt-0 focus-visible:outline-none">
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-3 px-4 border-b border-slate-100"><CardTitle className="text-sm font-bold">Refund History</CardTitle></CardHeader>
                                <CardContent className="p-4"><RefundHistory studentName={studentName} /></CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="remarks" className="mt-0 focus-visible:outline-none">
                            <StudentRemarkList registrationId={registrationData?.id ? String(registrationData.id) : ''} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Modal */}
            {registrationData && (
                <PhysicalDocumentModal
                    open={showPhysicalDocModal}
                    onClose={() => setShowPhysicalDocModal(false)}
                    registrationId={Number(registrationData.id)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['student-documents'] });
                        queryClient.invalidateQueries({ queryKey: ['registration'] });
                    }}
                />
            )}

            {/* Edit Enrollment Modal */}
            {isEnrollment(primaryRecord) && (
                <EnrollmentEditModal
                    open={showEditEnrollment}
                    onClose={() => setShowEditEnrollment(false)}
                    initialData={primaryRecord}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['enrollment'] }); // Or type/id query key
                        queryClient.invalidateQueries({ queryKey: [type, id] });
                    }}
                />
            )}
        </div>
    );
}
