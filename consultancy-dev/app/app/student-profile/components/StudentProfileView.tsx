'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Wallet, FileText, UserCircle, GraduationCap, Phone, Mail, MapPin, Calendar, Clock, CheckCircle, Plus } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { EnquiryForm } from '@/app/app/enquiries/components/EnquiryForm';
import { RegistrationForm } from '@/app/app/registrations/components/RegistrationForm';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { PaymentHistory } from './PaymentHistory';
import { DocumentList } from './DocumentList';
import { Enquiry, Registration, Enrollment, StudentDocument } from '@/lib/types';
import { format } from 'date-fns';
import { useState as useReactState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { PhysicalDocumentModal } from '@/components/common/PhysicalDocumentModal';

interface StudentProfileViewProps {
    type: string;
    id: string;
}

export function StudentProfileView({ type, id }: StudentProfileViewProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDocs, setSelectedDocs] = useReactState<number[]>([]);
    const [documentView, setDocumentView] = useState<'digital' | 'physical'>('digital');
    const [journeyView, setJourneyView] = useState<'enquiry' | 'registration' | 'enrollment'>('enquiry');
    const [showPhysicalDocModal, setShowPhysicalDocModal] = useState(false);

    // 1. Fetch the Primary Record based on URL
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

    // Type Guards
    const validData = !!primaryRecord;
    const isEnquiry = (data: any): data is Enquiry => validData && type === 'enquiry';
    const isRegistration = (data: any): data is Registration => validData && type === 'registration';
    const isEnrollment = (data: any): data is Enrollment => validData && type === 'enrollment';

    // 2. Derive IDs for related records
    // Enrollment -> Registration -> Enquiry
    const enrollmentId = isEnrollment(primaryRecord) ? primaryRecord.id : null;
    const registrationIdStr = isEnrollment(primaryRecord) ? primaryRecord.studentId : (isRegistration(primaryRecord) ? primaryRecord.id : null);
    // Note: Enrollment.studentId is string in types.ts? Yes. Registration.id is string.

    // 3. Fetch Related Registration (if we are looking at Enrollment)
    const { data: relatedRegistration } = useQuery({
        queryKey: ['registration', registrationIdStr],
        queryFn: () => apiClient.registrations.get(registrationIdStr!),
        enabled: !!registrationIdStr && type === 'enrollment', // Only fetch if we are in enrollment view and need the reg details
    });

    // Consolidate Registration Data: Either the primary record (if type=registration) or the fetched related one
    const registrationData = isRegistration(primaryRecord) ? primaryRecord : relatedRegistration;

    // 4. Derive Enquiry ID
    const enquiryId = isEnquiry(primaryRecord) ? primaryRecord.id : registrationData?.enquiry;

    // Debug: Log enquiry ID
    console.log('Debug - Registration Data:', registrationData);
    console.log('Debug - Enquiry ID:', enquiryId);

    // 5. Fetch Related Enquiry
    const { data: relatedEnquiry } = useQuery({
        queryKey: ['enquiry', enquiryId],
        queryFn: () => apiClient.enquiries.get(enquiryId!.toString()),
        enabled: !!enquiryId && type !== 'enquiry', // Fetch if we have ID and aren't already looking at it
    });

    // Consolidate Enquiry Data
    const enquiryData = isEnquiry(primaryRecord) ? primaryRecord : relatedEnquiry;

    console.log('Debug - Enquiry Data:', enquiryData);


    // Consolidate logic for "Master Student Name"
    const studentName =
        (isEnrollment(primaryRecord) ? primaryRecord.studentName : null) ||
        (registrationData ? registrationData.studentName : null) ||
        (enquiryData ? enquiryData.candidateName : null) ||
        'Student';

    // Mutations (Keep existing logic)
    const updateEnquiryMutation = useMutation({
        mutationFn: (data: any) => apiClient.enquiries.update(enquiryData!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiry'] });
            toast.success('Enquiry updated');
        },
        onError: () => toast.error('Failed to update')
    });

    const updateRegistrationMutation = useMutation({
        mutationFn: (data: any) => apiClient.registrations.update(registrationData!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registration'] });
            toast.success('Registration updated');
        },
        onError: () => toast.error('Failed to update')
    });

    // Fetch physical documents held by office (fallback/verification, though we prefer using registrationData.student_documents)
    const { data: fetchedPhysicalDocs } = useQuery({
        queryKey: ['student-documents', registrationData?.id],
        queryFn: () => apiClient.studentDocuments.list(registrationData!.id),
        enabled: !!registrationData?.id
    });

    const physicalDocs = registrationData?.student_documents || fetchedPhysicalDocs;

    // Return documents mutation
    const returnDocsMutation = useMutation({
        mutationFn: (docIds: number[]) => apiClient.studentDocuments.returnDocs(docIds.map(String)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-documents'] });
            queryClient.invalidateQueries({ queryKey: ['registration'] });
            queryClient.invalidateQueries({ queryKey: ['registrations'] });
            setSelectedDocs([]);
            toast.success('Documents marked as returned');
        },
        onError: () => toast.error('Failed to return documents')
    });

    // ... (lines omitted)

    {/* Render Modal */ }
    {
        registrationData && (
            <PhysicalDocumentModal
                open={showPhysicalDocModal}
                onClose={() => setShowPhysicalDocModal(false)}
                registrationId={Number(registrationData.id)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['student-documents'] });
                    queryClient.invalidateQueries({ queryKey: ['registration'] });
                    queryClient.invalidateQueries({ queryKey: ['registrations'] });
                }}
            />
        )
    }

    if (isLoadingPrimary) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
    if (!primaryRecord) return <div className="p-8 text-center text-slate-500">Record not found</div>;

    // Timeline Helper
    const steps = [
        { label: 'Enquiry', date: enquiryData?.date, status: enquiryData ? 'Completed' : 'Pending', active: !!enquiryData },
        { label: 'Registration', date: registrationData?.registrationDate, status: registrationData ? 'Completed' : 'Pending', active: !!registrationData },
        { label: 'Enrollment', date: isEnrollment(primaryRecord) ? primaryRecord.startDate : null, status: isEnrollment(primaryRecord) ? 'Active' : 'Pending', active: isEnrollment(primaryRecord) }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
            <BackButton />
            {/* 1. Header & Quick Stats */}
            <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-3xl font-bold">
                        {studentName.charAt(0)}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-slate-900 font-heading">{studentName}</h1>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${type === 'enrollment' ? 'bg-green-100 text-green-700' :
                                type === 'registration' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {type}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1"><Phone size={14} /> {registrationData?.mobile || enquiryData?.mobile || 'N/A'}</div>
                            <div className="flex items-center gap-1"><Mail size={14} /> {registrationData?.email || enquiryData?.email || 'N/A'}</div>
                            <div className="flex items-center gap-1"><MapPin size={14} /> {registrationData?.permanentAddress || enquiryData?.permanentAddress || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                    {/* Conversion Buttons */}
                    {type === 'enquiry' && (
                        <Button
                            className="bg-green-600 hover:bg-green-700 w-full"
                            onClick={() => router.push(`/app/registrations/new?enquiryId=${id}`)}
                        >
                            Convert to Registration <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    {type === 'registration' && (
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 w-full"
                            onClick={() => router.push(`/app/enrollments/new?regId=${id}`)}
                        >
                            Enroll Student <GraduationCap className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* 2. Journey Timeline */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center relative overflow-hidden">
                {/* Simple visual timeline */}
                <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-200 -z-10" />
                {steps.map((step, idx) => (
                    <div key={idx} className={`flex flex-col items-center gap-1 bg-slate-50 px-2 z-10 ${!step.active ? 'opacity-50' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step.active ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-300 bg-white text-slate-300'}`}>
                            {step.active ? <CheckCircle size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{step.label}</span>
                        {step.date && <span className="text-[10px] text-slate-500">{format(new Date(step.date), 'dd MMM yy')}</span>}
                    </div>
                ))}
            </div>

            {/* 3. Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    {/* Show Journey tab if ANY journey data exists */}
                    {(enquiryData || registrationData || isEnrollment(primaryRecord)) && (
                        <TabsTrigger value="journey">Student Journey</TabsTrigger>
                    )}
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Academic Details</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {registrationData?.preferences?.[0]?.courseName || enquiryData?.courseInterested || 'N/A'}
                                    </p>
                                    <p className="text-xs text-slate-500">Course Interested</p>
                                </div>
                                <div className="border-t border-slate-100 pt-2">
                                    <p className="font-medium text-slate-900">{registrationData?.schoolName || enquiryData?.schoolName || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">
                                        {(registrationData?.schoolBoard || enquiryData?.schoolBoard) ? `${registrationData?.schoolBoard || enquiryData?.schoolBoard} Board` : 'School'}
                                    </p>
                                </div>
                                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="font-medium text-slate-900">{registrationData?.class12PassingYear || enquiryData?.class12PassingYear || '-'}</p>
                                        <p className="text-xs text-slate-500">12th Year</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {[registrationData?.schoolPlace || enquiryData?.schoolPlace, registrationData?.schoolState || enquiryData?.schoolState].filter(Boolean).join(', ') || '-'}
                                        </p>
                                        <p className="text-xs text-slate-500">School Loc</p>
                                    </div>
                                </div>
                                {(registrationData?.class12Percentage || enquiryData?.class12Percentage || registrationData?.class10Percentage || enquiryData?.class10Percentage) && (
                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                                        <div>
                                            <p className="font-medium text-slate-900">{registrationData?.class12Percentage || enquiryData?.class12Percentage || '-'}%</p>
                                            <p className="text-xs text-slate-500">12th %</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{registrationData?.class10Percentage || enquiryData?.class10Percentage || '-'}%</p>
                                            <p className="text-xs text-slate-500">10th %</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Science & Competitive</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="font-medium text-slate-900">{registrationData?.pcbPercentage || enquiryData?.pcbPercentage || '-'}%</p>
                                        <p className="text-xs text-slate-500">PCB %</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{registrationData?.pcmPercentage || enquiryData?.pcmPercentage || '-'}%</p>
                                        <p className="text-xs text-slate-500">PCM %</p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-2 grid grid-cols-3 gap-2">
                                    <div><p className="text-sm font-medium">{registrationData?.physicsMarks || enquiryData?.physicsMarks || '-'}</p><p className="text-[10px] text-slate-500">Phy</p></div>
                                    <div><p className="text-sm font-medium">{registrationData?.chemistryMarks || enquiryData?.chemistryMarks || '-'}</p><p className="text-[10px] text-slate-500">Chem</p></div>
                                    <div><p className="text-sm font-medium">{registrationData?.biologyMarks || enquiryData?.biologyMarks || '-'}</p><p className="text-[10px] text-slate-500">Bio</p></div>
                                    <div><p className="text-sm font-medium">{registrationData?.mathsMarks || enquiryData?.mathsMarks || '-'}</p><p className="text-[10px] text-slate-500">Math</p></div>
                                </div>
                                <div className="border-t border-slate-100 pt-2 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Prev. NEET</span>
                                        <span className="text-sm font-medium">{registrationData?.previousNeetMarks || enquiryData?.previousNeetMarks || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Cur. NEET</span>
                                        <span className="text-sm font-medium">{registrationData?.presentNeetMarks || enquiryData?.presentNeetMarks || '-'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Family & Personal</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-sm"><span className="text-slate-500">Father:</span> {registrationData?.fatherName || enquiryData?.fatherName || 'N/A'}</p>
                                    <p className="text-sm"><span className="text-slate-500">Mother:</span> {registrationData?.motherName || enquiryData?.motherName || 'N/A'}</p>
                                </div>
                                {(registrationData?.permanentAddress || enquiryData?.familyPlace || enquiryData?.familyState) && (
                                    <div className="border-t border-slate-100 pt-2">
                                        <p className="text-sm text-slate-900">{registrationData?.permanentAddress || [enquiryData?.familyPlace, enquiryData?.familyState].filter(Boolean).join(', ')}</p>
                                        <p className="text-xs text-slate-500">Address / Location</p>
                                    </div>
                                )}
                                {(registrationData?.dateOfBirth || enquiryData?.dob || registrationData?.gender || enquiryData?.gender) && (
                                    <div className="border-t border-slate-100 pt-2 flex gap-4">
                                        {(registrationData?.gender || enquiryData?.gender) && (
                                            <div>
                                                <p className="text-sm text-slate-900">{registrationData?.gender || enquiryData?.gender}</p>
                                                <p className="text-xs text-slate-500">Gender</p>
                                            </div>
                                        )}
                                        {(registrationData?.dateOfBirth || enquiryData?.dob) && (
                                            <div>
                                                <p className="text-sm text-slate-900">{format(new Date(registrationData?.dateOfBirth || enquiryData?.dob || ''), 'dd MMM yyyy')}</p>
                                                <p className="text-xs text-slate-500">DOB</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {(registrationData?.gapYear || enquiryData?.gapYear) && (
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">Gap Year</span>
                                        {(registrationData?.gapYearFrom || enquiryData?.gapYearFrom) && (
                                            <p className="text-xs text-slate-500 mt-1">{registrationData?.gapYearFrom || enquiryData?.gapYearFrom} - {registrationData?.gapYearTo || enquiryData?.gapYearTo}</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* STUDENT JOURNEY TAB - Shows Enquiry/Registration/Enrollment based on toggle */}
                {(enquiryData || registrationData || isEnrollment(primaryRecord)) && (
                    <TabsContent value="journey" className="mt-6">
                        {/* Toggle Buttons */}
                        <div className="flex gap-2 mb-4">
                            {enquiryData && (
                                <button
                                    onClick={() => setJourneyView('enquiry')}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${journeyView === 'enquiry'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Enquiry
                                </button>
                            )}
                            {registrationData && (
                                <button
                                    onClick={() => setJourneyView('registration')}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${journeyView === 'registration'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Registration
                                </button>
                            )}
                            {isEnrollment(primaryRecord) && (
                                <button
                                    onClick={() => setJourneyView('enrollment')}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${journeyView === 'enrollment'
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Enrollment
                                </button>
                            )}
                        </div>

                        {/* Enquiry View */}
                        {journeyView === 'enquiry' && enquiryData && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Enquiry Details</CardTitle>
                                    <CardDescription>Details captured during initial enquiry</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <EnquiryForm
                                        initialData={enquiryData}
                                        onSubmit={(data) => updateEnquiryMutation.mutate(data)}
                                        isLoading={updateEnquiryMutation.isPending}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Registration View */}
                        {journeyView === 'registration' && registrationData && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Registration Details</CardTitle>
                                    <CardDescription>Official registration information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RegistrationForm
                                        initialData={registrationData}
                                        onSubmit={(data) => updateRegistrationMutation.mutate(data)}
                                        isLoading={updateRegistrationMutation.isPending}
                                        isEdit={true}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Enrollment View */}
                        {journeyView === 'enrollment' && isEnrollment(primaryRecord) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Enrollment Details</CardTitle>
                                    <CardDescription>Active program enrollment details</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Program Info</h3>
                                            <div className="space-y-3">
                                                <div><span className="text-xs text-slate-400 block">Enrollment No</span> {primaryRecord.enrollmentNo}</div>
                                                <div><span className="text-xs text-slate-400 block">University</span> {primaryRecord.university}</div>
                                                <div><span className="text-xs text-slate-400 block">Program</span> {primaryRecord.programName}</div>
                                                <div><span className="text-xs text-slate-400 block">Start Date</span> {format(new Date(primaryRecord.startDate), 'dd MMM yyyy')}</div>
                                                <div><span className="text-xs text-slate-400 block">Duration</span> {primaryRecord.durationMonths} Months</div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Financials</h3>
                                            <div className="space-y-3">
                                                <div><span className="text-xs text-slate-400 block">Total Fees</span> <span className="text-lg font-bold text-slate-900">₹{primaryRecord.totalFees.toLocaleString()}</span></div>
                                                <div><span className="text-xs text-slate-400 block">Payment Type</span> {primaryRecord.paymentType}</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                )}

                {/* DOCUMENTS TAB - Combined Digital & Physical */}
                <TabsContent value="documents" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Documents</CardTitle>
                                    <CardDescription>Digital uploads and physical documents held</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDocumentView('digital')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${documentView === 'digital'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        Digital Files
                                    </button>
                                    <button
                                        onClick={() => setDocumentView('physical')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${documentView === 'physical'
                                            ? 'bg-yellow-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        Physical Docs
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Digital Documents View */}
                            {documentView === 'digital' && (
                                <DocumentList
                                    studentName={studentName}
                                    registrationId={registrationData?.id ? String(registrationData.id) : undefined}
                                />
                            )}

                            {/* Physical Documents View */}
                            {documentView === 'physical' && (
                                registrationData ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-sm text-slate-600">
                                                {physicalDocs?.filter((d: any) => d.status === 'Held').length || 0} document(s) currently held
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setShowPhysicalDocModal(true)}
                                                    className="text-teal-600 border-teal-200 hover:bg-teal-50"
                                                >
                                                    <Plus size={16} className="mr-2" /> Add Documents
                                                </Button>

                                                {selectedDocs.length > 0 && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => returnDocsMutation.mutate(selectedDocs)}
                                                        disabled={returnDocsMutation.isPending}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {returnDocsMutation.isPending ? 'Processing...' : `Hand Over ${selectedDocs.length} Document(s)`}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {physicalDocs && physicalDocs.length > 0 ? (
                                            <div className="border rounded-lg overflow-hidden">
                                                {/* Table Content */}
                                                <table className="w-full">
                                                    <thead className="bg-slate-50 border-b">
                                                        <tr>
                                                            <th className="p-3 text-left text-xs font-semibold text-slate-600">Select</th>
                                                            <th className="p-3 text-left text-xs font-semibold text-slate-600">Document Name</th>
                                                            <th className="p-3 text-left text-xs font-semibold text-slate-600">Document Number</th>
                                                            <th className="p-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                                            <th className="p-3 text-left text-xs font-semibold text-slate-600">Received Date</th>
                                                            <th className="p-3 text-left text-xs font-semibold text-slate-600">Remarks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {physicalDocs.map((doc: any) => (
                                                            <tr key={doc.id} className="border-b hover:bg-slate-50">
                                                                <td className="p-3">
                                                                    {doc.status === 'Held' && (
                                                                        <Checkbox
                                                                            checked={selectedDocs.includes(doc.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) {
                                                                                    setSelectedDocs([...selectedDocs, doc.id]);
                                                                                } else {
                                                                                    setSelectedDocs(selectedDocs.filter((id: number) => id !== doc.id));
                                                                                }
                                                                            }}
                                                                        />
                                                                    )}
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-sm text-slate-600">{doc.document_number || '-'}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${doc.status === 'Held' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                                        }`}>
                                                                        {doc.status}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-sm text-slate-600">
                                                                        {doc.received_at ? format(new Date(doc.received_at), 'dd MMM yyyy') : '-'}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-sm text-slate-500">{doc.remarks || '-'}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 border border-dashed rounded-lg">
                                                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                                                <p className="mt-4 text-sm text-slate-500">No physical documents on record</p>
                                                <Button
                                                    variant="link"
                                                    onClick={() => setShowPhysicalDocModal(true)}
                                                    className="mt-2 text-teal-600"
                                                >
                                                    Add your first document
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-sm text-slate-500">Registration required to view physical documents</p>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PAYMENTS TAB */}
                <TabsContent value="payments" className="mt-6">
                    <PaymentHistory studentName={studentName} />
                </TabsContent>

            </Tabs>

            {/* Render Modal */}
            {registrationData && (
                <PhysicalDocumentModal
                    open={showPhysicalDocModal}
                    onClose={() => setShowPhysicalDocModal(false)}
                    registrationId={Number(registrationData.id)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['student-documents'] });
                        queryClient.invalidateQueries({ queryKey: ['registration'] });
                        queryClient.invalidateQueries({ queryKey: ['registrations'] });
                    }}
                />
            )}
        </div>
    );
}
