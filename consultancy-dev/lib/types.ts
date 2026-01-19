export type Role = 'DEV_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'HR' | 'SALES' | 'ACCOUNTS' | 'COUNSELOR' | 'OPERATIONS' | 'IT_SUPPORT' | 'TEAM_LEADER';

export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: Role;
  company_id?: string;
  avatar?: string;

  // Extended Profile
  gender?: 'Male' | 'Female' | 'Other';
  phone_number?: string;
  dob?: string;
  parents_name?: string;
  religion?: string;
  state_from?: string;
  date_of_joining?: string;
  salary?: string | number; // API might return string
  assigned_state?: string;
  assigned_district?: string;
  assigned_location?: string;
}

export interface StudentRemark {
  id: number;
  registration: number;
  user: number;
  userName: string;
  remark: string;
  createdAt: string;
  companyId: string;
}

export interface Enquiry {
  id: string;
  date: string; // ISO date
  schoolName: string;
  stream: 'Science' | 'Commerce' | 'Arts';
  candidateName: string;
  courseInterested: string;
  mobile: string;
  email: string;
  fatherName: string;
  motherName: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  fatherMobile?: string;
  motherMobile?: string;
  permanentAddress: string;
  class12PassingYear?: string;
  class10Percentage?: number;
  class10SchoolName?: string;
  class10Board?: string;
  class10PassingYear?: string;
  class10Place?: string;
  class10State?: string;
  class12Percentage?: number;
  schoolBoard?: string;
  schoolPlace?: string;
  schoolState?: string;
  familyPlace?: string;
  familyState?: string;
  gender?: string;
  dob?: string;
  caste?: string;
  religion?: string;
  gapYearFrom?: number;
  gapYearTo?: number;
  pcbPercentage?: number;
  pcmPercentage?: number;
  physicsMarks?: number;
  mathsMarks?: number;
  chemistryMarks?: number;
  biologyMarks?: number;
  previousNeetMarks?: number;
  presentNeetMarks?: number;
  gapYear: boolean;
  collegeDropout: boolean;
  preferredLocations: string[];
  otherLocation?: string;
  paymentAmount?: number;
  status: 'New' | 'Converted' | 'Closed';
  created_by_name?: string;
}

export interface Registration {
  id: string;
  registrationNo: string; // REG-DEMO-...
  studentName: string;
  mobile: string;
  email: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  caste?: string;
  religion?: string;
  registrationDate: string;
  needsLoan: boolean;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Other';
  registrationFee: number;
  fatherName: string;
  motherName: string;
  permanentAddress: string;

  // Parent Info
  fatherOccupation?: string;
  motherOccupation?: string;
  fatherMobile?: string;
  motherMobile?: string;
  familyPlace?: string;
  familyState?: string;

  // Academic Info
  schoolName?: string;
  schoolBoard?: string;
  schoolPlace?: string;
  schoolState?: string;
  class10Percentage?: number;
  class10SchoolName?: string;
  class10Board?: string;
  class10PassingYear?: string;
  class10Place?: string;
  class10State?: string;
  class12Percentage?: number;
  class12PassingYear?: string;

  // Gap Year
  gapYear?: boolean;
  gapYearFrom?: number;
  gapYearTo?: number;
  collegeDropout?: boolean;

  // Marks
  pcbPercentage?: number;
  pcmPercentage?: number;
  physicsMarks?: number;
  chemistryMarks?: number;
  biologyMarks?: number;
  mathsMarks?: number;
  previousNeetMarks?: number;
  presentNeetMarks?: number;

  preferences: StudyPreference[];
  documents?: any[]; // Backend returns snake_case document objects
  student_documents?: StudentDocument[];
  created_by_name?: string;
  enquiry?: number; // ID of linked enquiry
}

export interface StudyPreference {
  courseName: string;
  location: string;
  priority: number;
}

export interface Enrollment {
  id: string;
  enrollmentNo: string;
  studentId: string; // Links to Registration? Or just name for now mock
  studentName: string;
  programName: string;
  university?: string;
  startDate: string;
  durationMonths: number;
  totalFees: number;
  serviceCharge: number;
  schoolFees: number;
  hostelFees: number;
  status: 'Active' | 'Completed' | 'Dropped';
  paymentType: 'Full' | 'Installment';
  installments?: Installment[];
  loanRequired: boolean;
  loanAmount?: number;
  created_by_name?: string;
}

export interface Installment {
  number: number;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface StudentDocument {
  id: string;
  registration: number;
  name: string;
  documentNumber: string;
  status: 'Held' | 'Returned';
  receivedAt: string;
  returnedAt?: string;
  remarks?: string;
  createdBy?: string;
  created_by_name?: string;
  current_holder?: number;
  current_holder_name?: string;
}

export interface Document {
  id: string;
  fileName: string;
  description?: string;
  type: string;
  status: 'IN' | 'OUT';
  uploadedBy: string;
  uploadedByName?: string;
  currentHolder?: string;
  currentHolderName?: string;
  uploadedAt: string; // ISO
  studentName?: string; // Associated student
  registration?: number; // Registration ID
  registrationNo?: string;
  file?: string;
  expiryDate?: string;
}

export interface DocumentTransfer {
  id: string;
  sender: number;
  sender_name: string;
  receiver: number;
  receiver_name: string;
  documents: number[];
  documents_details?: Document[];
  status: 'Pending' | 'Accepted' | 'Rejected';
  created_at: string;
  accepted_at?: string;
}

export interface Payment {
  id: string;
  date: string;
  studentName: string;
  type: 'Enquiry' | 'Registration' | 'Enrollment';
  amount: number;
  status: 'Success' | 'Pending' | 'Failed';
  method: 'Cash' | 'Card' | 'UPI' | 'Other';
  refunds?: {
    id: number;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    reason: string;
    refund_method: string;
  }[];
}


export interface Metric {
  value: number;
  trend: number;
}

export interface ReportMetrics {
  enquiries: Metric;
  registrations: Metric;
  enrollments: Metric;
  totalEarnings: Metric;
  pendingPayments: number;
}

export interface ApprovalRequest {
  id: number;
  action: 'DELETE' | 'UPDATE';
  entity_type: string;
  entity_id: number;
  entity_name: string;
  message: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  review_note?: string;
  requested_by: number;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  pending_changes?: any;
}
export interface DashboardAnalytics {
  activeEnquiries: number;
  thisMonthConversions: number;
  conversionRate: number;
  avgResponseTime: string;
  status: string;
}


export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  assignedTo?: number; // Mapped for frontend
  due_date?: string;
  dueDate?: string;     // Mapped for frontend
  status: 'Todo' | 'In Progress' | 'Done' | 'Pending' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  registration?: number;
  position?: number;
  comments_count?: number;
  created_at: string;
}

export interface FollowUpComment {
  id: string;
  followup: string;
  user: number;
  user_name: string;
  user_email: string;
  comment: string;
  is_completion_comment: boolean;
  created_at: string;
  updated_at: string;
  company_id: string;
  parent_comment: string | null;
}

export interface DocumentTransfer {
  id: string;
  sender: number;
  receiver: number;
  sender_name: string;
  receiver_name: string;
  documents: number[];
  documents_details?: Document[];
  transferred_at: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  notes?: string;
}

export interface Appointment {
  id: string;
  studentName: string;
  studentEmail: string;
  counselor: number; // User ID
  counselor_name?: string;
  date: string; // ISO date or YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  type: 'In-Person' | 'Video Call' | 'Phone Call';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  company_id?: string;
}
