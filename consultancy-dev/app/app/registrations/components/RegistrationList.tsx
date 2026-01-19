'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Registration } from '@/lib/types';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, Phone, Mail, FileText, Search, X, GraduationCap, UserCircle, Filter } from 'lucide-react';
import { INDIAN_STATES, SCHOOL_BOARDS, COURSES, PREFERRED_LOCATIONS, GENDERS, getAvatarColor, getInitials } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { RegistrationForm } from './RegistrationForm';
import { RegistrationReceipt } from '@/components/receipts/RegistrationReceipt';
import toast from 'react-hot-toast';

interface RegistrationListProps {
  isFilterOpen?: boolean;
}

export function RegistrationList({ isFilterOpen = false }: RegistrationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterBoard, setFilterBoard] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [viewReg, setViewReg] = useState<Registration | null>(null);
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteReg, setDeleteReg] = useState<Registration | null>(null);
  const [actionReg, setActionReg] = useState<Registration | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [actionType, setActionType] = useState<'edit' | 'delete'>('delete');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<Registration | null>(null);
  const [documentTab, setDocumentTab] = useState<'digital' | 'physical'>('digital');

  // No longer needed as we use the form for edits now
  // const [showEditRequest, setShowEditRequest] = useState(false);
  // const [editActionType, setEditActionType] = useState<'DELETE' | 'UPDATE'>('DELETE');

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations'],
    queryFn: apiClient.registrations.list,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.registrations.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setShowConfirm(false);
      setActionReg(null);
      toast.success('Registration deleted successfully');
    },
    onError: (error) => {
      console.error("Failed to delete registration", error);
      toast.error('Failed to delete registration');
    }
  });

  // Mutation for delete requests (generic message)
  const requestDeleteMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!actionReg) return;
      await apiClient.approvalRequests.create({
        action: 'DELETE',
        entity_type: 'registration',
        entity_id: Number(actionReg.id),
        entity_name: actionReg.studentName,
        message: data.message,
      });
    },
    onSuccess: () => {
      setShowRequest(false);
      setActionReg(null);
      toast.success('Delete request sent to admin for approval');
    },
    onError: (error) => {
      console.error("Failed to create request", error);
      toast.error('Failed to create request');
    }
  });

  // Mutation for update requests (with pending changes)
  const requestUpdateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      if (!editReg) return;
      await apiClient.approvalRequests.create({
        action: 'UPDATE',
        entity_type: 'registration',
        entity_id: Number(id),
        entity_name: editReg.studentName,
        message: 'Request to update registration details',
        pending_changes: data,
      });
    },
    onSuccess: () => {
      setEditReg(null);
      toast.success('Update request sent to admin for approval');
    },
    onError: (error) => {
      console.error("Failed to create update request", error);
      toast.error('Failed to create update request');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      await apiClient.registrations.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setEditReg(null);
      toast.success('Registration updated successfully!');
    },
    onError: (error: any) => {
      console.error("Failed to update registration", error);
      console.error("Error response:", error.response?.data);
      toast.error('Failed to update registration');
    }
  });

  const handleDirectDelete = () => {
    if (actionReg) {
      deleteMutation.mutate(actionReg.id);
    }
  };

  const handleSubmitDeleteRequest = (message: string) => {
    requestDeleteMutation.mutate({ message });
  };

  const handleDeleteClick = (reg: Registration) => {
    setActionReg(reg);

    if (user?.role === 'COMPANY_ADMIN' || user?.role === 'DEV_ADMIN') {
      setShowConfirm(true);
    } else {
      setShowRequest(true);
    }
  };

  const handleEditClick = (reg: Registration) => {
    console.log('Editing registration:', reg);
    // Both admins and employees can open the edit form now
    setEditReg(reg);
  };

  const handleEditSubmit = (data: any) => {
    if (!editReg) return;

    if (user?.role === 'COMPANY_ADMIN' || user?.role === 'DEV_ADMIN') {
      // Admin: Direct update
      updateMutation.mutate({ id: editReg.id, data });
    } else {
      // Employee: Request approval
      requestUpdateMutation.mutate({ id: editReg.id, data });
    }
  };

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments-check-list'],
    queryFn: apiClient.enrollments.list,
  });

  const enrolledStudentIds = new Set(enrollments?.map((e: any) => String(e.studentId || e.student)) || []);

  const filteredRegs = (registrations || []).filter((reg) => {
    // Filter out if enrolled
    if (enrolledStudentIds.has(String(reg.id))) return false;

    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.mobile.includes(searchTerm);

    const matchesPayment = filterPaymentStatus === 'all' || reg.paymentStatus === filterPaymentStatus;
    const matchesStream = filterStream === 'all' || (reg as any).stream === filterStream;
    const matchesGender = filterGender === 'all' || reg.gender === filterGender;
    const matchesState = filterState === 'all' || reg.familyState === filterState || reg.schoolState === filterState;
    const matchesCourse = filterCourse === 'all' || (reg as any).courseInterested?.includes(filterCourse);
    const matchesBoard = filterBoard === 'all' || reg.schoolBoard === filterBoard;
    const matchesLocation = filterLocation === 'all' || (reg as any).preferredLocations?.includes(filterLocation);

    return matchesSearch && matchesPayment && matchesStream && matchesGender && matchesState && matchesCourse && matchesBoard && matchesLocation;
  });

  const clearAllFilters = () => {
    setFilterPaymentStatus('all');
    setFilterStream('all');
    setFilterGender('all');
    setFilterState('all');
    setFilterCourse('all');
    setFilterBoard('all');
    setFilterLocation('all');
  };

  if (isLoading) return <div className="flex items-center justify-center p-8"><div className="animate-pulse text-slate-500">Loading registrations...</div></div>;

  return (
    <div className="space-y-2">
      {/* Collapsible Filters Panel */}
      {isFilterOpen && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStream} onValueChange={setFilterStream}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Commerce">Commerce</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
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
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Courses</SelectItem>
                {COURSES.map((course) => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBoard} onValueChange={setFilterBoard}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Board" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Boards</SelectItem>
                {SCHOOL_BOARDS.map((board) => (
                  <SelectItem key={board} value={board}>{board}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Locations</SelectItem>
                {PREFERRED_LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
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
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, mobile, or registration number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
        />
      </div>

      {/* Table */}
      < Card className="border-slate-200" >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">Reg. No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Added By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRegs && filteredRegs.length > 0 ? (
                filteredRegs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${getAvatarColor(reg.studentName).bg} ${getAvatarColor(reg.studentName).text}`}>
                          {getInitials(reg.studentName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{reg.studentName}</p>
                          {reg.needsLoan && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                              Loan
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-700 flex items-center gap-1">
                          <Phone size={11} className="text-slate-400" />
                          {reg.mobile}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={11} className="text-slate-400" />
                          {reg.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden lg:table-cell">
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">
                        {reg.registrationNo}
                      </code>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600 hidden sm:table-cell">
                      {format(new Date(reg.registrationDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600 hidden sm:table-cell">
                      {reg.created_by_name || '-'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${reg.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                        reg.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {reg.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setViewReg(reg)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteClick(reg)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <p className="font-medium">No registrations found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card >

      {/* Quick View Modal - Redesigned to match Enquiry modal */}
      <Dialog.Root open={!!viewReg} onOpenChange={() => setViewReg(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] h-[85vh] w-[90vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-xl focus:outline-none z-50 border border-slate-200 overflow-hidden flex flex-col">
            {viewReg && (
              <RegistrationViewModal
                registration={viewReg}
                onClose={() => setViewReg(null)}
                router={router}
                onPrintReceipt={() => {
                  setReceiptData(viewReg);
                  setShowReceipt(true);
                  setViewReg(null);
                }}
                documentTab={documentTab}
                setDocumentTab={setDocumentTab}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirmation Dialog for Admins */}
      < ConfirmDialog
        open={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setDeleteReg(null);
        }}
        onConfirm={handleDirectDelete}
        title="Delete Registration"
        description={
          deleteReg
            ? `Are you sure you want to delete the registration for ${deleteReg.studentName}? This action cannot be undone.`
            : 'Are you sure you want to delete this registration?'
        }
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Request Modal for Employees - Delete */}
      < RequestActionModal
        open={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setDeleteReg(null);
        }}
        onSubmit={handleSubmitDeleteRequest}
        action="DELETE"
        entityType="Registration"
        entityName={deleteReg?.studentName || ''}
        isLoading={requestDeleteMutation.isPending}
      />

      {/* Edit Registration Modal */}
      < Dialog.Root open={!!editReg} onOpenChange={() => setEditReg(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[90vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none z-50 border border-slate-200 overflow-y-auto">
            {editReg && (
              <>
                <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 font-heading">
                  Edit Registration - {editReg.studentName}
                </Dialog.Title>

                <RegistrationForm
                  onSubmit={handleEditSubmit}
                  isLoading={updateMutation.isPending || requestUpdateMutation.isPending}
                  initialData={editReg}
                  isEdit={true}
                />

                <Dialog.Close asChild>
                  <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root >

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <RegistrationReceipt
          data={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div >
  );
}

function InfoItem({ label, value, icon: Icon }: any) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </p>
      <p className="text-sm text-slate-900 font-medium">{value}</p>
    </div>
  );
}

// Tab configuration for the Registration modal
const REG_MODAL_TABS = [
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'family', label: 'Family & Address', icon: Phone },
  { id: 'academic', label: 'Academic', icon: GraduationCap },
  { id: 'payment', label: 'Payment', icon: FileText },
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

// Registration View Modal Component with Tabs
function RegistrationViewModal({
  registration,
  onClose,
  router,
  onPrintReceipt,
  documentTab,
  setDocumentTab
}: {
  registration: Registration;
  onClose: () => void;
  router: any;
  onPrintReceipt: () => void;
  documentTab: 'digital' | 'physical';
  setDocumentTab: (tab: 'digital' | 'physical') => void;
}) {
  const [activeTab, setActiveTab] = useState('personal');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${getAvatarColor(registration.studentName).bg} ${getAvatarColor(registration.studentName).text}`}>
                  {getInitials(registration.studentName)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{registration.studentName}</h3>
                  <p className="text-sm text-slate-600">Reg No: <span className="font-mono">{registration.registrationNo}</span></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-white px-2 py-1 rounded border border-teal-200">{registration.gender || 'N/A'}</span>
                    <span className="text-xs bg-white px-2 py-1 rounded border border-teal-200">DOB: {registration.dateOfBirth ? format(new Date(registration.dateOfBirth), 'dd MMM yyyy') : 'N/A'}</span>
                    {registration.caste && <span className="text-xs bg-white px-2 py-1 rounded border border-teal-200">{registration.caste}</span>}
                    {registration.religion && <span className="text-xs bg-white px-2 py-1 rounded border border-teal-200">{registration.religion}</span>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${registration.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : registration.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {registration.paymentStatus}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <ModalField label="Mobile" value={registration.mobile} icon={Phone} />
                <ModalField label="Email" value={registration.email} icon={Mail} />
                <ModalField label="Registration Date" value={format(new Date(registration.registrationDate), 'dd MMM yyyy')} />
                <ModalField label="Added By" value={registration.created_by_name || '-'} icon={UserCircle} />
              </div>
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            {/* Father's Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Father's Information</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Name" value={registration.fatherName || '-'} />
                  <ModalField label="Occupation" value={registration.fatherOccupation || '-'} />
                  <ModalField label="Mobile" value={registration.fatherMobile || '-'} icon={Phone} />
                </div>
              </div>
            </div>

            {/* Mother's Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Mother's Information</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Name" value={registration.motherName || '-'} />
                  <ModalField label="Occupation" value={registration.motherOccupation || '-'} />
                  <ModalField label="Mobile" value={registration.motherMobile || '-'} icon={Phone} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Address Details</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="City/Place" value={registration.familyPlace || '-'} />
                  <ModalField label="State" value={registration.familyState || '-'} />
                  <div className="col-span-2">
                    <ModalField label="Permanent Address" value={registration.permanentAddress || '-'} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'academic':
        return (
          <div className="space-y-6">
            {/* Class 12 Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">HSSLC / Class 12 Details</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="School Name" value={registration.schoolName || '-'} />
                  <ModalField label="Board" value={registration.schoolBoard || '-'} />
                  <ModalField label="Stream" value={(registration as any).stream || '-'} />
                  <ModalField label="Passing Year" value={registration.class12PassingYear || '-'} />
                  <ModalField label="Percentage" value={registration.class12Percentage ? `${registration.class12Percentage}%` : '-'} />
                  <ModalField label="City/Place" value={registration.schoolPlace || '-'} />
                  <ModalField label="State" value={registration.schoolState || '-'} />
                </div>
              </div>
            </div>

            {/* Class 10 Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">HSLC / Class 10 Details</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="School Name" value={registration.class10SchoolName || '-'} />
                  <ModalField label="Board" value={registration.class10Board || '-'} />
                  <ModalField label="Passing Year" value={registration.class10PassingYear || '-'} />
                  <ModalField label="Percentage" value={registration.class10Percentage ? `${registration.class10Percentage}%` : '-'} />
                  <ModalField label="City/Place" value={registration.class10Place || '-'} />
                  <ModalField label="State" value={registration.class10State || '-'} />
                </div>
              </div>
            </div>

            {/* Science Scorecard */}
            {(registration.physicsMarks || registration.chemistryMarks || registration.biologyMarks || registration.mathsMarks) && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Science Scorecard</h4>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ModalField label="Physics" value={registration.physicsMarks || '-'} />
                    <ModalField label="Chemistry" value={registration.chemistryMarks || '-'} />
                    <ModalField label="Biology" value={registration.biologyMarks || '-'} />
                    <ModalField label="Maths" value={registration.mathsMarks || '-'} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-purple-200">
                    <ModalField label="PCB %" value={registration.pcbPercentage ? `${registration.pcbPercentage}%` : '-'} />
                    <ModalField label="PCM %" value={registration.pcmPercentage ? `${registration.pcmPercentage}%` : '-'} />
                  </div>
                </div>
              </div>
            )}

            {/* Gap Year / Dropout */}
            {registration.gapYear && (
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Gap Year</span>
                  {registration.gapYearFrom && registration.gapYearTo && <span className="text-sm text-slate-600">({registration.gapYearFrom} - {registration.gapYearTo})</span>}
                </div>
              </div>
            )}

            {/* Preferences */}
            {registration.preferences && registration.preferences.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Study Preferences</h4>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {registration.preferences.map((pref: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-orange-200">
                        <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                          {typeof pref === 'object' && 'priority' in pref ? pref.priority : idx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{typeof pref === 'string' ? pref : pref.courseName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="text-center py-6 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-100">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Registration Fee</p>
              <p className="text-4xl font-bold text-teal-600">₹{registration.registrationFee?.toLocaleString() || '0'}</p>
              <span className={`inline-flex mt-3 px-4 py-1.5 rounded-full text-sm font-bold ${registration.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                registration.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {registration.paymentStatus}
              </span>
            </div>

            {/* Payment Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Payment Information</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Payment Method" value={registration.paymentMethod || '-'} />
                  <ModalField label="Needs Loan" value={registration.needsLoan ? 'Yes' : 'No'} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            {/* Tab Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setDocumentTab('digital')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${documentTab === 'digital'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                Digital Documents
              </button>
              <button
                onClick={() => setDocumentTab('physical')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${documentTab === 'physical'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                Physical Documents
              </button>
            </div>

            {documentTab === 'digital' && (
              registration.documents && registration.documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {registration.documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{doc.file_name || doc.fileName}</p>
                          {doc.description && <p className="text-xs text-slate-400 truncate">{doc.description}</p>}
                        </div>
                      </div>
                      {doc.file && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.file, '_blank')}
                          className="text-blue-600 hover:text-blue-700 shrink-0"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No digital documents uploaded</p>
                </div>
              )
            )}

            {documentTab === 'physical' && (
              registration.student_documents && registration.student_documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {registration.student_documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                          <div className="flex gap-2 text-xs text-slate-500">
                            {doc.document_number && <span>#{doc.document_number}</span>}
                            {doc.remarks && <span className="italic">{doc.remarks}</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full shrink-0 font-medium ${doc.status === 'Held' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No physical documents on record</p>
                </div>
              )
            )}
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
        <Dialog.Title className="text-lg font-bold text-slate-900">Registration Details</Dialog.Title>
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
          {REG_MODAL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${isActive ? 'bg-teal-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
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
          variant="outline"
          className="h-10 px-6 border-teal-300 text-teal-700 hover:bg-teal-50"
          onClick={onPrintReceipt}
        >
          <FileText size={16} className="mr-2" /> Print Receipt
        </Button>
        <Button
          className="h-10 px-6 bg-teal-600 hover:bg-teal-700"
          onClick={() => {
            router.push(`/app/student-profile/registration/${registration.id}`);
            onClose();
          }}
        >
          <Edit size={16} className="mr-2" /> View Full Profile
        </Button>
      </div>
    </>
  );
}

