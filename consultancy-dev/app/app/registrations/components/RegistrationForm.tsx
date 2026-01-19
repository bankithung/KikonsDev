'use client';

import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { DocumentTakeover } from '@/components/common/DocumentTakeover';
import { INDIAN_STATES } from '@/lib/utils';
import { cn } from '@/lib/utils';

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

  // Academic Fields
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
    // @ts-ignore
    resolver: zodResolver(registrationSchema),
    defaultValues: initialData || {
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      needsLoan: false,
      registrationFee: 5000,
      preferences: [{ courseName: '', location: '', priority: 1 }],
      gapYear: false,
      student_documents: [],
      documentTakeoverEnabled: false,
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
            const fieldsToMap: any = {
              studentName: enq.candidateName,
              email: enq.email,
              mobile: enq.mobile,
              fatherName: enq.fatherName,
              motherName: enq.motherName,
              fatherOccupation: enq.fatherOccupation,
              motherOccupation: enq.motherOccupation,
              fatherMobile: enq.fatherMobile,
              motherMobile: enq.motherMobile,
              permanentAddress: enq.permanentAddress,
              schoolName: enq.schoolName,
              schoolBoard: enq.schoolBoard,
              schoolPlace: enq.schoolPlace,
              schoolState: enq.schoolState,
              class10SchoolName: enq.class10SchoolName,
              class10Board: enq.class10Board,
              class10Place: enq.class10Place,
              class10State: enq.class10State,
              class10PassingYear: enq.class10PassingYear,
              class10Percentage: enq.class10Percentage,
              class12Percentage: enq.class12Percentage,
              class12PassingYear: enq.class12PassingYear,
              gapYear: enq.gapYear,
              gapYearFrom: enq.gapYearFrom,
              gapYearTo: enq.gapYearTo,
              familyPlace: enq.familyPlace,
              familyState: enq.familyState,
              pcbPercentage: enq.pcbPercentage,
              pcmPercentage: enq.pcmPercentage,
              physicsMarks: enq.physicsMarks,
              chemistryMarks: enq.chemistryMarks,
              biologyMarks: enq.biologyMarks,
              mathsMarks: enq.mathsMarks,
              previousNeetMarks: enq.previousNeetMarks,
              presentNeetMarks: enq.presentNeetMarks,
            };

            if (enq.gender) fieldsToMap.gender = enq.gender;
            if (enq.dob) fieldsToMap.dateOfBirth = enq.dob.split('T')[0];

            Object.entries(fieldsToMap).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                setValue(key as any, value);
              }
            });

            if (enq.preferredLocations.length > 0 && enq.courseInterested) {
              setValue('preferences', enq.preferredLocations.map((loc, idx) => ({
                courseName: enq.courseInterested,
                location: loc,
                priority: idx + 1
              })));
            }

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
    const processedPreferences = data.preferences.flatMap(pref => {
      if (pref.location && pref.location.includes(',')) {
        return pref.location.split(',').map(loc => ({
          ...pref,
          location: loc.trim()
        })).filter(p => p.location);
      }
      return pref;
    });

    onSubmit({
      ...data,
      preferences: processedPreferences
    });
  };

  const gapYear = watch('gapYear');

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit as any)}>
        <Card className="bg-white border-none shadow-sm rounded-xl">
          <CardContent className="p-6 md:p-8 space-y-8">

            {/* Student Info */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Student Name</Label>
                  <Input {...register('studentName')} className="h-11 border-slate-300" placeholder="Full Name" />
                  {errors.studentName && <p className="text-sm text-red-500">{errors.studentName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Email Address</Label>
                  <Input {...register('email')} className="h-11 border-slate-300" placeholder="email@example.com" />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Mobile Number</Label>
                  <Input {...register('mobile')} className="h-11 border-slate-300" placeholder="+91" />
                  {errors.mobile && <p className="text-sm text-red-500">{errors.mobile.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Gender</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="h-11 border-slate-300">
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
                  <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
                  <Input type="date" {...register('dateOfBirth')} className="h-11 border-slate-300" />
                  {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2"></div>

            {/* Parents Info */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Parents & Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Father's Name</Label>
                  <Input {...register('fatherName')} className="h-11 border-slate-300" placeholder="Father's Full Name" />
                  {errors.fatherName && <p className="text-sm text-red-500">{errors.fatherName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Mother's Name</Label>
                  <Input {...register('motherName')} className="h-11 border-slate-300" placeholder="Mother's Full Name" />
                  {errors.motherName && <p className="text-sm text-red-500">{errors.motherName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Father's Occupation</Label>
                  <Input {...register('fatherOccupation')} className="h-11 border-slate-300" placeholder="e.g. Govt. Servant" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Mother's Occupation</Label>
                  <Input {...register('motherOccupation')} className="h-11 border-slate-300" placeholder="e.g. Housewife" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Father's Mobile</Label>
                  <Input {...register('fatherMobile')} className="h-11 border-slate-300" placeholder="Father's Contact No" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Mother's Mobile</Label>
                  <Input {...register('motherMobile')} className="h-11 border-slate-300" placeholder="Mother's Contact No" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Family City/Place</Label>
                  <Input {...register('familyPlace')} className="h-11 border-slate-300" placeholder="City or Town" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Family State</Label>
                  <Controller
                    name="familyState"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="h-11 border-slate-300"><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {INDIAN_STATES.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Permanent Address</Label>
                  <Input {...register('permanentAddress')} className="h-11 border-slate-300" placeholder="Full Permanent Address" />
                  {errors.permanentAddress && <p className="text-sm text-red-500">{errors.permanentAddress.message}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2"></div>

            {/* Academic Details */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Academic Details</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Class 10 */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-teal-500 rounded-full"></div>
                    HSLC (Class 10)
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">School Name</Label>
                      <Input {...register('class10SchoolName')} className="h-10 bg-white" placeholder="School Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Board</Label>
                        <Controller name="class10Board" control={control} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Board" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SEBA">SEBA</SelectItem><SelectItem value="CBSE">CBSE</SelectItem>
                              <SelectItem value="ICSE">ICSE</SelectItem><SelectItem value="NBSE">NBSE</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Passing Year</Label>
                        <Input {...register('class10PassingYear')} className="h-10 bg-white" placeholder="YYYY" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">% / CGPA</Label>
                      <Input type="number" step="0.01" {...register('class10Percentage')} className="h-10 bg-white" placeholder="e.g. 85.50" />
                    </div>
                  </div>
                </div>

                {/* Class 12 */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    HSSLC (Class 12)
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">School Name</Label>
                      <Input {...register('schoolName')} className="h-10 bg-white" placeholder="School Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Board</Label>
                        <Controller name="schoolBoard" control={control} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Board" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AHSEC">AHSEC</SelectItem><SelectItem value="CBSE">CBSE</SelectItem>
                              <SelectItem value="NBSE">NBSE</SelectItem><SelectItem value="ICSE">ICSE</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Passing Year</Label>
                        <Input {...register('class12PassingYear')} className="h-10 bg-white" placeholder="YYYY" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">% / CGPA</Label>
                      <Input type="number" step="0.01" {...register('class12Percentage')} className="h-10 bg-white" placeholder="e.g. 85.50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Marks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Physics</Label>
                  <Input type="number" {...register('physicsMarks')} className="h-10" placeholder="Marks" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Chemistry</Label>
                  <Input type="number" {...register('chemistryMarks')} className="h-10" placeholder="Marks" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Biology</Label>
                  <Input type="number" {...register('biologyMarks')} className="h-10" placeholder="Marks" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Maths</Label>
                  <Input type="number" {...register('mathsMarks')} className="h-10" placeholder="Marks" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 font-medium">PCB %</Label>
                  <Input type="number" step="0.01" {...register('pcbPercentage')} className="h-10 bg-slate-50" readOnly />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 font-medium">PCM %</Label>
                  <Input type="number" step="0.01" {...register('pcmPercentage')} className="h-10 bg-slate-50" readOnly />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Prev. NEET</Label>
                  <Input type="number" {...register('previousNeetMarks')} className="h-10" placeholder="Score" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Cur. NEET</Label>
                  <Input type="number" {...register('presentNeetMarks')} className="h-10" placeholder="Score" />
                </div>
              </div>

              {/* Gap Year */}
              <div className="mt-6 p-4 bg-yellow-50/50 rounded-lg border border-yellow-100">
                <div className="flex items-center space-x-2 mb-4">
                  <Controller
                    name="gapYear"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} id="gapYear" />
                    )}
                  />
                  <Label htmlFor="gapYear" className="font-medium cursor-pointer text-slate-800">Has Gap Year?</Label>
                </div>
                {gapYear && (
                  <div className="grid grid-cols-2 gap-6 pl-6">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">From Year</Label>
                      <Input type="number" {...register('gapYearFrom')} className="h-10 bg-white" placeholder="YYYY" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">To Year</Label>
                      <Input type="number" {...register('gapYearTo')} className="h-10 bg-white" placeholder="YYYY" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2"></div>

            {/* Study Preferences */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-900">Study Preferences</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ courseName: '', location: '', priority: fields.length + 1 })}
                  className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700 h-9"
                >
                  <Plus size={16} className="mr-2" /> Add
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="md:col-span-1 flex items-center justify-center p-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold font-mono">
                        {index + 1}
                      </span>
                    </div>
                    <div className="md:col-span-5 space-y-1">
                      <Label className="text-xs text-slate-500">Course</Label>
                      <Input {...register(`preferences.${index}.courseName`)} className="h-9 bg-white" placeholder="e.g. MBBS" />
                    </div>
                    <div className="md:col-span-5 space-y-1">
                      <Label className="text-xs text-slate-500">Location(s)</Label>
                      <Input {...register(`preferences.${index}.location`)} className="h-9 bg-white" placeholder="City or Country" />
                    </div>
                    <div className="md:col-span-1 flex justify-center pb-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                {errors.preferences && <p className="text-sm text-red-500 px-1">{errors.preferences.message}</p>}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2"></div>

            {/* Registration Details */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Registration Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Fee Amount</Label>
                  <Input type="number" {...register('registrationFee')} className="h-11 border-slate-300" placeholder="e.g. 5000" />
                  {errors.registrationFee && <p className="text-sm text-red-500">{errors.registrationFee.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Payment Method</Label>
                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-11 border-slate-300"><SelectValue placeholder="Select Method" /></SelectTrigger>
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
                  <Label className="text-sm font-medium text-slate-700">Payment Status</Label>
                  <Controller
                    name="paymentStatus"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-11 border-slate-300"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="md:col-span-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="needsLoan"
                      control={control}
                      render={({ field }) => (
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} id="needsLoan" />
                      )}
                    />
                    <Label htmlFor="needsLoan" className="font-medium cursor-pointer">Student Needs Edu Loan Support</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2"></div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Documents</h3>
              <div className="space-y-6">
                <DocumentUpload
                  registrationId={initialData?.id || undefined}
                  studentName={watch('studentName')}
                  initialDocuments={prefilledDocs.length > 0 ? prefilledDocs : (initialData?.documents || [])}
                  onDocumentsChange={(docs) => setValue('documents', docs)}
                  readOnly={false}
                />
                <div className="border-t border-slate-100 pt-6">
                  <DocumentTakeover
                    control={control}
                    register={register}
                    setValue={setValue}
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white min-w-[200px] h-11 text-base shadow-sm"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEdit ? 'Updating...' : 'Creating...'}</>
                ) : (
                  isEdit ? 'Update Registration' : 'Create Registration'
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
