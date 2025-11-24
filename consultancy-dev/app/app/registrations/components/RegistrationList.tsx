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
import { Eye, Edit, Trash2, Phone, Mail, FileText, Search, X, GraduationCap } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { RegistrationForm } from './RegistrationForm';
import toast from 'react-hot-toast';

export function RegistrationList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [viewReg, setViewReg] = useState<Registration | null>(null);
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [actionReg, setActionReg] = useState<Registration | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

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


  const filteredRegs = registrations?.filter(reg => {
    const matchesSearch = reg.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.mobile.includes(searchTerm) ||
      reg.registrationNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = filterPaymentStatus === 'all' || reg.paymentStatus === filterPaymentStatus;
    return matchesSearch && matchesPayment;
  });

  if (isLoading) return <div className="flex items-center justify-center p-8"><div className="animate-pulse text-slate-500">Loading registrations...</div></div>;

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, mobile, or registration number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-300"
          />
        </div>
        <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
          <SelectTrigger className="h-11 bg-white">
            <SelectValue placeholder="Filter by payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Status</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">Reg. No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRegs && filteredRegs.length > 0 ? (
                filteredRegs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold shrink-0">
                          {reg.studentName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{reg.studentName}</p>
                          {reg.needsLoan && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 mt-1">
                              Needs Loan
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-700 flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          {reg.mobile}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" />
                          {reg.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
                        {reg.registrationNo}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">
                      {format(new Date(reg.registrationDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${reg.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                        reg.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {reg.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
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
                          className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-600"
                          onClick={() => handleEditClick(reg)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => router.push(`/app/enrollments/new?regId=${reg.id}`)}
                          title="Enroll Student"
                        >
                          <GraduationCap size={16} />
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
      </Card>

      {/* Quick View Modal */}
      <Dialog.Root open={!!viewReg} onOpenChange={() => setViewReg(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none z-50 border border-slate-200 overflow-y-auto">
            {viewReg && (
              <>
                <Dialog.Title className="text-xl font-bold text-slate-900 mb-4 font-heading">
                  Registration Details
                </Dialog.Title>

                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xl">
                        {viewReg.studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 font-heading">{viewReg.studentName}</h3>
                        <code className="text-xs bg-white px-2 py-1 rounded font-mono text-slate-700">
                          {viewReg.registrationNo}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Mobile</p>
                      <p className="text-sm text-slate-900 font-medium">{viewReg.mobile}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Email</p>
                      <p className="text-sm text-slate-900 font-medium">{viewReg.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Fee</p>
                      <p className="text-sm text-slate-900 font-bold">₹{viewReg.registrationFee}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Payment</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${viewReg.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {viewReg.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setViewReg(null)}>
                    Close
                  </Button>
                  <Button className="flex-1 h-11 bg-teal-600 hover:bg-teal-700">
                    <FileText size={16} className="mr-2" /> Print Receipt
                  </Button>
                </div>

                <Dialog.Close asChild>
                  <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirmation Dialog for Admins */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setActionReg(null);
        }}
        onConfirm={handleDirectDelete}
        title="Delete Registration"
        description={
          actionReg
            ? `Are you sure you want to delete the registration for ${actionReg.studentName}? This action cannot be undone.`
            : 'Are you sure you want to delete this registration?'
        }
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Request Modal for Employees - Delete */}
      <RequestActionModal
        open={showRequest}
        onClose={() => {
          setShowRequest(false);
          setActionReg(null);
        }}
        onSubmit={handleSubmitDeleteRequest}
        action="DELETE"
        entityType="Registration"
        entityName={actionReg?.studentName || ''}
        isLoading={requestDeleteMutation.isPending}
      />

      {/* Edit Registration Modal */}
      <Dialog.Root open={!!editReg} onOpenChange={() => setEditReg(null)}>
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
      </Dialog.Root>
    </div>
  );
}
