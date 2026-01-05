'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { useToast } from '@/hooks/use-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';

const enrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  studentName: z.string(), // Hidden field to carry name

  programName: z.string().min(1, "Program Name is required"),
  university: z.string().min(1, "University is required"),
  programDuration: z.coerce.number().min(1, "Duration is required"),
  startDate: z.string().min(1, "Start Date is required"),

  serviceCharge: z.coerce.number().min(0),
  schoolFees: z.coerce.number().min(0),
  hostelFees: z.coerce.number().min(0),
  // totalFees is calculated

  paymentType: z.enum(['Full', 'Installment']),
  installmentsCount: z.coerce.number().optional(),
  installmentAmount: z.coerce.number().optional(),

  loanRequired: z.boolean().default(false),
  loanAmount: z.coerce.number().optional(),
  documents: z.array(z.any()).optional(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

interface EnrollmentWizardProps {
  onSubmit: (data: EnrollmentFormValues) => void;
  isLoading: boolean;
}

import { ExistingDocumentsList } from '@/components/common/ExistingDocumentsList';

const STEPS = ['Select Student', 'Program Details', 'Fee Structure', 'Payment Options', 'Loan Info', 'Documents'];

export function EnrollmentWizard({ onSubmit, isLoading }: EnrollmentWizardProps) {
  const [step, setStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddUniOpen, setIsAddUniOpen] = useState(false);
  const [newUni, setNewUni] = useState({
    name: '',
    country: '',
    city: '',
    ranking: '',
    rating: '',
    programs: '', // comma separated
    tuitionMin: '',
    tuitionMax: '',
    deadline: '',
    requirements: '' // comma separated
  });
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EnrollmentFormValues>({
    // @ts-ignore - zod resolver type mismatch with coerce.number()
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
    mutationFn: async () => {
      return apiClient.universities.create({
        name: newUni.name,
        country: newUni.country,
        city: newUni.city,
        programs: newUni.programs.split(',').map(s => s.trim()),
        requirements: newUni.requirements.split(',').map(s => s.trim()),
        tuitionFee: { min: Number(newUni.tuitionMin), max: Number(newUni.tuitionMax) },
        ranking: Number(newUni.ranking),
        rating: Number(newUni.rating),
        deadline: newUni.deadline
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['universities-select'] });
      setIsAddUniOpen(false);
      setValue('university', data.name); // or data.id if using ID
      setNewUni({
        name: '', country: '', city: '', ranking: '', rating: '',
        programs: '', tuitionMin: '', tuitionMax: '', deadline: '', requirements: ''
      });
      toast({ title: "University Added", type: "success" });
    },
    onError: (error: any) => {
      console.error("Failed to add university:", error.response?.data || error);
      toast({
        title: "Failed to add university",
        description: error.response?.data ? JSON.stringify(error.response.data) : (error.message || 'Unknown error'),
        type: "error"
      });
    }
  });

  // Filter out students who are already enrolled
  const enrolledStudentIds = new Set(enrollments?.map((e: any) => e.studentId || e.student));
  const availableRegistrations = registrations?.filter(reg => !enrolledStudentIds.has(reg.id));

  const serviceCharge = watch('serviceCharge');
  const schoolFees = watch('schoolFees');
  const hostelFees = watch('hostelFees');
  const totalFees = (Number(serviceCharge) || 0) + (Number(schoolFees) || 0) + (Number(hostelFees) || 0);

  const paymentType = watch('paymentType');
  const installmentsCount = watch('installmentsCount');
  const installmentAmount = watch('installmentAmount');
  const studentId = watch('studentId');
  const documents = watch('documents');

  // Handle Installment Count Change -> Calculate Amount
  const handleInstallmentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Number(e.target.value);
    setValue('installmentsCount', count);
    if (count > 0 && totalFees > 0) {
      setValue('installmentAmount', Math.ceil(totalFees / count));
    }
  };

  // Handle Installment Amount Change -> Calculate Count
  const handleInstallmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = Number(e.target.value);
    setValue('installmentAmount', amount);
    if (amount > 0 && totalFees > 0) {
      setValue('installmentsCount', Math.ceil(totalFees / amount));
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 0) fieldsToValidate = ['studentId'];
    if (step === 1) fieldsToValidate = ['programName', 'university', 'programDuration', 'startDate'];
    if (step === 2) fieldsToValidate = ['serviceCharge', 'schoolFees', 'hostelFees'];
    if (step === 3) {
      fieldsToValidate = ['paymentType'];
      if (paymentType === 'Installment') fieldsToValidate.push('installmentsCount', 'installmentAmount');
    }
    // Step 4 (Loan) validation handled on submit or next

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const { toast } = useToast();

  const onFormSubmit = async (data: EnrollmentFormValues) => {
    // Upload pending documents first
    if (data.documents && data.documents.length > 0) {
      const pendingDocs = data.documents.filter((doc: any) => doc.file instanceof File);
      if (pendingDocs.length > 0) {
        setIsUploading(true);
        toast({
          title: "Uploading Documents",
          description: `Uploading ${pendingDocs.length} document(s)...`,
          type: "info",
        });

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
          toast({
            title: "Upload Complete",
            description: "Documents uploaded successfully.",
            type: "success",
          });
        } catch (error) {
          console.error("Failed to upload documents", error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload documents. Enrollment was not created. Please try again.",
            type: "error",
          });
          setIsUploading(false);
          return; // Stop submission
        } finally {
          setIsUploading(false);
        }
      }
    }
    onSubmit(data);
  };

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-between px-4">
        {STEPS.map((label, idx) => (
          <div key={idx} className="flex flex-col items-center z-10 relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
              {step > idx ? <Check size={16} /> : idx + 1}
            </div>
            <span className={`text-xs mt-2 font-medium ${step >= idx ? 'text-blue-600' : 'text-gray-500'}`}>
              {label}
            </span>
          </div>
        ))}
        {/* Progress bar background could be added here */}
      </div>

      <form
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
        <Card>
          <CardContent className="pt-6">
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Student Registration</h3>
                <div className="space-y-2">
                  <Label>Student</Label>
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
                          <SelectTrigger
                            className="w-full bg-white border-slate-300 !text-black !opacity-100"
                            style={{ color: 'black' }}
                          >
                            <SelectValue placeholder="Search or Select Student...">
                              {selectedStudent ? `${selectedStudent.studentName} (${selectedStudent.registrationNo})` : <span className="text-slate-500">Search or Select Student...</span>}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableRegistrations?.map((reg) => (
                              <SelectItem key={reg.id} value={String(reg.id)}>
                                {reg.studentName} ({reg.registrationNo})
                              </SelectItem>
                            ))}
                            {availableRegistrations?.length === 0 && (
                              <div className="p-2 text-sm text-gray-500 text-center">No available students</div>
                            )}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                  {errors.studentId && <p className="text-sm text-red-500">{errors.studentId.message}</p>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Program Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Program Name</Label>
                    <Input {...register('programName')} placeholder="e.g. MBBS Abroad" />
                    {errors.programName && <p className="text-sm text-red-500">{errors.programName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>University</Label>
                    <div className="flex gap-2">
                      <Controller
                        control={control}
                        name="university"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(val: string) => {
                              if (val === 'ADD_NEW') {
                                setIsAddUniOpen(true);
                              } else {
                                field.onChange(val);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full bg-white border-slate-300">
                              <SelectValue placeholder="Select University" />
                            </SelectTrigger>
                            <SelectContent>
                              {universities?.map((uni: any) => (
                                <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                              ))}
                              <SelectItem value="ADD_NEW" className="text-blue-600 font-medium cursor-pointer">
                                + Add New University
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {errors.university && <p className="text-sm text-red-500">{errors.university.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (Months)</Label>
                    <Input type="number" {...register('programDuration')} />
                    {errors.programDuration && <p className="text-sm text-red-500">{errors.programDuration.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" {...register('startDate')} />
                    {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fee Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Service Charge</Label>
                    <Input type="number" {...register('serviceCharge')} />
                  </div>
                  <div className="space-y-2">
                    <Label>School Fees</Label>
                    <Input type="number" {...register('schoolFees')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hostel Fees</Label>
                    <Input type="number" {...register('hostelFees')} />
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-md flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Fees:</span>
                  <span className="text-xl font-bold text-blue-600">₹{totalFees}</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Options</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
                    <Controller
                      name="paymentType"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900 !opacity-100">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-blue-100">
                      <div className="space-y-2">
                        <Label>Number of Installments</Label>
                        <Input
                          type="number"
                          {...register('installmentsCount')}
                          onChange={handleInstallmentCountChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount Per Installment (Approx)</Label>
                        <Input
                          type="number"
                          {...register('installmentAmount')}
                          onChange={handleInstallmentAmountChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Loan Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="loanRequired"
                      control={control}
                      render={({ field }) => (
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} id="loanRequired" />
                      )}
                    />
                    <Label htmlFor="loanRequired">Loan Required</Label>
                  </div>

                  {watch('loanRequired') && (
                    <div className="space-y-2 pl-6">
                      <Label>Loan Amount Required</Label>
                      <Input type="number" {...register('loanAmount')} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Student Documents</h3>
                <DocumentUpload
                  registrationId={studentId}
                  initialDocuments={documents}
                  onDocumentsChange={(docs: any[]) => setValue('documents', docs)}
                />
                {/* Existing Documents List */}
                {studentId && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Existing Documents</h4>
                    <ExistingDocumentsList studentId={studentId} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit((data) => onFormSubmit(data as unknown as EnrollmentFormValues))}
              disabled={isLoading || isUploading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isUploading ? 'Uploading Documents...' : (isLoading ? 'Creating Enrollment...' : 'Complete Enrollment')}
            </Button>
          )}
        </div>
      </form>

      {/* Add University Modal */}
      <Dialog.Root open={isAddUniOpen} onOpenChange={setIsAddUniOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6">Add New University</Dialog.Title>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University Name</Label>
                  <Input value={newUni.name} onChange={e => setNewUni({ ...newUni, name: e.target.value })} placeholder="e.g. Oxford University" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={newUni.country} onChange={e => setNewUni({ ...newUni, country: e.target.value })} placeholder="e.g. UK" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={newUni.city} onChange={e => setNewUni({ ...newUni, city: e.target.value })} placeholder="e.g. Oxford" />
                </div>
                <div className="space-y-2">
                  <Label>Ranking</Label>
                  <Input type="number" value={newUni.ranking} onChange={e => setNewUni({ ...newUni, ranking: e.target.value })} placeholder="e.g. 5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input type="number" step="0.1" value={newUni.rating} onChange={e => setNewUni({ ...newUni, rating: e.target.value })} placeholder="e.g. 4.8" />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={newUni.deadline} onChange={e => setNewUni({ ...newUni, deadline: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Programs (comma separated)</Label>
                <Input value={newUni.programs} onChange={e => setNewUni({ ...newUni, programs: e.target.value })} placeholder="e.g. MBBS, Engineering, Law" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Tuition (Annual)</Label>
                  <Input type="number" value={newUni.tuitionMin} onChange={e => setNewUni({ ...newUni, tuitionMin: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Tuition (Annual)</Label>
                  <Input type="number" value={newUni.tuitionMax} onChange={e => setNewUni({ ...newUni, tuitionMax: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Requirements (comma separated)</Label>
                <Input value={newUni.requirements} onChange={e => setNewUni({ ...newUni, requirements: e.target.value })} placeholder="e.g. NEET Qualified, 60% in PCB" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddUniOpen(false)}>Cancel</Button>
                <Button type="button" onClick={() => createUniMutation.mutate()} disabled={createUniMutation.isPending || !newUni.name || !newUni.country} className="bg-teal-600 hover:bg-teal-700">
                  {createUniMutation.isPending ? 'Creating...' : 'Create University'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div >
  );
}

