import { api } from './api';
import { User, Role, Enquiry, Registration, Enrollment, Document, Payment, Task, ReportMetrics, DocumentTransfer } from './types';

// Helper to map snake_case to camelCase (simple version)
const mapEnquiry = (data: any): Enquiry => ({
  ...data,
  candidateName: data.candidate_name || data.candidateName,
  schoolName: data.school_name || data.schoolName,
  courseInterested: data.course_interested || data.courseInterested,
  fatherName: data.father_name || data.fatherName,
  motherName: data.mother_name || data.motherName,
  permanentAddress: data.permanent_address || data.permanentAddress,
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
});

const mapEnrollment = (data: any): Enrollment => ({
  ...data,
  enrollmentNo: data.enrollment_no || data.enrollmentNo,
  studentName: data.student_name || data.studentName, // Backend might need to return this from relation
  programName: data.program_name || data.programName,
  startDate: data.start_date || data.startDate,
  durationMonths: data.duration_months || data.durationMonths,
  totalFees: data.total_fees || data.totalFees,
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

        return last7Days.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          return {
            name: days[date.getDay()],
            enquiries: enq.data.filter((i: any) => i.created_at?.startsWith(dateStr)).length,
            registrations: reg.data.filter((i: any) => i.registration_date?.startsWith(dateStr)).length,
            enrollments: enr.data.filter((i: any) => i.start_date?.startsWith(dateStr)).length,
          };
        });
      } catch (e) {
        console.error("Failed to fetch weekly data", e);
        return [];
      }
    },

    getRevenueData: async () => {
      try {
        const res = await api.get('payments/');
        const payments = res.data;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        // Group by month
        const monthlyRevenue = new Array(12).fill(0);
        payments.forEach((p: any) => {
          if (p.status === 'Completed' && p.payment_date) {
            const date = new Date(p.payment_date);
            if (date.getFullYear() === currentYear) {
              monthlyRevenue[date.getMonth()] += parseFloat(p.amount);
            }
          }
        });

        // Return data for chart (current year up to current month)
        const currentMonth = new Date().getMonth();
        return months.slice(0, currentMonth + 1).map((month, index) => ({
          month,
          revenue: monthlyRevenue[index]
        }));
      } catch (e) {
        console.error("Failed to fetch revenue data", e);
        return [];
      }
    },

    getActivity: async () => {
      try {
        // Fetch latest items from different modules to construct activity feed
        const [enq, reg, pay] = await Promise.all([
          api.get('enquiries/?limit=5'),
          api.get('registrations/?limit=5'),
          api.get('payments/?limit=5')
        ]);

        const activities = [
          ...enq.data.map((i: any) => ({
            id: `enq-${i.id}`,
            text: `New enquiry from ${i.candidate_name || i.candidateName}`,
            time: new Date(i.created_at).toLocaleDateString(),
            timestamp: new Date(i.created_at).getTime()
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

        // Sort by newest first and take top 10
        return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
      } catch (e) {
        console.error("Failed to fetch activity", e);
        return [];
      }
    },

    getRecentEnquiries: async () => {
      try {
        const res = await api.get('enquiries/');
        // Return top 5 most recent
        return res.data
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((e: any) => ({
            name: e.candidate_name || e.candidateName,
            course: e.course_interested || e.courseInterested,
            time: new Date(e.created_at).toLocaleDateString(),
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
      // Map camelCase to snake_case for backend
      const payload = {
        ...data,
        candidate_name: data.candidateName,
        school_name: data.schoolName,
        course_interested: data.courseInterested,
        father_name: data.fatherName,
        mother_name: data.motherName,
        permanent_address: data.permanentAddress,
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
        permanent_address: data.permanentAddress,
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
        registration_no: `REG-${Date.now()}`, // Backend should handle this ideally
        student_name: data.studentName,
        registration_date: new Date().toISOString(),
        needs_loan: data.needsLoan,
        payment_status: data.paymentStatus,
        payment_method: data.paymentMethod,
        registration_fee: data.registrationFee,
        father_name: data.fatherName,
        mother_name: data.motherName,
        permanent_address: data.permanentAddress,
      };
      const res = await api.post('registrations/', payload);
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
        uploadedBy: 'User', // Backend doesn't return user name yet
        uploadedAt: d.uploaded_at,
        studentName: d.student_name,
        expiryDate: d.expiry_date
      }));
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
        tuition_fee_min: data.tuitionFee?.min,
        tuition_fee_max: data.tuitionFee?.max,
        admission_deadline: data.admissionDeadline
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
      const res = await api.get('companies/');
      return res.data[0];
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
  }
};


