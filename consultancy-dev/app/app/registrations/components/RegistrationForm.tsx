'use client';

import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { DocumentTakeover } from '@/components/common/DocumentTakeover';
import { INDIAN_STATES } from '@/lib/utils';

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

  // New Fields
  schoolName: z.string().optional(),
  schoolBoard: z.string().optional(),
  schoolPlace: z.string().optional(),
  schoolState: z.string().optional(),
  // HSLC (Class 10)
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

  familyPlace: z.string().optional(),
  familyState: z.string().optional(),

  // Marks
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

  // Document Takeover
  student_documents: z.array(z.object({
    name: z.string(),
    document_number: z.string().optional(),
    remarks: z.string().optional()
  })).optional(),
  documentTakeoverEnabled: z.boolean().default(false),
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
    watch,
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

  // Auto-calculate PCB and PCM percentages
  const physicsMarks = watch('physicsMarks');
  const chemistryMarks = watch('chemistryMarks');
  const biologyMarks = watch('biologyMarks');
  const mathsMarks = watch('mathsMarks');

  useEffect(() => {
    // Helper to check if a value is effectively a number
    const isValid = (val: any) => val !== '' && val !== undefined && val !== null && !isNaN(Number(val));

    if (isValid(physicsMarks) && isValid(chemistryMarks) && isValid(biologyMarks)) {
      const pcb = (Number(physicsMarks) + Number(chemistryMarks) + Number(biologyMarks)) / 3;
      // Use parseFloat to avoid trailing zeros string if needed, mostly toFixed(2) returns string
      setValue('pcbPercentage', parseFloat(pcb.toFixed(2)));
    }

    if (isValid(physicsMarks) && isValid(chemistryMarks) && isValid(mathsMarks)) {
      const pcm = (Number(physicsMarks) + Number(chemistryMarks) + Number(mathsMarks)) / 3;
      setValue('pcmPercentage', parseFloat(pcm.toFixed(2)));
    }
  }, [physicsMarks, chemistryMarks, biologyMarks, mathsMarks, setValue]);

  const [prefilledDocs, setPrefilledDocs] = useState<any[]>([]);

  // Populate form with initialData if in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset(initialData);
    }
  }, [isEdit, initialData, reset]);

  // Simulate pre-fill if enquiryId exists
  useEffect(() => {
    if (enquiryId) {
      const fetchEnquiryDetails = async () => {
        try {
          const enq = await apiClient.enquiries.get(enquiryId);
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

            // New fields
            if (enq.gender) setValue('gender', enq.gender as any);
            if (enq.dob) setValue('dateOfBirth', enq.dob.split('T')[0]);

            // Pre-fill new fields
            if (enq.schoolName) setValue('schoolName', enq.schoolName);
            if (enq.schoolBoard) setValue('schoolBoard', enq.schoolBoard);
            if (enq.schoolPlace) setValue('schoolPlace', enq.schoolPlace);
            if (enq.schoolState) setValue('schoolState', enq.schoolState);

            // HSLC
            if (enq.class10SchoolName) setValue('class10SchoolName', enq.class10SchoolName);
            if (enq.class10Board) setValue('class10Board', enq.class10Board);
            if (enq.class10Place) setValue('class10Place', enq.class10Place);
            if (enq.class10State) setValue('class10State', enq.class10State);
            if (enq.class10PassingYear) setValue('class10PassingYear', enq.class10PassingYear);

            if (enq.class10Percentage) setValue('class10Percentage', enq.class10Percentage);
            if (enq.class12Percentage) setValue('class12Percentage', enq.class12Percentage);
            if (enq.class12PassingYear) setValue('class12PassingYear', enq.class12PassingYear);
            if (enq.gapYear) setValue('gapYear', enq.gapYear);
            if (enq.gapYearFrom) setValue('gapYearFrom', enq.gapYearFrom);
            if (enq.gapYearTo) setValue('gapYearTo', enq.gapYearTo);

            if (enq.familyPlace) setValue('familyPlace', enq.familyPlace);
            if (enq.familyState) setValue('familyState', enq.familyState);

            // Marks
            if (enq.pcbPercentage) setValue('pcbPercentage', enq.pcbPercentage);
            if (enq.pcmPercentage) setValue('pcmPercentage', enq.pcmPercentage);
            if (enq.physicsMarks) setValue('physicsMarks', enq.physicsMarks);
            if (enq.chemistryMarks) setValue('chemistryMarks', enq.chemistryMarks);
            if (enq.biologyMarks) setValue('biologyMarks', enq.biologyMarks);
            if (enq.mathsMarks) setValue('mathsMarks', enq.mathsMarks);
            if (enq.previousNeetMarks) setValue('previousNeetMarks', enq.previousNeetMarks);
            if (enq.presentNeetMarks) setValue('presentNeetMarks', enq.presentNeetMarks);


            // Preferences
            if (enq.preferredLocations.length > 0 && enq.courseInterested) {
              setValue('preferences', enq.preferredLocations.map((loc, idx) => ({
                courseName: enq.courseInterested,
                location: loc,
                priority: idx + 1
              })));
            }

            // Fetch documents for this student
            const allDocs = await apiClient.documents.list();
            const studentDocs = allDocs.filter(d =>
              d.studentName?.toLowerCase() === enq.candidateName.toLowerCase()
            );

            if (studentDocs.length > 0) {
              setPrefilledDocs(studentDocs);
              setValue('documents', studentDocs);
            }
          }
        } catch (err) {
          console.error("Failed to fetch enquiry details", err);
        }
      };
      fetchEnquiryDetails();
    }
  }, [enquiryId, setValue]);

  const handleFormSubmit: SubmitHandler<RegistrationFormValues> = (data) => {
    // Process preferences to allow comma-separated locations
    const processedPreferences = data.preferences.flatMap(pref => {
      if (pref.location && pref.location.includes(',')) {
        return pref.location.split(',').map(loc => ({
          ...pref,
          location: loc.trim()
        })).filter(p => p.location); // Remove empty strings
      }
      return pref;
    });

    onSubmit({
      ...data,
      preferences: processedPreferences
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-8">
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
            <Label htmlFor="gender">Gender</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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
          <div className="space-y-2">
            <Label htmlFor="fatherOccupation">Father's Occupation</Label>
            <Input {...register('fatherOccupation')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherMobile">Father's Mobile</Label>
            <Input {...register('fatherMobile')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motherOccupation">Mother's Occupation</Label>
            <Input {...register('motherOccupation')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motherMobile">Mother's Mobile</Label>
            <Input {...register('motherMobile')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="familyPlace">Family City/Place</Label>
            <Input {...register('familyPlace')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="familyState">Family State</Label>
            <Select onValueChange={(val) => setValue('familyState', val)} value={watch('familyState') || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-full border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Academic Details</h3>
            <div className="space-y-8">
              {/* HSLC (Class 10) Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-4 bg-teal-500 rounded-full"></span>
                  HSLC (Class 10) Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>School Name</Label>
                    <Input {...register('class10SchoolName')} placeholder="Class 10 School" />
                  </div>
                  <div className="space-y-2">
                    <Label>Board</Label>
                    <Select onValueChange={(val) => setValue('class10Board', val)} value={watch('class10Board') || undefined}>
                      <SelectTrigger><SelectValue placeholder="Select Board" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEBA">SEBA (Assam)</SelectItem>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="ICSE">ICSE</SelectItem>
                        <SelectItem value="NBSE">NBSE (Nagaland)</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year of Passing</Label>
                    <Input {...register('class10PassingYear')} placeholder="YYYY" />
                  </div>
                  <div className="space-y-2">
                    <Label>Percentage / CGPA</Label>
                    <Input type="number" step="0.01" {...register('class10Percentage')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Place / City</Label>
                    <Input {...register('class10Place')} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select onValueChange={(val) => setValue('class10State', val)} value={watch('class10State') || undefined}>
                      <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* HSSLC (Class 12) Section */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  HSSLC (Class 12) Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>School Name</Label>
                    <Input {...register('schoolName')} placeholder="Class 12 School" />
                  </div>
                  <div className="space-y-2">
                    <Label>Board</Label>
                    <Select onValueChange={(val) => setValue('schoolBoard', val)} value={watch('schoolBoard') || undefined}>
                      <SelectTrigger><SelectValue placeholder="Select Board" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AHSEC">AHSEC (Assam)</SelectItem>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="NBSE">NBSE (Nagaland)</SelectItem>
                        <SelectItem value="ICSE">ICSE</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year of Passing</Label>
                    <Input {...register('class12PassingYear')} placeholder="YYYY" />
                  </div>
                  <div className="space-y-2">
                    <Label>Percentage / CGPA</Label>
                    <Input type="number" step="0.01" {...register('class12Percentage')} />
                  </div>
                  <div className="space-y-2">
                    <Label>School Place</Label>
                    <Input {...register('schoolPlace')} />
                  </div>
                  <div className="space-y-2">
                    <Label>School State</Label>
                    <Select onValueChange={(val) => setValue('schoolState', val)} value={watch('schoolState') || undefined}>
                      <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-full border-t pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Controller
                name="gapYear"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="gapYear" />
                )}
              />
              <Label htmlFor="gapYear">Gap Year</Label>
            </div>
            {/* Gap Year Fields could be conditional, but simpler to just show if checked or always */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Gap Year From</Label>
                <Input type="number" {...register('gapYearFrom')} />
              </div>
              <div className="space-y-2">
                <Label>Gap Year To</Label>
                <Input type="number" {...register('gapYearTo')} />
              </div>
            </div>
          </div>

          <div className="col-span-full border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Science & Competitive Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>PCB %</Label>
                <Input type="number" step="0.01" {...register('pcbPercentage')} />
              </div>
              <div className="space-y-2">
                <Label>PCM %</Label>
                <Input type="number" step="0.01" {...register('pcmPercentage')} />
              </div>
              <div className="space-y-2">
                <Label>Prev. NEET</Label>
                <Input type="number" {...register('previousNeetMarks')} />
              </div>
              <div className="space-y-2">
                <Label>Cur. NEET</Label>
                <Input type="number" {...register('presentNeetMarks')} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
              <div className="space-y-2">
                <Label>Physics</Label>
                <Input type="number" {...register('physicsMarks')} />
              </div>
              <div className="space-y-2">
                <Label>Chemistry</Label>
                <Input type="number" {...register('chemistryMarks')} />
              </div>
              <div className="space-y-2">
                <Label>Biology</Label>
                <Input type="number" {...register('biologyMarks')} />
              </div>
              <div className="space-y-2">
                <Label>Maths</Label>
                <Input type="number" {...register('mathsMarks')} />
              </div>
            </div>
          </div>

          <div className="col-span-full space-y-2 pt-4">
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
                <Input {...register(`preferences.${index}.location`)} placeholder="e.g. Bangalore, Delhi (comma separated)" />
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
        <CardContent className="space-y-6">
          <DocumentUpload
            registrationId={initialData?.id || undefined}
            studentName={watch('studentName')}
            initialDocuments={prefilledDocs.length > 0 ? prefilledDocs : (initialData?.documents || [])}
            onDocumentsChange={(docs) => setValue('documents', docs)}
            readOnly={false}
          />

          <div className="border-t pt-6">
            <DocumentTakeover
              control={control}
              register={register}
              setValue={setValue}
            />
          </div>

        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isLoading}
        className="bg-teal-600 hover:bg-teal-700 text-white min-w-[150px]"
      >
        {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Registration' : 'Create Registration')}
      </Button>
    </form >
  );
}
