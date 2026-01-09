'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDIAN_STATES } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Enquiry } from '@/lib/types';
import { User, GraduationCap, Users, BookOpen, Phone, Mail, MapPin } from 'lucide-react';

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
  familyPlace: z.string().optional(),
  familyState: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
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

interface EnquiryFormProps {
  initialData?: Enquiry;
  onSubmit: (data: EnquiryFormValues) => void;
  isLoading: boolean;
}

import { useEffect } from 'react';

// ... (existing imports)

export function EnquiryForm({ initialData, onSubmit, isLoading }: EnquiryFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EnquiryFormValues>({
    // @ts-ignore - zod resolver type mismatch with coerce.number()
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

  const selectedStream = watch('stream');
  const physicsMarks = watch('physicsMarks');
  const chemistryMarks = watch('chemistryMarks');
  const biologyMarks = watch('biologyMarks');
  const mathsMarks = watch('mathsMarks');

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

  return (
    // @ts-ignore
    // @ts-ignore
    <form onSubmit={handleSubmit((data) => onSubmit(data as any))} className="space-y-6">
      {/* Student Information */}
      <Card className="border-slate-200">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white">
              <User size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Student Information</CardTitle>
              <CardDescription className="text-sm">Basic details about the student</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-700 font-medium flex items-center gap-2">
                <span className="text-teal-600">*</span> Enquiry Date
              </Label>
              <Input type="date" {...register('date')} className="h-11 border-slate-300" />
              {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidateName" className="text-slate-700 font-medium flex items-center gap-2">
                <span className="text-teal-600">*</span> Candidate Name
              </Label>
              <Input {...register('candidateName')} placeholder="Full Name" className="h-11 border-slate-300" />
              {errors.candidateName && <p className="text-xs text-red-600">{errors.candidateName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-slate-700 font-medium">Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Label htmlFor="dob" className="text-slate-700 font-medium">Date of Birth</Label>
              <Input type="date" {...register('dob')} className="h-11 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-slate-700 font-medium flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span className="text-teal-600">*</span> Mobile Number
              </Label>
              <Input {...register('mobile')} placeholder="+91 98765 43210" className="h-11 border-slate-300" />
              {errors.mobile && <p className="text-xs text-red-600">{errors.mobile.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span className="text-teal-600">*</span> Email ID
              </Label>
              <Input type="email" {...register('email')} placeholder="name@example.com" className="h-11 border-slate-300" />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card className="border-slate-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Academic Details</CardTitle>
              <CardDescription className="text-sm">Educational background and preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-slate-700 font-medium flex items-center gap-2">
                <span className="text-teal-600">*</span> School Name
              </Label>
              <Input {...register('schoolName')} placeholder="Current school" className="h-11 border-slate-300" />
              {errors.schoolName && <p className="text-xs text-red-600">{errors.schoolName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolBoard" className="text-slate-700 font-medium">School Board</Label>
              <Controller
                name="schoolBoard"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-11 border-slate-300">
                      <SelectValue placeholder="Select Board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBSE">CBSE (Central Board)</SelectItem>
                      <SelectItem value="ICSE">ICSE (CISCE)</SelectItem>
                      <SelectItem value="NBSE">NBSE (Nagaland)</SelectItem>
                      <SelectItem value="SEBA">SEBA (Assam - High School)</SelectItem>
                      <SelectItem value="AHSEC">AHSEC (Assam - Higher Secondary)</SelectItem>
                      <SelectItem value="MBOSE">MBOSE (Meghalaya)</SelectItem>
                      <SelectItem value="MBSE">MBSE (Mizoram)</SelectItem>
                      <SelectItem value="TBSE">TBSE (Tripura)</SelectItem>
                      <SelectItem value="BoSEM">BoSEM (Manipur - High School)</SelectItem>
                      <SelectItem value="COHSEM">COHSEM (Manipur - Higher Secondary)</SelectItem>
                      <SelectItem value="State Board">Other State Board</SelectItem>
                      <SelectItem value="IB">IB</SelectItem>
                      <SelectItem value="IGCSE">IGCSE</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolPlace" className="text-slate-700 font-medium">School Place</Label>
              <Input {...register('schoolPlace')} placeholder="City/Town" className="h-11 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolState" className="text-slate-700 font-medium">School State</Label>
              <Controller
                name="schoolState"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-11 border-slate-300">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream" className="text-slate-700 font-medium flex items-center gap-2">
                <span className="text-teal-600">*</span> Stream
              </Label>
              <Controller
                name="stream"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-11 border-slate-300">
                      <SelectValue placeholder="Select Stream" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Commerce">Commerce</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stream && <p className="text-xs text-red-600">{errors.stream.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseInterested" className="text-slate-700 font-medium flex items-center gap-2">
                <BookOpen size={14} className="text-slate-400" />
                <span className="text-teal-600">*</span> Course Interested
              </Label>
              <Controller
                name="courseInterested"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-11 border-slate-300">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
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
              {errors.courseInterested && <p className="text-xs text-red-600">{errors.courseInterested.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Class 12 Passing Year</Label>
              <Input {...register('class12PassingYear')} placeholder="2023" className="h-11 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Class 10 Percentage</Label>
              <Input type="number" step="0.01" {...register('class10Percentage')} placeholder="85.5" className="h-11 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Class 12 Percentage</Label>
              <Input type="number" step="0.01" {...register('class12Percentage')} placeholder="88.2" className="h-11 border-slate-300" />
            </div>

            {/* Academic Marks - Only show for Science */}
            {selectedStream === 'Science' && (
              <>
                <div className="col-span-full">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Science Stream Details</p>
                    <p className="text-xs text-blue-700">Enter marks and percentages for science subjects</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">PCB Percentage (Auto)</Label>
                  <Input type="number" step="0.01" {...register('pcbPercentage')} readOnly className="h-11 border-slate-300 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">PCM Percentage (Auto)</Label>
                  <Input type="number" step="0.01" {...register('pcmPercentage')} readOnly className="h-11 border-slate-300 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Physics Marks</Label>
                  <Input type="number" {...register('physicsMarks')} placeholder="90" className="h-11 border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Chemistry Marks</Label>
                  <Input type="number" {...register('chemistryMarks')} placeholder="88" className="h-11 border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Biology Marks</Label>
                  <Input type="number" {...register('biologyMarks')} placeholder="92" className="h-11 border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Maths Marks</Label>
                  <Input type="number" {...register('mathsMarks')} placeholder="85" className="h-11 border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Previous NEET Marks</Label>
                  <Input type="number" {...register('previousNeetMarks')} placeholder="550" className="h-11 border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Present NEET Marks</Label>
                  <Input type="number" {...register('presentNeetMarks')} placeholder="600" className="h-11 border-slate-300" />
                </div>
              </>
            )}

            <div className="col-span-full flex flex-wrap gap-6 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <Controller
                  name="gapYear"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="gapYear" />
                  )}
                />
                <Label htmlFor="gapYear" className="text-slate-700 font-medium cursor-pointer">Gap Year</Label>
              </div>

              {watch('gapYear') && (
                <div className="flex gap-4 items-center w-full mt-2 pl-8">
                  <div className="flex-1">
                    <Label className="text-xs">From Year</Label>
                    <Input type="number" {...register('gapYearFrom')} placeholder="YYYY" className="h-9" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">To Year</Label>
                    <Input type="number" {...register('gapYearTo')} placeholder="YYYY" className="h-9" />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Controller
                  name="collegeDropout"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="collegeDropout" />
                  )}
                />
                <Label htmlFor="collegeDropout" className="text-slate-700 font-medium cursor-pointer">College Dropout</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Details */}
      <Card className="border-slate-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
              <Users size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Family Information</CardTitle>
              <CardDescription className="text-sm">Parent and guardian details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fatherName" className="text-slate-700 font-medium flex items-center gap-2">
                <span className="text-teal-600">*</span> Father's Name
              </Label>
              <Input {...register('fatherName')} placeholder="Enter father's name" className="h-11 border-slate-300" />
              {errors.fatherName && <p className="text-xs text-red-600">{errors.fatherName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherOccupation" className="text-slate-700 font-medium">Father's Occupation</Label>
              <Input {...register('fatherOccupation')} placeholder="Optional" className="h-11 border-slate-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherMobile" className="text-slate-700 font-medium">Father's Mobile</Label>
              <Input {...register('fatherMobile')} placeholder="Optional" className="h-11 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherName" className="text-slate-700 font-medium flex items-center gap-2">
                <span className="text-teal-600">*</span> Mother's Name
              </Label>
              <Input {...register('motherName')} placeholder="Enter mother's name" className="h-11 border-slate-300" />
              {errors.motherName && <p className="text-xs text-red-600">{errors.motherName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherOccupation" className="text-slate-700 font-medium">Mother's Occupation</Label>
              <Input {...register('motherOccupation')} placeholder="Optional" className="h-11 border-slate-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherMobile" className="text-slate-700 font-medium">Mother's Mobile</Label>
              <Input {...register('motherMobile')} placeholder="Optional" className="h-11 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="familyPlace" className="text-slate-700 font-medium">Family City/Place</Label>
              <Input {...register('familyPlace')} placeholder="City" className="h-11 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="familyState" className="text-slate-700 font-medium">Family State</Label>
              <Controller
                name="familyState"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-11 border-slate-300">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="col-span-full space-y-2">
              <Label htmlFor="permanentAddress" className="text-slate-700 font-medium flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span className="text-teal-600">*</span> Permanent Address
              </Label>
              <Input {...register('permanentAddress')} placeholder="Complete address" className="h-11 border-slate-300" />
              {errors.permanentAddress && <p className="text-xs text-red-600">{errors.permanentAddress.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" className="h-11 px-6 font-medium">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="h-11 px-8 bg-teal-600 hover:bg-teal-700 font-semibold">
          {isLoading ? 'Saving...' : 'Save Enquiry'}
        </Button>
      </div>
    </form>
  );
}
