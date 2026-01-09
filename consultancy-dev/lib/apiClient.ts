import { api } from './api';
import {
  User, Role, Enquiry, Registration, Enrollment,
  Installment, DashboardAnalytics, Document, StudentDocument,
  Payment, Task, ReportMetrics, DocumentTransfer
} from './types';

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
  ...data,
  registrationNo: data.registration_no || data.registrationNo,
  studentName: data.student_name || data.studentName,
  registrationDate: data.registration_date || data.registrationDate,
  needsLoan: data.needs_loan || data.needsLoan,
  paymentStatus: data.payment_status || data.paymentStatus,
  paymentMethod: data.payment_method || data.paymentMethod,
  registrationFee: data.registration_fee || data.registrationFee,
  fatherName: data.father_name || data.fatherName,
  motherName: data.mother_name || data.motherName,
  permanentAddress: data.permanent_address || data.permanentAddress,

  // New Fields Mapping
  fatherOccupation: data.father_occupation || data.fatherOccupation,
  motherOccupation: data.mother_occupation || data.motherOccupation,
  fatherMobile: data.father_mobile || data.fatherMobile,
  motherMobile: data.mother_mobile || data.motherMobile,
  gender: data.gender,
  dateOfBirth: data.date_of_birth ? data.date_of_birth.split('T')[0] : data.dateOfBirth,


  familyPlace: data.family_place || data.familyPlace,
  familyState: data.family_state || data.familyState,

  schoolName: data.school_name || data.schoolName,
  schoolBoard: data.school_board || data.schoolBoard,
  schoolPlace: data.school_place || data.schoolPlace,
  schoolState: data.school_state || data.schoolState,
  class10Percentage: data.class10_percentage || data.class10Percentage,
  class12Percentage: data.class12_percentage || data.class12Percentage,
  class12PassingYear: data.class12_passing_year || data.class12PassingYear,

  gapYear: data.gap_year || data.gapYear,
  gapYearFrom: data.gap_year_from || data.gapYearFrom,
  gapYearTo: data.gap_year_to || data.gapYearTo,
  collegeDropout: data.college_dropout || data.collegeDropout,

  pcbPercentage: data.pcb_percentage || data.pcbPercentage,
  pcmPercentage: data.pcm_percentage || data.pcmPercentage,
  physicsMarks: data.physics_marks || data.physicsMarks,
  chemistryMarks: data.chemistry_marks || data.chemistryMarks,
  biologyMarks: data.biology_marks || data.biologyMarks,
  mathsMarks: data.maths_marks || data.mathsMarks,
  previousNeetMarks: data.previous_neet_marks || data.previousNeetMarks,
  presentNeetMarks: data.present_neet_marks || data.presentNeetMarks,
});

