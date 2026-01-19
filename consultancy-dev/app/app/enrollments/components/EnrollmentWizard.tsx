'use client';

import { useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Check, CalendarIcon, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentTakeover } from '@/components/common/DocumentTakeover';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import * as Dialog from '@radix-ui/react-dialog';
import { ExistingDocumentsList } from '@/components/common/ExistingDocumentsList';

const enrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  studentName: z.string(),

  programName: z.string().min(1, "Program Name is required"),
  university: z.string().min(1, "University is required"),
  programDuration: z.coerce.number().min(1, "Duration is required"),
  startDate: z.string().min(1, "Start Date is required"),

  serviceCharge: z.coerce.number().min(0).default(0),
  schoolFees: z.coerce.number().min(0).default(0),
  hostelFees: z.coerce.number().min(0).default(0),

  paymentType: z.enum(['Full', 'Installment']),
  installmentsCount: z.coerce.number().optional(),
  installmentAmount: z.coerce.number().optional(),

  student_documents: z.array(z.object({
    name: z.string(),
    document_number: z.string().optional(),
    remarks: z.string().optional()
  })).optional(),
  documentTakeoverEnabled: z.boolean().default(false),

  loanRequired: z.boolean().default(false),
  loanAmount: z.coerce.number().optional(),
  documents: z.array(z.any()).optional(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

interface EnrollmentWizardProps {
  onSubmit: (data: EnrollmentFormValues) => void;
  isLoading: boolean;
}

export function EnrollmentWizard({ onSubmit, isLoading }: EnrollmentWizardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAddUniOpen, setIsAddUniOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'programs' | 'requirements'>('basic');
  const [newUni, setNewUni] = useState({
    name: '',
    country: '',
    city: '',
    ranking: '',
    rating: '',
    programs: '', // comma separated strings
    tuitionMin: '',
    tuitionMax: '',
    deadline: '',
    requirements: '' // comma separated strings
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EnrollmentFormValues>({
    // @ts-ignore
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      serviceCharge: 0,
      schoolFees: 0,
      hostelFees: 0,
      paymentType: 'Full',
      loanRequired: false,
      loanAmount: 0,
      documents: [],
      university: '',
      student_documents: [],
      documentTakeoverEnabled: false,
    },
  });

  const { data: registrations } = useQuery({
    queryKey: ['registrations-list-select'],
    queryFn: apiClient.registrations.list,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments-list-check'],
    queryFn: apiClient.enrollments.list,
  });

  const { data: universities } = useQuery({
    queryKey: ['universities-select'],
    queryFn: apiClient.universities.list,
  });

  const createUniMutation = useMutation({
    mutationFn: async (data: any) => {
      // transform if needed, similar to universities page
      const formatted = {
        company_id: '', // Handled by backend/session? Or needs manual if stored in newUni? 
        // newUni doesn't store company_id. Backend uses session/user.
        name: data.name,
        country: data.country,
        city: data.city,
        programs: data.programs.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        requirements: data.requirements.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        tuitionFee: { min: Number(data.tuitionMin), max: Number(data.tuitionMax) },
        ranking: Number(data.ranking) || 0,
        rating: Number(data.rating) || 0,
        admissionDeadline: data.deadline // Map deadline to admissionDeadline?
        // Note: apiClient.universities.create expects snake_case or specific struct?
        // The universities/page.tsx calls apiClient.universities.create(formatted).
        // Let's assume apiClient handles camel->snake mapping or formatted is close enough.
        // Wait, universities/page.tsx line 79 passes `formatted`.
        // `apiClient.ts` create uses `toSnakeCase(data)`.
        // So `admissionDeadline` in `formatted` -> `admission_deadline` in payload.
        // My `newUni` (and `data` arg here) uses `deadline`.
        // So I should map `deadline` to `admissionDeadline`.
      };
      return apiClient.universities.create(formatted);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['universities-select'] });
      setIsAddUniOpen(false);
      setActiveTab('basic');
      setValue('university', data.name);
      setNewUni({
        name: '', country: '', city: '', ranking: '', rating: '',
        programs: '', tuitionMin: '', tuitionMax: '', deadline: '', requirements: ''
      });
      toast({ title: "University Added", description: "Successfully added new university.", variant: "default" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add university",
        description: error.response?.data ? JSON.stringify(error.response.data) : (error.message || 'Unknown error'),
        variant: "destructive"
      });
    }
  });

  const handleCreateUni = () => {
    if (!newUni.name || !newUni.country) {
      toast({ title: 'Validation Error', description: 'Name and Country are required', variant: "destructive" });
      return;
    }
    createUniMutation.mutate(newUni);
  };

  // Filter out already enrolled
  const enrolledStudentIds = new Set(enrollments?.map((e: any) => e.studentId || e.student));
  const availableRegistrations = registrations?.filter(reg => !enrolledStudentIds.has(reg.id));

  const serviceCharge = watch('serviceCharge');
  const schoolFees = watch('schoolFees');
  const hostelFees = watch('hostelFees');
  const totalFees = (Number(serviceCharge) || 0) + (Number(schoolFees) || 0) + (Number(hostelFees) || 0);

  // ... (rest of logic same) ...
  const paymentType = watch('paymentType');
  const studentId = watch('studentId');
  const documents = watch('documents');
  const loanRequired = watch('loanRequired');

  const handleInstallmentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('installmentsCount', Number(e.target.value));
  const handleInstallmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('installmentAmount', Number(e.target.value));

  const onFormSubmit = async (data: EnrollmentFormValues) => {
    if (data.documents && data.documents.length > 0) {
      // ... upload logic ...
      const pendingDocs = data.documents.filter((doc: any) => doc.file instanceof File);
      if (pendingDocs.length > 0) {
        setIsUploading(true);
        try {
          for (const doc of pendingDocs) {
            const formData = new FormData();
            formData.append('file', doc.file as File);
            formData.append('file_name', doc.file_name);
            formData.append('description', doc.description || '');
            formData.append('registration', data.studentId);
            formData.append('type', doc.type || 'General');
            await apiClient.documents.create(formData);
          }
        } catch (error) {
          setIsUploading(false); return;
        }
        setIsUploading(false);
      }
    }
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Card className="bg-white border-none shadow-sm rounded-xl">
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* ... Form Content (Student, Fees, Payment) -> Same as before ... */}
            {/* Only showing summarized form here, but I will write FULL content in file */}

            {/* 1. Student & University */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-slate-700">Select Student</Label>
                <Controller
                  name="studentId"
                  control={control}
                  render={({ field }) => {
                    const selectedStudent = registrations?.find(r => String(r.id) === String(field.value));
                    return (
                      <Select
                        onValueChange={(val: string) => {
                          field.onChange(val);
                          const student = registrations?.find(r => String(r.id) === val);
                          if (student) setValue('studentName', student.studentName);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full h-11 bg-white border-slate-300">
                          <SelectValue placeholder="Search or Select Student...">
                            {selectedStudent ? `${selectedStudent.studentName} (${selectedStudent.registrationNo})` : "Search or Select Student..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableRegistrations?.map((reg) => (
                            <SelectItem key={reg.id} value={String(reg.id)}>
                              {reg.studentName} ({reg.registrationNo})
                            </SelectItem>
                          ))}
                          {availableRegistrations?.length === 0 && <div className="p-2 text-sm text-gray-500 text-center">No available students</div>}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {errors.studentId && <p className="text-sm text-red-500">{errors.studentId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">University</Label>
                <Controller
                  control={control}
                  name="university"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val: string) => {
                        if (val === 'ADD_NEW') setIsAddUniOpen(true);
                        else field.onChange(val);
                      }}
                    >
                      <SelectTrigger className="w-full h-11 border-slate-300">
                        <SelectValue placeholder="Select University" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities?.map((uni: any) => (
                          <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                        ))}
                        <SelectItem value="ADD_NEW" className="text-teal-600 font-medium cursor-pointer">+ Add New University</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.university && <p className="text-sm text-red-500">{errors.university.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Program Name</Label>
                <Input {...register('programName')} className="h-11 border-slate-300" placeholder="e.g. MBBS Abroad" />
                {errors.programName && <p className="text-sm text-red-500">{errors.programName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Duration (Months)</Label>
                <Input type="number" {...register('programDuration')} className="h-11 border-slate-300" />
                {errors.programDuration && <p className="text-sm text-red-500">{errors.programDuration.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Start Date</Label>
                <Input type="date" {...register('startDate')} className="h-11 border-slate-300" />
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6"></div>

            {/* 2. Fees */}
            <h3 className="text-lg font-medium text-slate-800">Fee Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Service Charge</Label>
                <Input type="number" {...register('serviceCharge')} className="h-11 border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">School Fees</Label>
                <Input type="number" {...register('schoolFees')} className="h-11 border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Hostel Fees</Label>
                <Input type="number" {...register('hostelFees')} className="h-11 border-slate-300" />
              </div>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100 mt-2">
              <span className="text-slate-600 font-medium">Total Fees Calculated</span>
              <span className="text-xl font-bold text-teal-600">₹{totalFees.toLocaleString()}</span>
            </div>

            <div className="border-t border-slate-100 pt-6"></div>

            {/* 3. Payment & Loan */}
            <h3 className="text-lg font-medium text-slate-800">Payment & Loan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Payment Type</Label>
                <Controller
                  name="paymentType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-11 border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full">Full Payment</SelectItem>
                        <SelectItem value="Installment">Installment</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {paymentType === 'Installment' && (
                <div className="grid grid-cols-2 gap-4 md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">No. of Installments</Label>
                    <Input type="number" {...register('installmentsCount')} onChange={handleInstallmentCountChange} className="h-10 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Amount / Installment</Label>
                    <Input type="number" {...register('installmentAmount')} onChange={handleInstallmentAmountChange} className="h-10 bg-white" />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 md:col-span-2 pt-2">
                <Controller
                  name="loanRequired"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="loanRequired" />
                  )}
                />
                <Label htmlFor="loanRequired" className="font-medium cursor-pointer">Student Requires Loan</Label>
              </div>

              {loanRequired && (
                <div className="space-y-2 md:col-span-2 pl-6">
                  <Label className="text-sm font-medium text-slate-700">Loan Amount Required</Label>
                  <Input type="number" {...register('loanAmount')} className="h-11 border-slate-300" />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6"></div>

            {/* 4. Documents */}
            <h3 className="text-lg font-medium text-slate-800">Documents</h3>
            <DocumentUpload
              registrationId={studentId}
              initialDocuments={documents}
              onDocumentsChange={(docs: any[]) => setValue('documents', docs)}
            />

            <div className="pt-4">
              <DocumentTakeover control={control} register={register} setValue={setValue} />
            </div>

            {studentId && (
              <div className="mt-4">
                <ExistingDocumentsList studentId={studentId} />
              </div>
            )}

            {/* Submit Action */}
            <div className="flex justify-end pt-6 border-t border-slate-100">
              <Button
                type="submit"
                disabled={isLoading || isUploading}
                className="bg-teal-600 hover:bg-teal-700 text-white min-w-[200px] h-11 text-base shadow-sm"
              >
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  'Create Enrollment'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Add New University Modal (Exact Copy from UniversitiesPage) */}
      <Dialog.Root open={isAddUniOpen} onOpenChange={(open) => {
        setIsAddUniOpen(open);
        if (!open) setActiveTab('basic');
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[95vw] max-w-[900px] h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-xl z-50 border flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-900">Add New University</Dialog.Title>
                <p className="text-sm text-slate-500 mt-0.5">Fill in the details below to add a university</p>
              </div>
              <Dialog.Close asChild>
                <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </button>
              </Dialog.Close>
            </div>

            <div className="flex border-b border-slate-200 px-6 shrink-0">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('programs')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'programs' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
              >
                Programs & Fees
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requirements' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
              >
                Requirements
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 bg-slate-50">
              {activeTab === 'basic' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-teal-600 rounded-full"></div>
                      Primary Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          University Name <span className="text-red-500">*</span>
                        </Label>
                        <Input value={newUni.name} onChange={e => setNewUni({ ...newUni, name: e.target.value })} placeholder="Enter university name" className="h-10 border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select value={newUni.country} onValueChange={(val) => setNewUni({ ...newUni, country: val })}>
                          <SelectTrigger className="h-10 border-slate-300">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {/* Countries list shortened for brevity, keep primary ones */}
                            {['Russia', 'Czech Republic', 'Poland', 'Ukraine', 'Philippines', 'China', 'Bangladesh', 'Nepal', 'Kyrgyzstan', 'Kazakhstan', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'India'].map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">City</Label>
                        <Input value={newUni.city} onChange={e => setNewUni({ ...newUni, city: e.target.value })} placeholder="Enter city name" className="h-10 border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Application Deadline</Label>
                        <Input type="date" value={newUni.deadline} onChange={e => setNewUni({ ...newUni, deadline: e.target.value })} className="h-10 border-slate-300" />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-yellow-600 rounded-full"></div>
                      Rankings & Rating
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">World Ranking</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">#</span>
                          <Input type="number" value={newUni.ranking} onChange={e => setNewUni({ ...newUni, ranking: e.target.value })} placeholder="150" className="h-10 border-slate-300 pl-8" />
                        </div>
                        <p className="text-xs text-slate-500">Global ranking position</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Overall Rating</Label>
                        <Select value={newUni.rating} onValueChange={(val) => setNewUni({ ...newUni, rating: val })}>
                          <SelectTrigger className="h-10 border-slate-300">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5.0">⭐⭐⭐⭐⭐ 5.0 - Excellent</SelectItem>
                            <SelectItem value="4.8">⭐⭐⭐⭐⭐ 4.8 - Outstanding</SelectItem>
                            <SelectItem value="4.5">⭐⭐⭐⭐ 4.5 - Very Good</SelectItem>
                            <SelectItem value="4.3">⭐⭐⭐⭐ 4.3 - Very Good</SelectItem>
                            <SelectItem value="4.0">⭐⭐⭐⭐ 4.0 - Good</SelectItem>
                            <SelectItem value="3.8">⭐⭐⭐ 3.8 - Good</SelectItem>
                            <SelectItem value="3.5">⭐⭐⭐ 3.5 - Average</SelectItem>
                            <SelectItem value="3.0">⭐⭐⭐ 3.0 - Average</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Student satisfaction rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'programs' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Programs Offered</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded border border-slate-200">
                      {['MBBS', 'MD', 'BDS', 'BAMS', 'BHMS', 'Engineering', 'B.Tech', 'MBA', 'BBA', 'Law', 'LLB', 'Nursing', 'Pharmacy', 'B.Sc', 'M.Sc', 'Arts', 'Commerce', 'Management'].map((program) => {
                        const isSelected = newUni.programs.split(',').map(p => p.trim()).includes(program);
                        return (
                          <label key={program} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentPrograms = newUni.programs ? newUni.programs.split(',').map(p => p.trim()).filter(p => p) : [];
                                if (e.target.checked) {
                                  setNewUni({ ...newUni, programs: [...currentPrograms, program].join(', ') });
                                } else {
                                  setNewUni({ ...newUni, programs: currentPrograms.filter(p => p !== program).join(', ') });
                                }
                              }}
                              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-slate-700">{program}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Select all programs that apply</p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Annual Tuition Fee (₹)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Minimum Amount</Label>
                        <Input type="number" value={newUni.tuitionMin} onChange={e => setNewUni({ ...newUni, tuitionMin: e.target.value })} placeholder="e.g. 500000" className="h-10 border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Maximum Amount</Label>
                        <Input type="number" value={newUni.tuitionMax} onChange={e => setNewUni({ ...newUni, tuitionMax: e.target.value })} placeholder="e.g. 800000" className="h-10 border-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="max-w-4xl">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Eligibility Requirements</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50 rounded border border-slate-200">
                      {['NEET Qualified', '60% in PCB', '50% in PCB', '12th Pass', 'IELTS 6.0+', 'TOEFL 80+', 'Age 17-25', 'English Proficiency', 'Medical Fitness', 'Valid Passport'].map((req) => {
                        const isSelected = newUni.requirements.split(',').map(r => r.trim()).includes(req);
                        return (
                          <label key={req} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentReqs = newUni.requirements ? newUni.requirements.split(',').map(r => r.trim()).filter(r => r) : [];
                                if (e.target.checked) {
                                  setNewUni({ ...newUni, requirements: [...currentReqs, req].join(', ') });
                                } else {
                                  setNewUni({ ...newUni, requirements: currentReqs.filter(r => r !== req).join(', ') });
                                }
                              }}
                              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-slate-700">{req}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Select all eligibility criteria that apply</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <div className="text-sm text-slate-600">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAddUniOpen(false)} className="h-10">Cancel</Button>
                <Button onClick={handleCreateUni} disabled={createUniMutation.isPending || !newUni.name || !newUni.country} className="bg-teal-600 hover:bg-teal-700 h-10 min-w-32">
                  {createUniMutation.isPending ? 'Creating...' : 'Create University'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
