import { api } from './api';
import {
  User, Role, Enquiry, Registration, Enrollment,
  Installment, DashboardAnalytics, Document, StudentDocument,
  Payment, Task, ReportMetrics, DocumentTransfer
} from './types';

export interface StudentRemark {
  id: number; // or string? Backend ID is number usually, but let's check serializer. Model ID is int. serialzer might return int.
  registration: number;
  user: number;
  userName: string;
  remark: string;
  createdAt: string;
  companyId: string;
}

// Helper to map snake_case to camelCase (simple version)
const mapEnquiry = (data: any): Enquiry => ({
  ...data,
  candidateName: data.candidate_name || data.candidateName,
  schoolName: data.school_name || data.schoolName,
  courseInterested: data.course_interested || data.courseInterested,
  fatherName: data.father_name || data.fatherName,
  motherName: data.mother_name || data.motherName,
  fatherOccupation: data.father_occupation || data.fatherOccupation,
  motherOccupation: data.mother_occupation || data.motherOccupation,
  fatherMobile: data.father_mobile || data.fatherMobile,
  motherMobile: data.mother_mobile || data.motherMobile,
  permanentAddress: data.permanent_address || data.permanentAddress,
  class12PassingYear: data.class12_passing_year || data.class12PassingYear,
  pcbPercentage: data.pcb_percentage || data.pcbPercentage,
  pcmPercentage: data.pcm_percentage || data.pcmPercentage,
  physicsMarks: data.physics_marks || data.physicsMarks,
  mathsMarks: data.maths_marks || data.mathsMarks,
  chemistryMarks: data.chemistry_marks || data.chemistryMarks,
  biologyMarks: data.biology_marks || data.biologyMarks,
  previousNeetMarks: data.previous_neet_marks || data.previousNeetMarks,
  presentNeetMarks: data.present_neet_marks || data.presentNeetMarks,
  gapYear: data.gap_year !== undefined ? data.gap_year : (data.gapYear || false),
  collegeDropout: data.college_dropout !== undefined ? data.college_dropout : (data.collegeDropout || false),
  paymentAmount: data.payment_amount || data.paymentAmount,
  otherLocation: data.other_location || data.otherLocation,

  // Map New Fields
  class10Percentage: data.class_10_percentage || data.class10Percentage,
  class10SchoolName: data.class_10_school_name || data.class10SchoolName,
  class10Board: data.class_10_board || data.class10Board,
  class10PassingYear: data.class_10_passing_year || data.class10PassingYear,
  class10Place: data.class_10_place || data.class10Place,
  class10State: data.class_10_state || data.class10State,
  class12Percentage: data.class_12_percentage || data.class12Percentage,
  schoolBoard: data.school_board || data.schoolBoard,
  schoolPlace: data.school_place || data.schoolPlace,
  schoolState: data.school_state || data.schoolState,
  familyPlace: data.family_place || data.familyPlace,
  familyState: data.family_state || data.familyState,
  gender: data.gender,
  dob: data.dob,
  gapYearFrom: data.gap_year_from || data.gapYearFrom,
  gapYearTo: data.gap_year_to || data.gapYearTo,

  preferredLocations: typeof data.preferred_locations === 'string' ? JSON.parse(data.preferred_locations) : (data.preferred_locations || []),
});

const mapRegistration = (data: any): Registration => ({
  id: data.id,
  registrationNo: data.registration_no ?? data.registrationNo,
  studentName: data.student_name ?? data.studentName,
  mobile: data.mobile,
  email: data.email,
  registrationDate: data.registration_date ?? data.registrationDate,
  needsLoan: data.needs_loan ?? data.needsLoan ?? false,
  paymentStatus: data.payment_status ?? data.paymentStatus,
  paymentMethod: data.payment_method ?? data.paymentMethod,
  registrationFee: data.registration_fee ?? data.registrationFee,
  fatherName: data.father_name ?? data.fatherName,
  motherName: data.mother_name ?? data.motherName,
  permanentAddress: data.permanent_address ?? data.permanentAddress,

  // Personal Details
  gender: data.gender,
  caste: data.caste,
  religion: data.religion,
  dateOfBirth: data.date_of_birth ? data.date_of_birth.split('T')[0] : data.dateOfBirth,

  // Parent Details
  fatherOccupation: data.father_occupation ?? data.fatherOccupation,
  motherOccupation: data.mother_occupation ?? data.motherOccupation,
  fatherMobile: data.father_mobile ?? data.fatherMobile,
  motherMobile: data.mother_mobile ?? data.motherMobile,
  familyPlace: data.family_place ?? data.familyPlace,
  familyState: data.family_state ?? data.familyState,

  // Class 12 / School Details
  schoolName: data.school_name ?? data.schoolName,
  schoolBoard: data.school_board ?? data.schoolBoard,
  schoolPlace: data.school_place ?? data.schoolPlace,
  schoolState: data.school_state ?? data.schoolState,
  class12Percentage: data.class12_percentage ?? data.class12Percentage,
  class12PassingYear: data.class12_passing_year ?? data.class12PassingYear,

  // Class 10 / HSLC Details
  class10SchoolName: data.class10_school_name ?? data.class10SchoolName,
  class10Board: data.class10_board ?? data.class10Board,
  class10Percentage: data.class10_percentage ?? data.class10Percentage,
  class10PassingYear: data.class10_passing_year ?? data.class10PassingYear,
  class10Place: data.class10_place ?? data.class10Place,
  class10State: data.class10_state ?? data.class10State,

  // Gap Year
  gapYear: data.gap_year ?? data.gapYear ?? false,
  gapYearFrom: data.gap_year_from ?? data.gapYearFrom,
  gapYearTo: data.gap_year_to ?? data.gapYearTo,
  collegeDropout: data.college_dropout ?? data.collegeDropout ?? false,

  // Science Marks
  pcbPercentage: data.pcb_percentage ?? data.pcbPercentage,
  pcmPercentage: data.pcm_percentage ?? data.pcmPercentage,
  physicsMarks: data.physics_marks ?? data.physicsMarks,
  chemistryMarks: data.chemistry_marks ?? data.chemistryMarks,
  biologyMarks: data.biology_marks ?? data.biologyMarks,
  mathsMarks: data.maths_marks ?? data.mathsMarks,
  previousNeetMarks: data.previous_neet_marks ?? data.previousNeetMarks,
  presentNeetMarks: data.present_neet_marks ?? data.presentNeetMarks,

  // Other fields from data
  preferences: data.preferences ?? [],
  documents: data.documents ?? [],
  student_documents: data.student_documents ?? [],
  enquiry: data.enquiry,
  created_by_name: data.created_by_name,
});