const mapEnrollment = (data: any): Enrollment => ({
  ...data,
  enrollmentNo: data.enrollment_no || data.enrollmentNo,
  studentName: data.student_name || data.studentName,
  programName: data.program_name || data.programName,
  startDate: data.start_date || data.startDate,
  durationMonths: data.duration_months || data.durationMonths,
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
        const [enq, reg, enr, pay] = await Promise.all([
          api.get('enquiries/'),
          api.get('registrations/'),
          api.get('enrollments/'),
          api.get('payments/')
        ]);
        return {
          enquiriesCount: enq.data.length,
          registrationsCount: reg.data.length,
          enrollmentsCount: enr.data.length,
          pendingPayments: pay.data.filter((p: any) => p.status === 'Pending').length,
          pendingTransfers: 0
        };
      } catch (e) {
        console.error("Failed to fetch stats", e);
        return { enquiriesCount: 0, registrationsCount: 0, enrollmentsCount: 0, pendingPayments: 0, pendingTransfers: 0 };
      }
    },

    getWeeklyData: async () => {
      try {
        const [enq, reg, enr] = await Promise.all([
          api.get('enquiries/'),
          api.get('registrations/'),
          api.get('enrollments/')
        ]);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - i));
          return d;
        });

        return last7Days.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = index === last7Days.length - 1;

          return {
            name: days[date.getDay()],
            enquiries: enq.data.filter((i: any) => i.date?.startsWith(dateStr)).length,
            registrations: reg.data.filter((i: any) => i.registration_date?.startsWith(dateStr)).length,
            enrollments: isToday ? enr.data.length : 0,
          };
        });
      } catch (e) {
        console.error("Failed to fetch weekly data", e);
        return [];
      }
    },

    getRevenueData: async () => {
      try {
        const res = await api.get('earnings/revenue/');
        const monthlyEarnings = res.data.monthlyEarnings || [];
        return monthlyEarnings.map((item: any) => ({
          month: item.month,
          revenue: item.revenue
        }));
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
        const res = await api.get('enquiries/');
        return res.data
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map((e: any) => ({
            name: e.candidate_name || e.candidateName,
            course: e.course_interested || e.courseInterested,
            time: new Date(e.date).toLocaleDateString(),
            status: e.status || 'New'
          }));
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
        class_12_percentage: data.class12Percentage,
        school_board: data.schoolBoard,
        school_place: data.schoolPlace,
        school_state: data.schoolState,
        family_place: data.familyPlace,
        family_state: data.familyState,
        gender: data.gender,
        dob: data.dob,
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
        class_12_percentage: data.class12Percentage,
        school_board: data.schoolBoard,
        school_place: data.schoolPlace,
        school_state: data.schoolState,
        family_place: data.familyPlace,
        family_state: data.familyState,
        gender: data.gender,
        dob: data.dob,
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

        // New Fields Update
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
        ...data,
        enrollment_no: `ENR-${Date.now()}`,
        student_name: data.studentName,
        program_name: data.programName,
        start_date: data.startDate,
        duration_months: data.durationMonths,
        total_fees: data.totalFees,
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
        student_name: data.studentName,
        program_name: data.programName,
        start_date: data.startDate,
        duration_months: data.durationMonths,
        total_fees: data.totalFees,
      };
      const res = await api.put(`enrollments/${id}/`, payload);
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
        studentEmail: a.student_email
      }));
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
        studentEmail: res.data.student_email
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
        studentEmail: res.data.student_email
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
        studentEmail: a.student_email
      }));
    }
  },

  // NEW: Tasks
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
        due_date: data.dueDate
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
        due_date: data.dueDate
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
  universities: {
    list: async () => {
      const res = await api.get('universities/');
      return res.data.map((u: any) => ({
        ...u,
        tuitionFee: {
          min: u.tuition_fee_min,
          max: u.tuition_fee_max
        },
        admissionDeadline: u.admission_deadline
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        tuition_fee_min: data.tuitionFee?.min || 0,
        tuition_fee_max: data.tuitionFee?.max || 0,
        admission_deadline: data.admissionDeadline || data.deadline || '',
        ranking: data.ranking || 0,
        rating: data.rating || 0,
        programs: data.programs || [],
        requirements: data.requirements || []
      };
      const res = await api.post('universities/', payload);
      return res.data;
    }
  },

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

  // NEW: Refunds
  refunds: {
    list: async () => {
      const res = await api.get('refunds/');
      return res.data;
    },
    create: async (data: any) => {
      const res = await api.post('refunds/', data);
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
        studentName: f.student_name || ''
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        scheduled_for: data.scheduledFor,
        assigned_to: data.assignedTo,
        student_name: data.studentName
      };
      const res = await api.post('follow-ups/', payload);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const payload = {
        ...data,
        scheduled_for: data.scheduledFor,
        assigned_to: data.assignedTo,
        student_name: data.studentName
      };
      const res = await api.patch(`follow-ups/${id}/`, payload);
      return res.data;
    }
  },

  // NEW: Chat System
  chat: {
    getConversations: async () => {
      const res = await api.get('chat-conversations/');
      return res.data;
    },
    getMessages: async (conversationId: string) => {
      const res = await api.get(`chat-conversations/${conversationId}/messages/`);
      return res.data.map((m: any) => ({
        ...m,
        senderId: m.sender,
        senderName: m.sender_name,
        senderAvatar: m.sender_avatar
      }));
    },
    sendMessage: async (conversationId: string, text: string) => {
      // Import authStore dynamically to avoid circular dependencies
      const { useAuthStore } = await import('@/store/authStore');
      const currentUser = useAuthStore.getState().user;

      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      const res = await api.post('chat-messages/', {
        conversation: parseInt(conversationId),
        sender: currentUser.id,
        text
      });
      return res.data;
    },
    createConversation: async (participantIds: number[]) => {
      const res = await api.post('chat-conversations/', {
        participants: participantIds
      });
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
        createdBy: d.created_by
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
      const res = await api.post('student-documents/return_docs/', { doc_ids: docIds });
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
      entity_id: number;
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
    approve: async (id: number, note?: string) => {
      const res = await api.post(`approval-requests/${id}/approve/`, { review_note: note });
      return res.data;
    },
    reject: async (id: number, note: string) => {
      const res = await api.post(`approval-requests/${id}/reject/`, { review_note: note });
      return res.data;
    }
  },



  documentTransfers: {
    list: async () => {
      const res = await api.get('document-transfers/');
      return res.data;
    },
    create: async (data: any) => {
      const payload = {
        receiver: parseInt(data.receiver),
        documents: data.documents.map((id: string) => parseInt(id))
      };
      const res = await api.post('document-transfers/', payload);
      return res.data;
    },
    accept: async (id: string | number) => {
      const res = await api.post(`document-transfers/${id}/accept/`);
      return res.data;
    },
    reject: async (id: string | number) => {
      const res = await api.post(`document-transfers/${id}/reject/`);
      return res.data;
    }
  },

  refunds: {
    create: async (data: any) => {
      const payload = {
        payment: data.paymentId,
        amount: data.amount,
        refund_method: data.refundMethod,
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
    approve: async (id: number) => {
      const res = await api.post(`refunds/${id}/approve/`);
      return res.data;
    },
    reject: async (id: number, reason: string) => {
      const res = await api.post(`refunds/${id}/reject/`, { reason });
      return res.data;
    }
  }
};
