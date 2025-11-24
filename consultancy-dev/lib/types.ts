export type Role = 'DEV_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: Role;
  company_id: string;
  avatar?: string;
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
}

export interface Registration {
  id: string;
  registrationNo: string; // REG-DEMO-...
  studentName: string;
  mobile: string;
  email: string;
  registrationDate: string;
  needsLoan: boolean;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Other';
  registrationFee: number;
  fatherName: string;
  motherName: string;
  permanentAddress: string;
  preferences: StudyPreference[];
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
}

export interface Installment {
  number: number;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Document {
  id: string;
  fileName: string;
  type: string;
  status: 'IN' | 'OUT';
  uploadedBy: string;
  uploadedAt: string; // ISO
  studentName?: string; // Associated student
  registrationNo?: string;
}

export interface DocumentTransfer {
  id: string;
  senderId: string;
  receiverId: string;
  documentIds: string[];
  status: 'Pending' | 'Sent' | 'Received';
  createdAt: string;
}

export interface Payment {
  id: string;
  date: string;
  studentName: string;
  type: 'Enquiry' | 'Registration' | 'Enrollment';
  amount: number;
  status: 'Success' | 'Pending' | 'Failed';
  method: 'Cash' | 'Card' | 'UPI' | 'Other';
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string; // User ID or Name
  dueDate: string;
  status: 'Todo' | 'In Progress' | 'Done';
}

export interface ReportMetrics {
  enquiriesCount: number;
  registrationsCount: number;
  enrollmentsCount: number;
  pendingPayments: number;
  pendingTransfers: number;
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
}
