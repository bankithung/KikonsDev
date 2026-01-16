'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Enrollment } from '@/lib/types';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, FileText, Search, GraduationCap, X, UserCircle, Phone, Mail, CreditCard, Filter } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { toast } from '@/store/toastStore';
import { useRouter } from 'next/navigation';
import { ExistingDocumentsList } from '@/components/common/ExistingDocumentsList';

interface EnrollmentListProps {
  isFilterOpen?: boolean;
}

export function EnrollmentList({ isFilterOpen = false }: EnrollmentListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewEnroll, setViewEnroll] = useState<Enrollment | null>(null);
  const [actionEnroll, setActionEnroll] = useState<Enrollment | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [filterPaymentType, setFilterPaymentType] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterLoan, setFilterLoan] = useState<string>('all');

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: apiClient.enrollments.list,
  });

  // Get unique programs for filter dropdown
  const uniquePrograms = Array.from(new Set(enrollments?.map(e => e.programName) || []));

  // Clear all filters
  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterPaymentType('all');
    setFilterProgram('all');
    setFilterLoan('all');
    setSearchTerm('');
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.enrollments.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setShowConfirm(false);
      setActionEnroll(null);
      toast.success('Enrollment deleted successfully');
    },
    onError: (error) => {
      console.error("Failed to delete enrollment", error);
      toast.error('Failed to delete enrollment');
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!actionEnroll) return;
      await apiClient.approvalRequests.create({
        action: 'DELETE',
        entity_type: 'enrollment',
        entity_id: Number(actionEnroll.id),
        entity_name: actionEnroll.studentName,
        message: data.message,
      });
    },
    onSuccess: () => {
      setShowRequest(false);
      setActionEnroll(null);
      toast.success('Delete request sent to admin for approval');
    },
    onError: (error) => {
      console.error("Failed to create request", error);
      toast.error('Failed to create request');
    }
  });

  const handleDirectDelete = () => {
    if (actionEnroll) {
      deleteMutation.mutate(actionEnroll.id);
    }
  };

  const handleSubmitRequest = (message: string) => {
    requestMutation.mutate({ message });
  };

  const handleDeleteClick = (enr: Enrollment) => {
    setActionEnroll(enr);

    if (user?.role === 'COMPANY_ADMIN' || user?.role === 'DEV_ADMIN') {
      setShowConfirm(true);
    } else {
      setShowRequest(true);
    }
  };


  const filteredEnrolls = enrollments?.filter(enr => {
    const matchesSearch = enr.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enr.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || enr.status === filterStatus;
    const matchesPaymentType = filterPaymentType === 'all' || enr.paymentType === filterPaymentType;
    const matchesProgram = filterProgram === 'all' || enr.programName === filterProgram;
    const matchesLoan = filterLoan === 'all' ||
      (filterLoan === 'yes' && enr.loanRequired) ||
      (filterLoan === 'no' && !enr.loanRequired);
    return matchesSearch && matchesStatus && matchesPaymentType && matchesProgram && matchesLoan;
  });

  // Fetch registration details for the selected enrollment
  const { data: registrationData } = useQuery({
    queryKey: ['registration', viewEnroll?.studentId],
    queryFn: () => apiClient.registrations.get(viewEnroll!.studentId),
    enabled: !!viewEnroll?.studentId,
  });

  if (isLoading) return <div className="flex items-center justify-center p-8"><div className="animate-pulse text-slate-500">Loading enrollments...</div></div>;

  return (
    <div className="space-y-2">
      {/* Search Bar - Compact */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name or enrollment number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
        />
      </div>

      {/* Collapsible Filters Panel */}
      {isFilterOpen && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentType} onValueChange={setFilterPaymentType}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                <SelectItem value="One-time">One-time</SelectItem>
                <SelectItem value="Installment">Installment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Programs</SelectItem>
                {uniquePrograms.map((program) => (
                  <SelectItem key={program} value={program}>{program}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterLoan} onValueChange={setFilterLoan}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Loan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Loan Required</SelectItem>
                <SelectItem value="no">No Loan</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              className="h-9 text-xs bg-slate-600 hover:bg-slate-700 text-white"
              onClick={clearAllFilters}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table - Compact */}
      <Card className="border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Added By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Fees</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEnrolls && filteredEnrolls.length > 0 ? (
                filteredEnrolls.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm shrink-0">
                          {enr.studentName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{enr.studentName}</p>
                          <code className="text-xs text-slate-500 font-mono">{enr.enrollmentNo}</code>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden lg:table-cell">
                      <p className="text-sm font-medium text-slate-900">{enr.programName}</p>
                      <p className="text-xs text-slate-500">{enr.durationMonths} months</p>
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600 hidden md:table-cell">
                      {enr.startDate ? format(new Date(enr.startDate), 'dd MMM yyyy') : 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600 hidden sm:table-cell">
                      {enr.created_by_name || '-'}
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-sm font-bold text-slate-900">₹{enr.totalFees.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{enr.paymentType}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${enr.status === 'Active' ? 'bg-green-100 text-green-700' :
                        enr.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {enr.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setViewEnroll(enr)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteClick(enr)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <GraduationCap size={40} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">No enrollments found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick View Modal - Redesigned to match Registration modal */}
      <Dialog.Root open={!!viewEnroll} onOpenChange={() => setViewEnroll(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] h-[85vh] w-[90vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-xl focus:outline-none z-50 border border-slate-200 overflow-hidden flex flex-col">
            {viewEnroll && (
              <EnrollmentViewModal
                enrollment={viewEnroll}
                registrationData={registrationData}
                onClose={() => setViewEnroll(null)}
                router={router}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirmation Dialog for Admins */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setActionEnroll(null);
        }}
        onConfirm={handleDirectDelete}
        title="Delete Enrollment"
        description={
          actionEnroll
            ? `Are you sure you want to delete the enrollment for ${actionEnroll.studentName}? This action cannot be undone.`
            : 'Are you sure you want to delete this enrollment?'
        }
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Request Modal for Employees */}
      <RequestActionModal
        open={showRequest}
        onClose={() => {
          setShowRequest(false);
          setActionEnroll(null);
        }}
        onSubmit={handleSubmitRequest}
        action="DELETE"
        entityType="Enrollment"
        entityName={actionEnroll?.studentName || ''}
        isLoading={requestMutation.isPending}
      />
    </div>
  );
}

// Tab configuration for the Enrollment modal
const ENROLL_MODAL_TABS = [
  { id: 'student', label: 'Student Profile', icon: UserCircle },
  { id: 'program', label: 'Program Details', icon: GraduationCap },
  { id: 'financials', label: 'Financials', icon: CreditCard },
  { id: 'documents', label: 'Documents', icon: FileText },
];

// Field display component for the modal
function ModalField({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </p>
      <p className="text-sm text-slate-900 font-medium bg-white px-3 py-2 rounded border border-slate-200">{value}</p>
    </div>
  );
}

// Enrollment View Modal Component with Tabs
function EnrollmentViewModal({
  enrollment,
  registrationData,
  onClose,
  router
}: {
  enrollment: Enrollment;
  registrationData: any;
  onClose: () => void;
  router: any;
}) {
  const [activeTab, setActiveTab] = useState('student');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'student':
        return (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {enrollment.studentName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{enrollment.studentName}</h3>
                  <p className="text-sm text-slate-600">Enrollment No: <span className="font-mono">{enrollment.enrollmentNo}</span></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-white px-2 py-1 rounded border border-purple-200">Reg: {registrationData?.registrationNo || '-'}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enrollment.status === 'Active' ? 'bg-green-100 text-green-700' : enrollment.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {enrollment.status}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <ModalField label="Mobile" value={registrationData?.mobile || '-'} icon={Phone} />
                <ModalField label="Email" value={registrationData?.email || '-'} icon={Mail} />
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Address</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700">{registrationData?.permanentAddress || '-'}</p>
              </div>
            </div>

            {/* Parents */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Parents Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <ModalField label="Father's Name" value={registrationData?.fatherName || '-'} />
                <ModalField label="Mother's Name" value={registrationData?.motherName || '-'} />
              </div>
            </div>
          </div>
        );

      case 'program':
        return (
          <div className="space-y-6">
            {/* Program Summary */}
            <div className="text-center py-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Program Name</p>
              <p className="text-2xl font-bold text-purple-600">{enrollment.programName}</p>
            </div>

            {/* Program Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Enrollment Information</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Enrollment No" value={enrollment.enrollmentNo} />
                  <ModalField label="Start Date" value={enrollment.startDate ? format(new Date(enrollment.startDate), 'dd MMM yyyy') : 'N/A'} />
                  <ModalField label="Duration" value={`${enrollment.durationMonths} Months`} />
                  <ModalField label="Status" value={enrollment.status} />
                </div>
              </div>
            </div>

            {/* Added By */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Created By</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <ModalField label="Added By" value={enrollment.created_by_name || '-'} icon={UserCircle} />
              </div>
            </div>
          </div>
        );

      case 'financials':
        return (
          <div className="space-y-6">
            {/* Total Fees Summary */}
            <div className="text-center py-6 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-100">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Total Fees</p>
              <p className="text-4xl font-bold text-teal-600">₹{enrollment.totalFees.toLocaleString()}</p>
            </div>

            {/* Fee Breakdown */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Fee Breakdown</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Service Charge" value={`₹${enrollment.serviceCharge?.toLocaleString() || '0'}`} />
                  <ModalField label="School Fees" value={`₹${enrollment.schoolFees?.toLocaleString() || '0'}`} />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Payment Information</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Payment Type" value={enrollment.paymentType} />
                  {enrollment.paymentType === 'Installment' && (
                    <ModalField label="No. of Installments" value={enrollment.installments?.length || 0} />
                  )}
                </div>
              </div>
            </div>

            {/* Loan Info */}
            {enrollment.loanRequired && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-amber-800 mb-3">Loan Information</h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-amber-700">Loan Amount</p>
                    <p className="text-lg font-bold text-amber-900">₹{enrollment.loanAmount?.toLocaleString()}</p>
                  </div>
                  <span className="text-xs bg-amber-200 text-amber-800 px-3 py-1 rounded-full font-medium">Pending Approval</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Student Documents</h4>
              <ExistingDocumentsList studentId={enrollment.studentId} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <Dialog.Title className="text-lg font-bold text-slate-900">Enrollment Details</Dialog.Title>
        <Dialog.Close asChild>
          <button className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </Dialog.Close>
      </div>

      {/* Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Tabs */}
        <div className="w-48 border-r border-slate-200 p-2 flex flex-col gap-1 bg-slate-50">
          {ENROLL_MODAL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${isActive ? 'bg-purple-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
        <Button variant="outline" className="h-10 px-6 border-slate-300 hover:bg-slate-100" onClick={onClose}>
          Close
        </Button>
        <Button
          className="h-10 px-6 bg-purple-600 hover:bg-purple-700"
          onClick={() => {
            router.push(`/app/student-profile/enrollment/${enrollment.id}`);
            onClose();
          }}
        >
          <Edit size={16} className="mr-2" /> View Full Profile
        </Button>
      </div>
    </>
  );
}
