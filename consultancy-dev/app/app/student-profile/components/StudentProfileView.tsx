'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Wallet, FileText, UserCircle, GraduationCap, Phone, Mail, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { EnquiryForm } from '@/app/app/enquiries/components/EnquiryForm';
import { RegistrationForm } from '@/app/app/registrations/components/RegistrationForm';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { PaymentHistory } from './PaymentHistory';
import { DocumentList } from './DocumentList';
import { Enquiry, Registration, Enrollment } from '@/lib/types';
import { format } from 'date-fns';

interface StudentProfileViewProps {
    type: string;
    id: string;
}

export function StudentProfileView({ type, id }: StudentProfileViewProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');

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

    // 5. Fetch Related Enquiry
    const { data: relatedEnquiry } = useQuery({
        queryKey: ['enquiry', enquiryId],
        queryFn: () => apiClient.enquiries.get(enquiryId!.toString()),
        enabled: !!enquiryId && type !== 'enquiry', // Fetch if we have ID and aren't already looking at it
    });

    // Consolidate Enquiry Data
    const enquiryData = isEnquiry(primaryRecord) ? primaryRecord : relatedEnquiry;


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
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    {/* Conditionally render tabs based on available data */}
                    {enquiryData && <TabsTrigger value="enquiry">Enquiry Data</TabsTrigger>}
                    {registrationData && <TabsTrigger value="registration">Registration Data</TabsTrigger>}
                    {isEnrollment(primaryRecord) && <TabsTrigger value="enrollment">Enrollment Data</TabsTrigger>}
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Academic Interest</CardTitle></CardHeader>
                            <CardContent>
                                <p className="font-medium text-slate-900">{enquiryData?.courseInterested || registrationData?.preferences?.[0]?.courseName || 'N/A'}</p>
                                <p className="text-sm text-slate-500">{enquiryData?.schoolName}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Family Info</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm"><span className="text-slate-500">Father:</span> {registrationData?.fatherName || enquiryData?.fatherName || 'N/A'}</p>
                                <p className="text-sm"><span className="text-slate-500">Mother:</span> {registrationData?.motherName || enquiryData?.motherName || 'N/A'}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Lead Info</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm"><span className="text-slate-500">Source:</span> Direct</p>
                                <p className="text-sm"><span className="text-slate-500">Date:</span> {enquiryData?.date ? format(new Date(enquiryData.date), 'dd MMM yyyy') : 'N/A'}</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ENQUIRY TAB */}
                {enquiryData && (
                    <TabsContent value="enquiry" className="mt-6">
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
                    </TabsContent>
                )}

                {/* REGISTRATION TAB */}
                {registrationData && (
                    <TabsContent value="registration" className="mt-6">
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
                    </TabsContent>
                )}

                {/* ENROLLMENT TAB */}
                {isEnrollment(primaryRecord) && (
                    <TabsContent value="enrollment" className="mt-6">
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
                    </TabsContent>
                )}

                {/* DOCUMENTS TAB */}
                <TabsContent value="documents" className="mt-6">
                    <DocumentList studentName={studentName} />
                </TabsContent>

                {/* PAYMENTS TAB */}
                <TabsContent value="payments" className="mt-6">
                    <PaymentHistory studentName={studentName} />
                </TabsContent>

            </Tabs>
        </div>
    );
}
