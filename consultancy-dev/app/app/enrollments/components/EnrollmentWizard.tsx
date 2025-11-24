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

const enrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  studentName: z.string(), // Hidden field to carry name

  programName: z.string().min(1, "Program Name is required"),
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
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

interface EnrollmentWizardProps {
  onSubmit: (data: EnrollmentFormValues) => void;
  isLoading: boolean;
}

const STEPS = ['Select Student', 'Program Details', 'Fee Structure', 'Payment Options', 'Loan Info'];

export function EnrollmentWizard({ onSubmit, isLoading }: EnrollmentWizardProps) {
  const [step, setStep] = useState(0);

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
    if (step === 1) fieldsToValidate = ['programName', 'programDuration', 'startDate'];
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

      <form onSubmit={handleSubmit((data) => onSubmit(data as any))}>
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
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
              {isLoading ? 'Creating Enrollment...' : 'Complete Enrollment'}
            </Button>
          )}
        </div>
      </form>
    </div >
  );
}

