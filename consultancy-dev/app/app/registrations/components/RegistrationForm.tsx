'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { DocumentUpload } from '@/components/common/DocumentUpload';

const registrationSchema = z.object({
  studentName: z.string().min(1, "Required"),
  email: z.string().email("Required"),
  mobile: z.string().min(10, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  fatherName: z.string().min(1, "Required"),
  motherName: z.string().min(1, "Required"),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  fatherMobile: z.string().optional(),
  motherMobile: z.string().optional(),
  permanentAddress: z.string().min(1, "Required"),

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
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  onSubmit: (data: RegistrationFormValues) => void;
  isLoading: boolean;
  enquiryId?: string | null;
  initialData?: any;
  isEdit?: boolean;
}

export function RegistrationForm({ onSubmit, isLoading, enquiryId, initialData, isEdit = false }: RegistrationFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    // @ts-ignore - zod resolver type mismatch with coerce.number()
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

  // Populate form with initialData if in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset(initialData);
    }
  }, [isEdit, initialData, reset]);

  // Simulate pre-fill if enquiryId exists
  useEffect(() => {
    if (enquiryId) {
      apiClient.enquiries.get(enquiryId).then(enq => {
        if (enq) {
          setValue('studentName', enq.candidateName);
          setValue('email', enq.email);
          setValue('mobile', enq.mobile);
          setValue('fatherName', enq.fatherName);
          setValue('motherName', enq.motherName);
          setValue('fatherOccupation', enq.fatherOccupation);
          setValue('motherOccupation', enq.motherOccupation);
          setValue('fatherMobile', enq.fatherMobile);
          setValue('motherMobile', enq.motherMobile);
          setValue('permanentAddress', enq.permanentAddress);
          // Add preferences based on courseInterested/locations?
          if (enq.preferredLocations.length > 0 && enq.courseInterested) {
            setValue('preferences', enq.preferredLocations.map((loc, idx) => ({
              courseName: enq.courseInterested,
              location: loc,
              priority: idx + 1
            })));
          }
        }
      });
    }
  }, [enquiryId, setValue]);

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as any))} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name</Label>
            <Input {...register('studentName')} />
            {errors.studentName && <p className="text-sm text-red-500">{errors.studentName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input {...register('email')} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input {...register('mobile')} />
            {errors.mobile && <p className="text-sm text-red-500">{errors.mobile.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input type="date" {...register('dateOfBirth')} />
            {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherName">Father's Name</Label>
            <Input {...register('fatherName')} />
            {errors.fatherName && <p className="text-sm text-red-500">{errors.fatherName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="motherName">Mother's Name</Label>
            <Input {...register('motherName')} />
            {errors.motherName && <p className="text-sm text-red-500">{errors.motherName.message}</p>}
          </div>
          {/* Other family fields omitted for brevity but follow same pattern */}
          <div className="col-span-full space-y-2">
            <Label htmlFor="permanentAddress">Permanent Address</Label>
            <Input {...register('permanentAddress')} />
            {errors.permanentAddress && <p className="text-sm text-red-500">{errors.permanentAddress.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-4 p-4 border border-gray-100 rounded-md bg-gray-50">
              <div className="flex-1 space-y-2">
                <Label>Course Name</Label>
                <Input {...register(`preferences.${index}.courseName`)} placeholder="e.g. MBBS" />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Location</Label>
                <Input {...register(`preferences.${index}.location`)} placeholder="e.g. Bangalore" />
              </div>
              <div className="w-24 space-y-2">
                <Label>Priority</Label>
                <Input type="number" {...register(`preferences.${index}.priority`)} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mb-0.5 text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ courseName: '', location: '', priority: fields.length + 1 })}
            className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          >
            <Plus size={16} className="mr-2" /> Add Preference
          </Button>
          {errors.preferences && <p className="text-sm text-red-500">{errors.preferences.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Registration Fee</Label>
            <Input type="number" {...register('registrationFee')} />
            {errors.registrationFee && <p className="text-sm text-red-500">{errors.registrationFee.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Controller
              name="paymentStatus"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Controller
              name="needsLoan"
              control={control}
              render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="needsLoan" />
              )}
            />
            <Label htmlFor="needsLoan">Needs Loan</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload
            registrationId={initialData?.id}
            initialDocuments={initialData?.documents}
            onDocumentsChange={(docs: any[]) => setValue('documents', docs)}
            readOnly={false}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-teal-600 hover:bg-teal-700 text-white min-w-[150px]"
        >
          {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Registration' : 'Create Registration')}
        </Button>
      </div>
    </form>
  );
}