const mapEnrollment = (data: any): Enrollment => ({
  ...data,
  enrollmentNo: data.enrollment_no || data.enrollmentNo,
  studentName: data.student_name || data.studentName,
  programName: data.program_name || data.programName,
  startDate: data.start_date || data.startDate,
  durationMonths: data.duration_months || data.durationMonths || data.programDuration,
  totalFees: data.total_fees || data.totalFees,
  serviceCharge: data.commission_amount || data.serviceCharge,
  schoolFees: data.schoolFees,
  hostelFees: data.hostelFees,
  paymentType: data.paymentType,
  installmentsCount: data.installmentsCount,
  installmentAmount: data.installmentAmount,
  installments: data.installments,
});

export const apiClient = {
  auth: {
    login: async (email: string, role: Role = 'EMPLOYEE') => { throw new Error("Use authStore"); },
    logout: async () => { throw new Error("Use authStore"); },
    me: async () => { throw new Error("Use authStore"); }
  },

  dashboard: {
    getStats: async (): Promise<ReportMetrics> => {
      try {
        const res = await api.get('dashboard/stats/');
        return res.data;
      } catch (e) {
        console.error("Failed to fetch stats", e);
        return {
          enquiries: { value: 0, trend: 0 },
          registrations: { value: 0, trend: 0 },
          enrollments: { value: 0, trend: 0 },
          totalEarnings: { value: 0, trend: 0 },
          pendingPayments: 0
        };
      }
    },

    getWeeklyData: async (filter: '7days' | '30days' | 'month' = '7days') => {
      try {
        const res = await api.get(`dashboard/chart-data/?filter=${filter}`);
        return res.data;
      } catch (e) {
        console.error("Failed to fetch weekly data", e);
        return [];
      }
    },

    getRevenueData: async (filter: 'days' | 'weeks' | 'months' | 'years' = 'months') => {
      try {
        const res = await api.get('payments/');
        const payments = (res.data || []).filter((p: any) => p.status === 'Success');
        const today = new Date();

        if (filter === 'days') {
          // Last 7 days
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            return d;
          });
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return last7Days.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayRevenue = payments
              .filter((p: any) => p.date?.startsWith(dateStr))
              .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
            return { label: days[date.getDay()], revenue: dayRevenue };
          });
        } else if (filter === 'weeks') {
          // Last 4 weeks
          const weeks = Array.from({ length: 4 }, (_, i) => {
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (3 - i) * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return { start: weekStart, end: weekEnd, label: `Week ${i + 1}` };
          });
          return weeks.map(week => {
            const weekRevenue = payments
              .filter((p: any) => {
                const pDate = new Date(p.date);
                return pDate >= week.start && pDate <= week.end;
              })
              .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
            return { label: week.label, revenue: weekRevenue };
          });
        } else if (filter === 'months') {
          // Last 6 months
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(today);
            d.setMonth(d.getMonth() - (5 - i));
            return d;
          });
          return last6Months.map(date => {
            const month = date.getMonth();
            const year = date.getFullYear();
            const monthRevenue = payments
              .filter((p: any) => {
                const pDate = new Date(p.date);
                return pDate.getMonth() === month && pDate.getFullYear() === year;
              })
              .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
            return { label: months[month], revenue: monthRevenue };
          });
        } else {
          // Last 5 years
          const last5Years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - (4 - i));
          return last5Years.map(year => {
            const yearRevenue = payments
              .filter((p: any) => new Date(p.date).getFullYear() === year)
              .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
            return { label: year.toString(), revenue: yearRevenue };
          });
        }
      } catch (e) {
        console.error("Failed to fetch revenue data", e);
        return [];
      }
    },

    getActivity: async () => {
      try {
        const [enq, reg, pay] = await Promise.all([
          api.get('enquiries/?limit=5'),
          api.get('registrations/?limit=5'),
          api.get('payments/?limit=5')
        ]);

        const activities = [
          ...enq.data.map((i: any) => ({
            id: `enq-${i.id}`,
            text: `New enquiry from ${i.candidate_name || i.candidateName}`,
            time: new Date(i.date).toLocaleDateString(),
            timestamp: new Date(i.date).getTime()
          })),
          ...reg.data.map((i: any) => ({
            id: `reg-${i.id}`,
            text: `New registration: ${i.student_name || i.studentName}`,
            time: new Date(i.registration_date).toLocaleDateString(),
            timestamp: new Date(i.registration_date).getTime()
          })),
          ...pay.data.map((i: any) => ({
            id: `pay-${i.id}`,
            text: `Payment received: ₹${i.amount} from ${i.student_name}`,
            time: new Date(i.payment_date).toLocaleDateString(),
            timestamp: new Date(i.payment_date).getTime()
          }))
        ];
        return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
      } catch (e) {
        console.error("Failed to fetch activity", e);
        return [];
      }
    },

    getRecentEnquiries: async () => {
      try {
        const [enqRes, regRes, enrRes] = await Promise.all([
          api.get('enquiries/'),
          api.get('registrations/'),
          api.get('enrollments/')
        ]);

        // Create a map of enquiry_id to registration_id
        const enquiryToRegistration: { [key: string]: string } = {};
        regRes.data.forEach((reg: any) => {
          if (reg.enquiry) {
            enquiryToRegistration[reg.enquiry] = reg.id;
          }
        });

        // Create a map of registration_id to enrollment data
        const registrationToEnrollment: { [key: string]: { id: string, enrollmentNo: string } } = {};
        enrRes.data.forEach((enr: any) => {
          if (enr.student) {
            registrationToEnrollment[enr.student] = { id: enr.id, enrollmentNo: enr.enrollmentNo || enr.enrollment_no };
          }
        });

        return enqRes.data
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map((e: any) => {
            const registrationId = enquiryToRegistration[e.id] || null;
            const enrollment = registrationId ? registrationToEnrollment[registrationId] || null : null;
            return {
              id: e.id,
              registrationId,
              enrollmentId: enrollment?.id || null,
              enrollmentNo: enrollment?.enrollmentNo || null,
              name: e.candidate_name || e.candidateName,
              course: e.course_interested || e.courseInterested,
              time: new Date(e.date).toLocaleDateString(),
              status: e.status || 'New'
            };
          });
      } catch (e) {
        return [];
      }
    },

    getCounselorAnalytics: async () => {
      const res = await api.get('users/counselors_analytics/');
      return res.data;
    },
    getPaymentStats: async () => {
      const res = await api.get('payments/stats/');
      return res.data;
    }
  },

  enquiries: {
    list: async (): Promise<Enquiry[]> => {
      const res = await api.get('enquiries/');
      return res.data.map(mapEnquiry);
    },
    create: async (data: any): Promise<Enquiry> => {
      const payload = {
        ...data,
        candidate_name: data.candidateName,
        school_name: data.schoolName,
        course_interested: data.courseInterested,
        father_name: data.fatherName,
        mother_name: data.motherName,
        father_occupation: data.fatherOccupation,
        mother_occupation: data.motherOccupation,
        father_mobile: data.fatherMobile,
        mother_mobile: data.motherMobile,
        permanent_address: data.permanentAddress,
        class12_passing_year: data.class12PassingYear,
        pcb_percentage: data.pcbPercentage,
        pcm_percentage: data.pcmPercentage,
        physics_marks: data.physicsMarks,
        maths_marks: data.mathsMarks,
        chemistry_marks: data.chemistryMarks,
        biology_marks: data.biologyMarks,
        previous_neet_marks: data.previousNeetMarks,
        present_neet_marks: data.presentNeetMarks,
        gap_year: data.gapYear,
        college_dropout: data.collegeDropout,
        payment_amount: data.paymentAmount,
        other_location: data.otherLocation,

        // Payload for New Fields
        class_10_percentage: data.class10Percentage,
        class_10_school_name: data.class10SchoolName,
        class_10_board: data.class10Board,
        class_10_passing_year: data.class10PassingYear,
        class_10_place: data.class10Place,
        class_10_state: data.class10State,
        class_12_percentage: data.class12Percentage,
        school_board: data.schoolBoard,
        school_place: data.schoolPlace,
        school_state: data.schoolState,
        family_place: data.familyPlace,
        family_state: data.familyState,
        gender: data.gender,
        dob: data.dob,
        caste: data.caste,
        religion: data.religion,
        gap_year_from: data.gapYearFrom,
        gap_year_to: data.gapYearTo,

        preferred_locations: JSON.stringify(data.preferredLocations),
      };
      const res = await api.post('enquiries/', payload);
      return mapEnquiry(res.data);
    },
    get: async (id: string): Promise<Enquiry | undefined> => {
      const res = await api.get(`enquiries/${id}/`);
      return mapEnquiry(res.data);
    },
    update: async (id: string, data: any): Promise<Enquiry> => {
      const payload = {
        ...data,
        candidate_name: data.candidateName,
        school_name: data.schoolName,
        course_interested: data.courseInterested,
        father_name: data.fatherName,
        mother_name: data.motherName,
        father_occupation: data.fatherOccupation,
        mother_occupation: data.motherOccupation,
        father_mobile: data.fatherMobile,
        mother_mobile: data.motherMobile,
        permanent_address: data.permanentAddress,
        class12_passing_year: data.class12PassingYear,
        pcb_percentage: data.pcbPercentage,
        pcm_percentage: data.pcmPercentage,
        physics_marks: data.physicsMarks,
        maths_marks: data.mathsMarks,
        chemistry_marks: data.chemistryMarks,
        biology_marks: data.biologyMarks,
        previous_neet_marks: data.previousNeetMarks,
        present_neet_marks: data.presentNeetMarks,
        gap_year: data.gapYear,
        college_dropout: data.collegeDropout,
        payment_amount: data.paymentAmount,
        other_location: data.otherLocation,

        // Payload for New Fields (Update)
        class_10_percentage: data.class10Percentage,
        class_10_school_name: data.class10SchoolName,
        class_10_board: data.class10Board,
        class_10_passing_year: data.class10PassingYear,
        class_10_place: data.class10Place,
        class_10_state: data.class10State,
        class_12_percentage: data.class12Percentage,
        school_board: data.schoolBoard,
        school_place: data.schoolPlace,
        school_state: data.schoolState,
        family_place: data.familyPlace,
        family_state: data.familyState,
        gender: data.gender,
        dob: data.dob,
        caste: data.caste,
        religion: data.religion,
        gap_year_from: data.gapYearFrom,
        gap_year_to: data.gapYearTo,

        preferred_locations: JSON.stringify(data.preferredLocations),
      };
      const res = await api.put(`enquiries/${id}/`, payload);
      return mapEnquiry(res.data);
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`enquiries/${id}/`);
    }
  },

  registrations: {
    list: async (): Promise<Registration[]> => {
      const res = await api.get('registrations/');
      return res.data.map(mapRegistration);
    },
    create: async (data: any): Promise<Registration> => {
      const payload = {
        ...data,
        registration_no: `REG-${Date.now()}`,
        student_name: data.studentName,
        registration_date: new Date().toISOString(),
        needs_loan: data.needsLoan,
        payment_status: data.paymentStatus,
        payment_method: data.paymentMethod,
        registration_fee: data.registrationFee,
        father_name: data.fatherName,
        mother_name: data.motherName,
        permanent_address: data.permanentAddress,

        // New Fields Payload
        father_occupation: data.fatherOccupation,
        mother_occupation: data.motherOccupation,
        father_mobile: data.fatherMobile,
        mother_mobile: data.motherMobile,
        family_place: data.familyPlace,
        family_state: data.familyState,

        school_name: data.schoolName,
        school_board: data.schoolBoard,
        school_place: data.schoolPlace,
        school_state: data.schoolState,
        class10_percentage: data.class10Percentage,
        class12_percentage: data.class12Percentage,
        class12_passing_year: data.class12PassingYear,

        gap_year: data.gapYear,
        gap_year_from: data.gapYearFrom,
        gap_year_to: data.gapYearTo,
        college_dropout: data.collegeDropout,

        pcb_percentage: data.pcbPercentage,
        pcm_percentage: data.pcmPercentage,
        physics_marks: data.physicsMarks,
        chemistry_marks: data.chemistryMarks,
        biology_marks: data.biologyMarks,
        maths_marks: data.mathsMarks,
        previous_neet_marks: data.previousNeetMarks,
        present_neet_marks: data.presentNeetMarks,

        // Link to enquiry if converting from enquiry
        enquiry: data.enquiryId || data.enquiry || null,
      };
      const res = await api.post('registrations/', payload);
      return mapRegistration(res.data);
    },

    get: async (id: string): Promise<Registration | undefined> => {
      const res = await api.get(`registrations/${id}/`);
      return mapRegistration(res.data);
    },

    update: async (id: string, data: any): Promise<Registration> => {
      const payload = {
        student_name: data.studentName,
        mobile: data.mobile,
        email: data.email,
        date_of_birth: data.dateOfBirth,
        father_name: data.fatherName,
        mother_name: data.motherName,
        permanent_address: data.permanentAddress,
        registration_fee: data.registrationFee,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus,
        needs_loan: data.needsLoan,
        preferences: data.preferences,

        // Personal details
        gender: data.gender,
        caste: data.caste,
        religion: data.religion,

        // Parent Fields
        father_occupation: data.fatherOccupation,
        mother_occupation: data.motherOccupation,
        father_mobile: data.fatherMobile,
        mother_mobile: data.motherMobile,
        family_place: data.familyPlace,
        family_state: data.familyState,

        // Class 12 / School Fields
        school_name: data.schoolName,
        school_board: data.schoolBoard,
        school_place: data.schoolPlace,
        school_state: data.schoolState,
        class12_percentage: data.class12Percentage,
        class12_passing_year: data.class12PassingYear,

        // Class 10 Fields
        class10_school_name: data.class10SchoolName,
        class10_board: data.class10Board,
        class10_percentage: data.class10Percentage,
        class10_passing_year: data.class10PassingYear,
        class10_place: data.class10Place,
        class10_state: data.class10State,

        // Gap Year
        gap_year: data.gapYear,
        gap_year_from: data.gapYearFrom,
        gap_year_to: data.gapYearTo,
        college_dropout: data.collegeDropout,

        // Science Marks
        pcb_percentage: data.pcbPercentage,
        pcm_percentage: data.pcmPercentage,
        physics_marks: data.physicsMarks,
        chemistry_marks: data.chemistryMarks,
        biology_marks: data.biologyMarks,
        maths_marks: data.mathsMarks,
        previous_neet_marks: data.previousNeetMarks,
        present_neet_marks: data.presentNeetMarks,

        // Physical Documents (Document Takeover)
        student_documents: data.student_documents,
      };
      const res = await api.patch(`registrations/${id}/`, payload);
      return mapRegistration(res.data);
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`registrations/${id}/`);
    }
  },

  enrollments: {
    list: async (): Promise<Enrollment[]> => {
      const res = await api.get('enrollments/');
      return res.data.map(mapEnrollment);
    },
    create: async (data: any): Promise<Enrollment> => {
      const payload = {
        studentId: data.student || data.studentId,
        programName: data.programName,
        programDuration: data.durationMonths || data.programDuration,
        startDate: data.startDate,
        serviceCharge: data.serviceCharge || 0,
        schoolFees: data.schoolFees || 0,
        hostelFees: data.hostelFees || 0,
        university: data.university || '',
        paymentType: data.paymentType || 'Full',
        installmentsCount: data.installmentsCount,
        installmentAmount: data.installmentAmount,
      };
      const res = await api.post('enrollments/', payload);
      return mapEnrollment(res.data);
    },
    get: async (id: string): Promise<Enrollment | undefined> => {
      const res = await api.get(`enrollments/${id}/`);
      return mapEnrollment(res.data);
    },
    update: async (id: string, data: any): Promise<Enrollment> => {
      const payload = {
        ...data,
        // Serializer expects aliased field names
        programName: data.programName,
        startDate: data.startDate,
        programDuration: data.durationMonths, // Mapped to 'programDuration' in serializer source

        // Serializer expects camelCase for fees
        serviceCharge: data.serviceCharge,
        schoolFees: data.schoolFees,
        hostelFees: data.hostelFees,
        // total_fees is calculated by backend, but we can send it if needed (ignored by serializer)
        totalFees: data.totalFees,

        status: data.status,
      };
      const res = await api.patch(`enrollments/${id}/`, payload);
      return mapEnrollment(res.data);
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`enrollments/${id}/`);
    }
  },



  documents: {
    list: async (): Promise<Document[]> => {
      const res = await api.get('documents/');
      return res.data.map((d: any) => ({
        ...d,
        fileName: d.file_name,
        uploadedBy: d.uploaded_by,
        uploadedByName: d.uploaded_by_name,
        currentHolder: d.current_holder,
        currentHolderName: d.current_holder_name,
        uploadedAt: d.uploaded_at,
        studentName: d.student_name,
        expiryDate: d.expiry_date
      }));
    },
    create: async (data: FormData): Promise<Document> => {
      const res = await api.post('documents/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        ...res.data,
        fileName: res.data.file_name,
        uploadedBy: res.data.uploaded_by,
        uploadedByName: res.data.uploaded_by_name,
        currentHolder: res.data.current_holder,
        currentHolderName: res.data.current_holder_name,
        uploadedAt: res.data.uploaded_at,
        studentName: res.data.student_name,
        expiryDate: res.data.expiry_date
      };
    },
    uploadMock: async (file: { name: string }, type: string, studentName: string): Promise<Document> => {
      // Real upload would use FormData
      const payload = {
        file_name: file.name,
        type,
        student_name: studentName,
        status: 'IN'
      };
      const res = await api.post('documents/', payload);
      return {
        ...res.data,
        fileName: res.data.file_name,
        uploadedBy: 'User',
        uploadedAt: res.data.uploaded_at,
        studentName: res.data.student_name,
        expiryDate: res.data.expiry_date
      };
    },
    toggleStatus: async (id: string, status: 'IN' | 'OUT'): Promise<void> => {
      await api.patch(`documents/${id}/`, { status });
    },
    getExpiringSoon: async () => {
      const res = await api.get('documents/expiring_soon/');
      return res.data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`documents/${id}/`);
    },
    update: async (id: string, data: any): Promise<Document> => {
      const res = await api.patch(`documents/${id}/`, data);
      return {
        ...res.data,
        fileName: res.data.file_name,
        uploadedBy: res.data.uploaded_by,
        uploadedByName: res.data.uploaded_by_name,
        currentHolder: res.data.current_holder,
        currentHolderName: res.data.current_holder_name,
        uploadedAt: res.data.uploaded_at,
        studentName: res.data.student_name,
        expiryDate: res.data.expiry_date
      };
    }
  },

  payments: {
    list: async (): Promise<Payment[]> => {
      const res = await api.get('payments/');
      return res.data.map((p: any) => ({
        ...p,
        studentName: p.student_name
      }));
    },
    create: async (data: any): Promise<Payment> => {
      const payload = {
        ...data,
        student_name: data.studentName
      };
      const res = await api.post('payments/', payload);
      return { ...res.data, studentName: res.data.student_name };
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`payments/${id}/`);
    }
  },

  // NEW: Appointments
  appointments: {
    list: async () => {
      const res = await api.get('appointments/');
      return res.data.map((a: any) => ({
        ...a,
        studentName: a.student_name,
        studentEmail: a.student_email,
        counselorName: a.counselor_name
      }));
    },
    get: async (id: string) => {
      const res = await api.get(`appointments/${id}/`);
      return {
        ...res.data,
        studentName: res.data.student_name,
        studentEmail: res.data.student_email,
        counselorName: res.data.counselor_name
      };
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        student_name: data.studentName,
        student_email: data.studentEmail
      };
      const res = await api.post('appointments/', payload);
      return {
        ...res.data,
        studentName: res.data.student_name,
        studentEmail: res.data.student_email,
        counselorName: res.data.counselor_name
      };
    },
    update: async (id: string, data: any) => {
      const payload = {
        ...data,
        student_name: data.studentName,
        student_email: data.studentEmail
      };
      const res = await api.patch(`appointments/${id}/`, payload);
      return {
        ...res.data,
        studentName: res.data.student_name,
        studentEmail: res.data.student_email,
        counselorName: res.data.counselor_name
      };
    },
    delete: async (id: string) => {
      await api.delete(`appointments/${id}/`);
    },
    getCalendarView: async (month?: number, year?: number) => {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      const res = await api.get(`appointments/calendar_view/?${params.toString()}`);
      return res.data.map((a: any) => ({
        ...a,
        studentName: a.student_name,
        studentEmail: a.student_email,
        counselorName: a.counselor_name
      }));
    }
  },

  // NEW: Tasks
  studentRemarks: {
    list: async (registrationId: string) => {
      const res = await api.get(`student-remarks/?registration_id=${registrationId}`);
      return res.data.map((r: any) => ({
        id: r.id,
        registration: r.registration,
        user: r.user,
        userName: r.user_name,
        remark: r.remark,
        createdAt: r.created_at,
        companyId: r.company_id
      }));
    },
    create: async (data: { registration: string, remark: string }) => {
      const res = await api.post('student-remarks/', data);
      return {
        id: res.data.id,
        registration: res.data.registration,
        user: res.data.user,
        userName: res.data.user_name,
        remark: res.data.remark,
        createdAt: res.data.created_at,
        companyId: res.data.company_id
      };
    }
  },

  tasks: {
    list: async () => {
      const res = await api.get('tasks/');
      return res.data.map((t: any) => ({
        ...t,
        assignedTo: t.assigned_to,
        dueDate: t.due_date
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        assigned_to: data.assignedTo,
        due_date: data.dueDate,
        description: data.description,
        priority: data.priority
      };
      const res = await api.post('tasks/', payload);
      return {
        ...res.data,
        assignedTo: res.data.assigned_to,
        dueDate: res.data.due_date
      };
    },
    update: async (id: string, data: any) => {
      const payload = {
        ...data,
        assigned_to: data.assignedTo,
        due_date: data.dueDate,
        description: data.description,
        priority: data.priority
      };
      const res = await api.patch(`tasks/${id}/`, payload);
      return {
        ...res.data,
        assignedTo: res.data.assigned_to,
        dueDate: res.data.due_date
      };
    },
    delete: async (id: string) => {
      await api.delete(`tasks/${id}/`);
    },
    reorder: async (items: any[]) => {
      const res = await api.post('tasks/reorder/', { items });
      return res.data;
    },
    history: async (id: number | string): Promise<any[]> => {
      const res = await api.get(`tasks/${id}/history/`);
      return res.data;
    }
  },

  // NEW: Notifications
  notifications: {
    list: async () => {
      const res = await api.get('notifications/');
      return res.data.map((n: any) => ({
        ...n,
        actionUrl: n.action_url
      }));
    },
    markAsRead: async (id: string) => {
      await api.patch(`notifications/${id}/`, { read: true });
    },
    delete: async (id: string) => {
      await api.delete(`notifications/${id}/`);
    }
  },

  // NEW: Universities


  // NEW: Templates
  templates: {
    list: async () => {
      const res = await api.get('templates/');
      return res.data.map((t: any) => ({
        ...t,
        isActive: t.is_active,
        usageCount: t.usage_count || 0
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        is_active: data.isActive
      };
      const res = await api.post('templates/', payload);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const payload = {
        ...data,
        is_active: data.isActive
      };
      const res = await api.patch(`templates/${id}/`, payload);
      return res.data;
    },
    delete: async (id: string) => {
      await api.delete(`templates/${id}/`);
    }
  },


  // NEW: Commissions
  commissions: {
    list: async () => {
      const res = await api.get('commissions/');
      return res.data.map((c: any) => ({
        ...c,
        agentName: c.agent_name,
        studentName: c.student_name,
        enrollmentNo: c.enrollment_no,
        enrollmentFee: c.enrollment_fee,
        commissionAmount: c.commission_amount,
        enrollmentDate: c.enrollment_date
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        agent_name: data.agentName,
        student_name: data.studentName,
        enrollment_no: data.enrollmentNo,
        enrollment_fee: data.enrollmentFee,
        commission_amount: data.commissionAmount
      };
      const res = await api.post('commissions/', payload);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const payload = {
        ...data,
        agent_name: data.agentName,
        student_name: data.studentName,
        enrollment_no: data.enrollmentNo,
        enrollment_fee: data.enrollmentFee,
        commission_amount: data.commissionAmount
      };
      const res = await api.patch(`commissions/${id}/`, payload);
      return res.data;
    }
  },

  // NEW: Agents
  agents: {
    list: async () => {
      const res = await api.get('agents/');
      return res.data.map((a: any) => ({
        ...a,
        commissionType: a.commission_type,
        commissionValue: a.commission_value,
        totalEarned: a.total_earned,
        pendingAmount: a.pending_amount,
        studentsReferred: a.students_referred
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        commission_type: data.commissionType,
        commission_value: data.commissionValue,
        total_earned: data.totalEarned || 0,
        pending_amount: data.pendingAmount || 0,
        students_referred: data.studentsReferred || 0
      };
      const res = await api.post('agents/', payload);
      return res.data;
    }
  },


  // NEW: Lead Sources
  leadSources: {
    list: async () => {
      const res = await api.get('lead-sources/');
      return res.data.map((l: any) => ({
        ...l,
        totalLeads: l.total_leads,
        conversionRate: l.conversion_rate
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        total_leads: data.totalLeads || 0,
        conversion_rate: data.conversionRate || 0
      };
      const res = await api.post('lead-sources/', payload);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const payload = {
        ...data,
        total_leads: data.totalLeads,
        conversion_rate: data.conversionRate
      };
      const res = await api.patch(`lead-sources/${id}/`, payload);
      return res.data;
    },
    delete: async (id: string) => {
      await api.delete(`lead-sources/${id}/`);
    }
  },

  // NEW: Visa Tracking
  visaTracking: {
    list: async () => {
      const res = await api.get('visa-tracking/');
      return res.data.map((v: any) => ({
        ...v,
        studentName: v.student_name,
        passportNo: v.passport_no,
        visaType: v.visa_type,
        appliedDate: v.applied_date,
        currentStage: v.current_stage,
        interviewDate: v.interview_date,
        expectedDecision: v.expected_decision
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        student_name: data.studentName,
        passport_no: data.passportNo,
        visa_type: data.visaType,
        current_stage: data.currentStage,
        interview_date: data.interviewDate,
        expected_decision: data.expectedDecision
      };
      const res = await api.post('visa-tracking/', payload);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const payload = {
        ...data,
        student_name: data.studentName,
        passport_no: data.passportNo,
        visa_type: data.visaType,
        current_stage: data.currentStage,
        interview_date: data.interviewDate,
        expected_decision: data.expectedDecision
      };
      const res = await api.patch(`visa-tracking/${id}/`, payload);
      return res.data;
    }
  },

  // NEW: Follow-ups
  followUps: {
    list: async () => {
      const res = await api.get('follow-ups/');
      return res.data.map((f: any) => ({
        ...f,
        enquiryId: f.enquiry,
        scheduledFor: f.scheduled_for,
        assignedTo: f.assigned_to,
        assignedToName: f.assigned_to_name,
        assignedToEmail: f.assigned_to_email,
        studentName: f.student_name || '',
        student_email: f.student_email,
        student_phone: f.student_phone,
      }));
    },
    getDetails: async (id: string) => {
      const res = await api.get(`follow-ups/${id}/`);
      return {
        ...res.data,
        enquiryId: res.data.enquiry,
        scheduledFor: res.data.scheduled_for,
        assignedTo: res.data.assigned_to,
        assignedToName: res.data.assigned_to_name,
        studentName: res.data.student_name,
        student_email: res.data.student_email,
        student_phone: res.data.student_phone,
        comments: res.data.comments || []
      };
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        scheduled_for: data.scheduledFor,
        assigned_to_id: data.assignedToId,
        student_name: data.studentName
      };
      const res = await api.post('follow-ups/', payload);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const payload = {
        ...data,
        scheduled_for: data.scheduledFor,
        assigned_to_id: data.assignedToId,
        student_name: data.studentName
      };
      const res = await api.patch(`follow-ups/${id}/`, payload);
      return res.data;
    },
    completeWithComment: async (data: { id: string, comment: string, outcomeStatus?: string, admissionPossibility?: number }) => {
      const res = await api.post(`follow-ups/${data.id}/complete_with_comment/`, {
        comment: data.comment,
        outcome_status: data.outcomeStatus,
        admission_possibility: data.admissionPossibility
      });
      return res.data;
    },
    addComment: async (followupId: string, comment: string, parentCommentId?: string) => {
      const res = await api.post('followup-comments/', {
        followup: followupId,
        comment,
        parent_comment: parentCommentId || null
      });
      return res.data;
    },
    updateComment: async (commentId: string, comment: string) => {
      const res = await api.patch(`followup-comments/${commentId}/`, { comment });
      return res.data;
    },
    deleteComment: async (commentId: string) => {
      const res = await api.delete(`followup-comments/${commentId}/`);
      return res.data;
    },
    getComments: async (followupId: string) => {
      const res = await api.get(`followup-comments/?followup=${followupId}`);
      return res.data;
    }
  },

  // Company Users
  getCompanyUsers: async () => {
    const res = await api.get('users/company-users/');
    return res.data;
  },



  // NEW: Signup Requests (Dev Tools)
  signupRequests: {
    list: async () => {
      const res = await api.get('signup-requests/');
      return res.data.map((s: any) => ({
        ...s,
        companyName: s.company_name,
        adminName: s.admin_name,
        requestedAt: s.requested_at
      }));
    },
    approve: async (id: string) => {
      await api.patch(`signup-requests/${id}/`, { status: 'Approved' });
    },
    reject: async (id: string) => {
      await api.patch(`signup-requests/${id}/`, { status: 'Rejected' });
    }
  },


  studentDocuments: {
    list: async (registrationId?: string): Promise<StudentDocument[]> => {
      const params = registrationId ? { registration: registrationId } : {};
      const res = await api.get('student-documents/', { params });
      return res.data.map((d: any) => ({
        id: d.id,
        registration: d.registration,
        name: d.name,
        documentNumber: d.document_number,
        status: d.status,
        receivedAt: d.received_at,
        returnedAt: d.returned_at,
        remarks: d.remarks,
        createdBy: d.created_by,
        created_by_name: d.created_by_name,
        current_holder: d.current_holder,
        current_holder_name: d.current_holder_name
      }));
    },
    create: async (data: any): Promise<StudentDocument> => {
      const res = await api.post('student-documents/', {
        registration: data.registration,
        name: data.name,
        document_number: data.documentNumber || data.document_number,
        remarks: data.remarks,
        status: data.status
      });
      return {
        id: res.data.id,
        registration: res.data.registration,
        name: res.data.name,
        documentNumber: res.data.document_number,
        status: res.data.status,
        receivedAt: res.data.received_at,
        returnedAt: res.data.returned_at,
        remarks: res.data.remarks,
        createdBy: res.data.created_by
      };
    },
    returnDocs: async (docIds: string[]): Promise<any> => {
      const res = await api.post('student-documents/return_docs/', { document_ids: docIds });
      return res.data;
    }
  },

  // Users Management
  users: {
    list: async () => {
      const res = await api.get('users/');
      return res.data;
    },
    create: async (data: {
      username: string;
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      role: 'EMPLOYEE' | 'MANAGER';
    }) => {
      const res = await api.post('users/', data);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const res = await api.patch(`users/${id}/`, data);
      return res.data;
    },
    delete: async (id: string) => {
      await api.delete(`users/${id}/`);
    }
  },

  // NEW: Companies
  companies: {
    get: async (id: string) => {
      const res = await api.get(`companies/${id}/`);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const res = await api.patch(`companies/${id}/`, data);
      return res.data;
    },
    getCurrent: async () => {
      const res = await api.get('companies/current/');
      return res.data;
    }
  },

  // NEW: Earnings
  earnings: {
    subscriptions: async (timeRange?: string) => {
      const res = await api.get('earnings/subscriptions/', {
        params: timeRange ? { time_range: timeRange } : {}
      });
      return res.data;
    },
    business: async (timeRange?: string) => {
      const res = await api.get('earnings/revenue/', {
        params: timeRange ? { time_range: timeRange } : {}
      });
      return res.data;
    }
  },

  reports: {
    getOverview: async (timeRange?: string) => {
      const res = await api.get('reports/overview/', {
        params: timeRange ? { time_range: timeRange } : {}
      });
      return res.data;
    }
  },

  approvalRequests: {
    create: async (data: {
      action: 'DELETE' | 'UPDATE';
      entity_type: string;
      entity_id: string;
      entity_name: string;
      message: string;
      pending_changes?: any;
    }) => {
      const res = await api.post('approval-requests/', data);
      return res.data;
    },
    list: async () => {
      const res = await api.get('approval-requests/');
      return res.data;
    },
    pendingCount: async () => {
      const res = await api.get('approval-requests/pending-count/');
      return res.data;
    },
    approve: async (id: string, note?: string) => {
      const res = await api.post(`approval-requests/${id}/approve/`, { review_note: note });
      return res.data;
    },
    reject: async (id: string, note: string) => {
      const res = await api.post(`approval-requests/${id}/reject/`, { review_note: note });
      return res.data;
    },
    myRequests: async () => {
      const res = await api.get('approval-requests/my_requests/');
      return res.data;
    }
  },



  documentTransfers: {
    list: async () => {
      const res = await api.get('document-transfers/');
      return res.data;
    },
    get: async (id: string) => {
      const res = await api.get(`document-transfers/${id}/`);
      return res.data;
    },
    create: async (data: any) => {
      const payload = {
        receiver: data.receiver,
        documents: data.documents,
        message: data.message || ''
      };
      const res = await api.post('document-transfers/', payload);
      return res.data;
    },
    accept: async (id: string) => {
      const res = await api.post(`document-transfers/${id}/accept/`);
      return res.data;
    },
    reject: async (id: string) => {
      const res = await api.post(`document-transfers/${id}/reject/`);
      return res.data;
    },
    cancel: async (id: string) => {
      const res = await api.post(`document-transfers/${id}/cancel/`);
      return res.data;
    }
  },

  physicalTransfers: {
    list: async () => {
      const res = await api.get('physical-transfers/');
      return res.data;
    },
    get: async (id: string) => {
      const res = await api.get(`physical-transfers/${id}/`);
      return res.data;
    },
    create: async (data: any) => {
      const payload = {
        receiver: data.receiver,
        documents: data.documents,
        message: data.message || ''
      };
      const res = await api.post('physical-transfers/', payload);
      return res.data;
    },
    accept: async (id: string) => {
      const res = await api.post(`physical-transfers/${id}/accept/`);
      return res.data;
    },
    reject: async (id: string, reason?: string) => {
      const res = await api.post(`physical-transfers/${id}/reject/`, { reason: reason || '' });
      return res.data;
    },
    cancel: async (id: string) => {
      const res = await api.post(`physical-transfers/${id}/cancel/`);
      return res.data;
    },
    updateStatus: async (id: string, data: { status: string, note?: string, location?: string, tracking_number?: string, courier_name?: string }) => {
      const res = await api.post(`physical-transfers/${id}/update_status/`, data);
      return res.data;
    },
    confirmReceipt: async (id: string, message?: string) => {
      const res = await api.post(`physical-transfers/${id}/confirm_receipt/`, { message: message || '' });
      return res.data;
    },
  },

  refunds: {
    create: async (data: any) => {
      const payload = {
        payment: data.paymentId,
        amount: data.amount,
        refund_method: data.refundMethod,
        refund_date: data.refundDate,
        reason: data.reason,
        student_name: data.studentName,
        status: 'Pending',
        company_id: ''
      };
      const res = await api.post('refunds/', payload);
      return res.data;
    },
    list: async (filters?: { status?: string; student_name?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.student_name) params.append('student_name', filters.student_name);
      const res = await api.get(`refunds/?${params.toString()}`);
      return res.data;
    },
    approve: async (id: string) => {
      const res = await api.post(`refunds/${id}/approve/`);
      return res.data;
    },
  },



  universities: {
    list: async () => {
      const res = await api.get('universities/');
      return res.data.map((u: any) => ({
        id: u.id,
        name: u.name,
        country: u.country,
        city: u.city,
        ranking: u.ranking,
        programs: u.programs || [],
        tuitionFee: {
          min: parseFloat(u.tuition_fee_min || 0),
          max: parseFloat(u.tuition_fee_max || 0)
        },
        admissionDeadline: u.admission_deadline || '',
        requirements: u.requirements || [],
        rating: parseFloat(u.rating || 0),
        company_id: u.company_id
      }));
    },
    create: async (data: any) => {
      const payload = {
        name: data.name,
        country: data.country,
        city: data.city || '',
        ranking: parseInt(data.ranking) || 0,
        programs: data.programs || [],
        tuition_fee_min: parseFloat(data.tuitionFee?.min || data.tuitionMin || 0),
        tuition_fee_max: parseFloat(data.tuitionFee?.max || data.tuitionMax || 0),
        admission_deadline: data.admissionDeadline || data.deadline || '',
        requirements: data.requirements || [],
        rating: parseFloat(data.rating || 0),
        company_id: data.company_id || ''
      };
      const res = await api.post('universities/', payload);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const payload = {
        name: data.name,
        country: data.country,
        city: data.city || '',
        ranking: parseInt(data.ranking) || 0,
        programs: data.programs || [],
        tuition_fee_min: parseFloat(data.tuitionFee?.min || data.tuitionMin || 0),
        tuition_fee_max: parseFloat(data.tuitionFee?.max || data.tuitionMax || 0),
        admission_deadline: data.admissionDeadline || data.deadline || '',
        requirements: data.requirements || [],
        rating: parseFloat(data.rating || 0),
        company_id: data.company_id || ''
      };
      const res = await api.put(`universities/${id}/`, payload);
      return res.data;
    },
    delete: async (id: string) => {
      const res = await api.delete(`universities/${id}/`);
      return res.data;
    },
  },

  // Chat API - End-to-End Encrypted Messaging
  chat: {
    getConversations: async () => {
      const res = await api.get('chat/conversations/');
      return res.data;
    },
    getMessages: async (conversationId: string) => {
      const res = await api.get(`chat/conversations/${conversationId}/messages/`);
      return res.data;
    },
    sendMessage: async (conversationId: string, content: any) => {
      const res = await api.post('chat/send/', {
        conversation_id: conversationId,
        content
      });
      return res.data;
    },
    createConversation: async (participantIds: string[]) => {
      const res = await api.post('chat/create/', {
        participant_ids: participantIds
      });
      return res.data;
    },
    markAsRead: async (messageId: string) => {
      const res = await api.post(`chat/messages/${messageId}/read/`);
      return res.data;
    },
    createGroup: async (conversationId: string, groupName: string) => {
      const res = await api.post('group-chats/', {
        conversation: conversationId,
        group_name: groupName
      });
      return res.data;
    }
  },

};
