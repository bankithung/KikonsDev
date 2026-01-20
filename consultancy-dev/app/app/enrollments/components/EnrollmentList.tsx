'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Enrollment } from '@/lib/types';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, FileText, Search, GraduationCap, X, UserCircle, Phone, Mail, CreditCard, Filter, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { toast } from '@/store/toastStore';
import { useRouter } from 'next/navigation';
import { ExistingDocumentsList } from '@/components/common/ExistingDocumentsList';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { INDIAN_STATES, SCHOOL_BOARDS, GENDERS, getAvatarColor, getInitials } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface EnrollmentListProps {
  searchTerm?: string;
}

export function EnrollmentList({ searchTerm = '' }: EnrollmentListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewEnroll, setViewEnroll] = useState<Enrollment | null>(null);
  const [actionEnroll, setActionEnroll] = useState<Enrollment | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [editEnroll, setEditEnroll] = useState<Enrollment | null>(null);
  const [filterPaymentType, setFilterPaymentType] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterBoard, setFilterBoard] = useState<string>('all');

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: apiClient.enrollments.list,
  });

  // Get unique programs for filter dropdown
  const uniquePrograms = Array.from(new Set(enrollments?.map(e => e.programName) || []));
  const uniqueStates = INDIAN_STATES;
  const uniqueBoards = SCHOOL_BOARDS;

  // Clear all filters
  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterPaymentType('all');
    setFilterProgram('all');
    setFilterGender('all');
    setFilterState('all');
    setFilterBoard('all');
    setFilterGender('all');
    setFilterState('all');
    setFilterBoard('all');
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Enrollment> }) => {
      await apiClient.enrollments.update(id, data);
    },
    onError: (error) => {
      console.error("Failed to update enrollment", error);
      toast.error('Failed to update enrollment');
    }
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiClient.registrations.update(id, data);
    },
    onError: (error) => {
      console.error("Failed to update registration", error);
      toast.error('Failed to update registration details');
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
    const matchesGender = filterGender === 'all' || enr.studentGender === filterGender;
    const matchesState = filterState === 'all' || enr.studentFamilyState === filterState || enr.studentSchoolState === filterState;
    const matchesBoard = filterBoard === 'all' || enr.studentSchoolBoard === filterBoard;

    return matchesSearch && matchesStatus && matchesPaymentType && matchesProgram && matchesGender && matchesState && matchesBoard;
  })?.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const activeEnroll = viewEnroll || editEnroll;

  // Fetch registration details for the selected enrollment
  const { data: registrationData } = useQuery({
    queryKey: ['registration', activeEnroll?.studentId],
    queryFn: () => apiClient.registrations.get(activeEnroll!.studentId),
    enabled: !!activeEnroll?.studentId,
  });

  if (isLoading) return <div className="flex items-center justify-center p-8"><div className="animate-pulse text-slate-500">Loading enrollments...</div></div>;

  return (
    <div className="space-y-2">
      {/* Filters Panel - Always Visible */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
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
              <SelectItem value="Full">Full Payment</SelectItem>
              <SelectItem value="One-time">One-time</SelectItem>
              <SelectItem value="Installment">Installment</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
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

          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              {GENDERS.map((gender) => (
                <SelectItem key={gender} value={gender}>{gender}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map((state) => (
                <SelectItem key={String(state)} value={String(state)}>{String(state)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterBoard} onValueChange={setFilterBoard}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Board" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Boards</SelectItem>
              {uniqueBoards.map((board) => (
                <SelectItem key={String(board)} value={String(board)}>{String(board)}</SelectItem>
              ))}
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${getAvatarColor(enr.studentName).bg} ${getAvatarColor(enr.studentName).text}`}>
                          {getInitials(enr.studentName)}
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
                          className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-600"
                          onClick={() => setEditEnroll(enr)}
                        >
                          <Edit size={16} />
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
                isEditMode={false}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Modal */}
      <Dialog.Root open={!!editEnroll} onOpenChange={() => setEditEnroll(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] h-[85vh] w-[90vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-xl focus:outline-none z-50 border border-slate-200 overflow-hidden flex flex-col">
            {editEnroll && (
              <EnrollmentViewModal
                enrollment={editEnroll}
                registrationData={registrationData}
                onClose={() => setEditEnroll(null)}
                router={router}
                isEditMode={true}
                onSave={async (data) => {
                  try {
                    await Promise.all([
                      updateMutation.mutateAsync({ id: editEnroll.id, data: data.enrollment }),
                      data.registration && updateRegistrationMutation.mutateAsync({ id: editEnroll.studentId, data: data.registration })
                    ]);
                    queryClient.invalidateQueries({ queryKey: ['enrollments'] });
                    queryClient.invalidateQueries({ queryKey: ['registration'] });
                    setEditEnroll(null);
                    toast.success('Enrollment and details updated successfully');
                  } catch (error) {
                    console.error("Update failed", error);
                  }
                }}
                isLoading={updateMutation.isPending || updateRegistrationMutation.isPending}
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
  { id: 'digital-docs', label: 'Digital Docs', icon: FileText },
  { id: 'physical-docs', label: 'Physical Docs', icon: FileText },
];

// Field display/edit component for the modal
function ModalField({
  label,
  value,
  icon: Icon,
  isEditable = false,
  onChange,
  type = "text",
  options = []
}: {
  label: string;
  value: any;
  icon?: any;
  isEditable?: boolean;
  onChange?: (val: any) => void;
  type?: "text" | "number" | "select" | "date";
  options?: string[];
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </p>
      {isEditable && onChange ? (
        type === 'select' ? (
          <Select value={value?.toString()} onValueChange={onChange}>
            <SelectTrigger className="h-9 w-full bg-white border-slate-200">
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            className="h-9 bg-white border-slate-200"
          />
        )
      ) : (
        <p className="text-sm text-slate-900 font-medium bg-white px-3 py-2 rounded border border-slate-200">{value}</p>
      )}
    </div>
  );
}

// Enrollment View Modal Component with Tabs
function EnrollmentViewModal({
  enrollment,
  registrationData,
  onClose,
  router,
  isEditMode = false,
  onSave,
  isLoading = false
}: {
  enrollment: Enrollment;
  registrationData: any;
  onClose: () => void;
  router: any;
  isEditMode?: boolean;
  onSave?: (data: any) => void;
  isLoading?: boolean;
}) {
  const [activeTab, setActiveTab] = useState('student');
  const [formData, setFormData] = useState<Enrollment>(enrollment);
  const [regFormData, setRegFormData] = useState<any>(registrationData || {});

  useEffect(() => {
    setFormData(enrollment);
  }, [enrollment]);

  useEffect(() => {
    if (registrationData) {
      setRegFormData(registrationData);
    }
  }, [registrationData]);

  const handleFieldChange = (field: keyof Enrollment, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegFieldChange = (field: string, value: any) => {
    setRegFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'student':
        return (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${getAvatarColor(enrollment.studentName).bg} ${getAvatarColor(enrollment.studentName).text}`}>
                  {getInitials(enrollment.studentName)}
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
                <ModalField
                  label="Mobile"
                  value={regFormData?.mobile}
                  icon={Phone}
                  isEditable={isEditMode}
                  onChange={(val) => handleRegFieldChange('mobile', val)}
                />
                <ModalField
                  label="Email"
                  value={regFormData?.email}
                  icon={Mail}
                  isEditable={isEditMode}
                  onChange={(val) => handleRegFieldChange('email', val)}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Address</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                {isEditMode ? (
                  <Input
                    value={regFormData?.permanentAddress || ''}
                    onChange={(e) => handleRegFieldChange('permanentAddress', e.target.value)}
                    className="bg-white border-slate-200"
                  />
                ) : (
                  <p className="text-sm text-slate-700">{regFormData?.permanentAddress || '-'}</p>
                )}
              </div>
            </div>

            {/* Parents */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Parents Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <ModalField
                  label="Father's Name"
                  value={regFormData?.fatherName}
                  isEditable={isEditMode}
                  onChange={(val) => handleRegFieldChange('fatherName', val)}
                />
                <ModalField
                  label="Mother's Name"
                  value={regFormData?.motherName}
                  isEditable={isEditMode}
                  onChange={(val) => handleRegFieldChange('motherName', val)}
                />
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
                  <ModalField
                    label="Enrollment No"
                    value={formData.enrollmentNo}
                    isEditable={false} // Usually primary key/unique id not editable
                  />
                  <ModalField
                    label="Start Date"
                    value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
                    isEditable={isEditMode}
                    onChange={(val) => handleFieldChange('startDate', val)}
                    type="date"
                  />
                  <ModalField
                    label="Duration (Months)"
                    value={formData.durationMonths}
                    isEditable={isEditMode}
                    onChange={(val) => handleFieldChange('durationMonths', val)}
                    type="number"
                  />
                  <ModalField
                    label="Status"
                    value={formData.status}
                    isEditable={isEditMode}
                    onChange={(val) => handleFieldChange('status', val)}
                    type="select"
                    options={['Active', 'Completed', 'Dropped']}
                  />
                </div>
              </div>
            </div>

            {/* Added By */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Created By</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <ModalField label="Added By" value={formData.created_by_name || '-'} icon={UserCircle} />
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
                  <ModalField
                    label="Total Fees"
                    value={formData.totalFees}
                    isEditable={isEditMode}
                    onChange={(val) => handleFieldChange('totalFees', val)}
                    type="number"
                  />
                  <ModalField
                    label="Service Charge"
                    value={formData.serviceCharge}
                    isEditable={isEditMode}
                    onChange={(val) => handleFieldChange('serviceCharge', val)}
                    type="number"
                  />
                  <ModalField
                    label="School Fees"
                    value={formData.schoolFees}
                    isEditable={isEditMode}
                    onChange={(val) => handleFieldChange('schoolFees', val)}
                    type="number"
                  />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Payment Information</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField
                    label="Payment Type"
                    value={formData.paymentType}
                    isEditable={isEditMode}
                    onChange={(val) => handleFieldChange('paymentType', val)}
                    type="select"
                    options={['Full', 'Installment', 'One-time']}
                  />
                  {formData.paymentType === 'Installment' && (
                    <ModalField label="No. of Installments" value={formData.installments?.length || 0} />
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

      case 'digital-docs':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-700">Student Documents</h4>
              </div>

              {isEditMode ? (
                <DocumentUpload
                  registrationId={enrollment.studentId}
                  studentName={enrollment.studentName}
                  initialDocuments={regFormData?.documents || []}
                  onDocumentsChange={(docs) => {
                    handleRegFieldChange('documents', docs);
                  }}
                  readOnly={false}
                />
              ) : (
                <ExistingDocumentsList studentId={enrollment.studentId} />
              )}
            </div>
          </div>
        );

      case 'physical-docs':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">Physical Documents Served</h4>
              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-teal-600 border-teal-200 hover:bg-teal-50"
                  onClick={() => {
                    const currentDocs = regFormData.student_documents || [];
                    handleRegFieldChange('student_documents', [...currentDocs, { name: '', document_number: '', remarks: '', status: 'Held' }]);
                  }}
                >
                  <Plus size={14} className="mr-1" /> Add Document
                </Button>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              {regFormData?.student_documents?.length > 0 ? (
                regFormData.student_documents.map((doc: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border border-slate-200 shadow-sm relative group">
                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-semibold">Document Name</label>
                          <Input
                            value={doc.name || ''}
                            onChange={(e) => {
                              const updated = [...regFormData.student_documents];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              handleRegFieldChange('student_documents', updated);
                            }}
                            placeholder="e.g. 10th Marksheet"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-semibold">Document No</label>
                          <Input
                            value={doc.document_number || ''}
                            onChange={(e) => {
                              const updated = [...regFormData.student_documents];
                              updated[idx] = { ...updated[idx], document_number: e.target.value };
                              handleRegFieldChange('student_documents', updated);
                            }}
                            placeholder="Doc Number"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-semibold">Remarks</label>
                          <div className="flex gap-2">
                            <Input
                              value={doc.remarks || ''}
                              onChange={(e) => {
                                const updated = [...regFormData.student_documents];
                                updated[idx] = { ...updated[idx], remarks: e.target.value };
                                handleRegFieldChange('student_documents', updated);
                              }}
                              placeholder="Condition/Status"
                              className="h-8 text-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              onClick={() => {
                                const updated = regFormData.student_documents.filter((_: any, i: number) => i !== idx);
                                handleRegFieldChange('student_documents', updated);
                              }}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Read-only View
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] uppercase text-slate-500 font-semibold">Document Name</p>
                          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-500 font-semibold">Document No</p>
                          <p className="text-sm text-slate-600 font-mono">{doc.document_number || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-500 font-semibold">Remarks</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">{doc.remarks || '-'}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${doc.status === 'Returned' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {doc.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p>No physical documents recorded</p>
                </div>
              )}
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
        <Dialog.Title className="text-lg font-bold text-slate-900">
          {isEditMode ? 'Edit Enrollment' : 'Enrollment Details'}
        </Dialog.Title>
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
          {isEditMode ? 'Cancel' : 'Close'}
        </Button>
        {isEditMode ? (
          <Button
            className="h-10 px-6 bg-teal-600 hover:bg-teal-700"
            onClick={() => onSave && onSave({ enrollment: formData, registration: regFormData })}
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        ) : (
          <Button
            className="h-10 px-6 bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              router.push(`/app/student-profile/enrollment/${enrollment.id}`);
              onClose();
            }}
          >
            <Edit size={16} className="mr-2" /> View Full Profile
          </Button>
        )}
      </div>
    </>
  );
}
