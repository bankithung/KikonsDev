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
import { Eye, Edit, Trash2, FileText, Search, GraduationCap, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { toast } from '@/store/toastStore';

export function EnrollmentList() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewEnroll, setViewEnroll] = useState<Enrollment | null>(null);
  const [actionEnroll, setActionEnroll] = useState<Enrollment | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: apiClient.enrollments.list,
  });

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
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div className="flex items-center justify-center p-8"><div className="animate-pulse text-slate-500">Loading enrollments...</div></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or enrollment number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-300"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-11 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Fees</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEnrolls && filteredEnrolls.length > 0 ? (
                filteredEnrolls.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold shrink-0">
                          {enr.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{enr.studentName}</p>
                          <code className="text-xs text-slate-500 font-mono">{enr.enrollmentNo}</code>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-sm font-medium text-slate-900">{enr.programName}</p>
                      <p className="text-xs text-slate-500">{enr.durationMonths} months</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 hidden md:table-cell">
                      {format(new Date(enr.startDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-900">₹{enr.totalFees.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{enr.paymentType}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${enr.status === 'Active' ? 'bg-green-100 text-green-700' :
                        enr.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {enr.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
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
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <GraduationCap size={40} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">No enrollments found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick View Modal */}
      <Dialog.Root open={!!viewEnroll} onOpenChange={() => setViewEnroll(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none z-50 border border-slate-200 overflow-y-auto">
            {viewEnroll && (
              <>
                <Dialog.Title className="text-xl font-bold text-slate-900 mb-4 font-heading">
                  Enrollment Details
                </Dialog.Title>

                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 font-heading">{viewEnroll.studentName}</h3>
                    <p className="text-sm text-slate-600">{viewEnroll.programName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Enrollment No</p>
                      <code className="text-sm font-mono text-slate-900">{viewEnroll.enrollmentNo}</code>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Start Date</p>
                      <p className="text-sm text-slate-900">{format(new Date(viewEnroll.startDate), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Total Fees</p>
                      <p className="text-sm font-bold text-slate-900">₹{viewEnroll.totalFees.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Payment Type</p>
                      <p className="text-sm text-slate-900">{viewEnroll.paymentType}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setViewEnroll(null)}>Close</Button>
                  <Button className="flex-1 h-11 bg-teal-600 hover:bg-teal-700">Print Receipt</Button>
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
