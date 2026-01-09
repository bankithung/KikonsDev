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
import { Eye, Edit, Trash2, Phone, Mail, FileText, Search, X, GraduationCap, UserCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { RegistrationForm } from './RegistrationForm';
import { RegistrationReceipt } from '@/components/receipts/RegistrationReceipt';
import toast from 'react-hot-toast';

export function RegistrationList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [viewReg, setViewReg] = useState<Registration | null>(null);
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteReg, setDeleteReg] = useState<Registration | null>(null);
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
    const matchesStatus = filterPaymentStatus === 'all' || reg.paymentStatus === filterPaymentStatus;

    return matchesSearch && matchesStatus;
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
          </SelectContent >
        </Select >
      </div >

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
                    <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">
                      {reg.created_by_name || '-'}
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

      {/* Quick View Modal */}
      < Dialog.Root open={!!viewReg
      } onOpenChange={() => setViewReg(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[95vw] max-w-[1000px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none z-50 border border-slate-200 overflow-y-auto">
            {viewReg && (
              <>
                <Dialog.Title className="text-xl font-bold text-slate-900 mb-4 font-heading flex justify-between items-center">
                  <span>Registration Details</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${viewReg.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {viewReg.paymentStatus}
                  </span>
                </Dialog.Title>

                <div className="space-y-6">
                  {/* Student Info Header */}
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xl">
                        {viewReg.studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 font-heading">{viewReg.studentName}</h3>
                        <p className="text-sm text-slate-600">Reg No: {viewReg.registrationNo}</p>
                        <div className="flex gap-4 mt-1">
                          <div className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-teal-100">{viewReg.gender || 'Gender: N/A'}</div>
                          <div className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-teal-100">DOB: {viewReg.dateOfBirth ? format(new Date(viewReg.dateOfBirth), 'dd MMM yyyy') : 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoItem label="Mobile" value={viewReg.mobile} icon={Phone} />
                    <InfoItem label="Email" value={viewReg.email} icon={Mail} />
                    <InfoItem label="Reg Date" value={format(new Date(viewReg.registrationDate), 'dd MMM yyyy')} />
                    <InfoItem label="Added By" value={viewReg.created_by_name || '-'} icon={UserCircle} />
                  </div>

                  {/* Academic Details - New Section */}
                  {(viewReg.schoolName || viewReg.schoolBoard || viewReg.schoolPlace || viewReg.schoolState || viewReg.class12Percentage || viewReg.class10Percentage) && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 font-heading">Academic Details</h4>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <InfoItem label="School Name" value={viewReg.schoolName || '-'} />
                          <InfoItem label="Board" value={viewReg.schoolBoard || '-'} />
                          <InfoItem label="School Location" value={[viewReg.schoolPlace, viewReg.schoolState].filter(Boolean).join(', ') || '-'} />
                          <InfoItem label="12th Passing Year" value={viewReg.class12PassingYear || '-'} />
                          <InfoItem label="12th %" value={viewReg.class12Percentage ? `${viewReg.class12Percentage}%` : '-'} />
                          <InfoItem label="10th %" value={viewReg.class10Percentage ? `${viewReg.class10Percentage}%` : '-'} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Marks (Science) - New Section */}
                  {(viewReg.pcbPercentage || viewReg.pcmPercentage || viewReg.physicsMarks ||
                    viewReg.chemistryMarks || viewReg.biologyMarks || viewReg.mathsMarks) && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3 font-heading">Science Scores</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {viewReg.pcbPercentage && <InfoItem label="PCB %" value={`${viewReg.pcbPercentage}%`} />}
                            {viewReg.pcmPercentage && <InfoItem label="PCM %" value={`${viewReg.pcmPercentage}%`} />}
                            {viewReg.physicsMarks && <InfoItem label="Physics" value={viewReg.physicsMarks} />}
                            {viewReg.chemistryMarks && <InfoItem label="Chemistry" value={viewReg.chemistryMarks} />}
                            {viewReg.biologyMarks && <InfoItem label="Biology" value={viewReg.biologyMarks} />}
                            {viewReg.mathsMarks && <InfoItem label="Maths" value={viewReg.mathsMarks} />}
                          </div>
                          {(viewReg.gapYear) && (
                            <div className="flex gap-3 mt-4 pt-4 border-t border-blue-300">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Gap Year</span>
                                {viewReg.gapYearFrom && viewReg.gapYearTo && <span className="text-xs text-blue-800">({viewReg.gapYearFrom} - {viewReg.gapYearTo})</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Family & Address Details */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 font-heading">Family & Address</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Father's Name</p>
                          <p className="text-sm text-slate-900 font-semibold">{viewReg.fatherName || '-'}</p>
                          <div className="flex gap-2 text-xs text-slate-600 mt-1">
                            {viewReg.fatherOccupation && <span>{viewReg.fatherOccupation}</span>}
                            {viewReg.fatherMobile && <span className="flex items-center gap-1"><Phone size={10} /> {viewReg.fatherMobile}</span>}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Mother's Name</p>
                          <p className="text-sm text-slate-900 font-semibold">{viewReg.motherName || '-'}</p>
                          <div className="flex gap-2 text-xs text-slate-600 mt-1">
                            {viewReg.motherOccupation && <span>{viewReg.motherOccupation}</span>}
                            {viewReg.motherMobile && <span className="flex items-center gap-1"><Phone size={10} /> {viewReg.motherMobile}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Family Location</p>
                          <p className="text-sm text-slate-700">{[viewReg.familyPlace, viewReg.familyState].filter(Boolean).join(', ') || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Permanent Address</p>
                          <p className="text-sm text-slate-700">{viewReg.permanentAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Information */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">Payment Details</h4>
                      <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs text-slate-500">Registration Fee</span>
                          <span className="text-sm font-bold text-blue-600">₹{viewReg.registrationFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-slate-500">Payment Method</p>
                            <p className="text-sm font-medium">{viewReg.paymentMethod}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 text-right">Status</p>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${viewReg.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {viewReg.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Needs Loan</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${viewReg.needsLoan ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {viewReg.needsLoan ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Documents Section with Tabs */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Documents</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDocumentTab('digital')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${documentTab === 'digital'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Digital Docs
                          </button>
                          <button
                            onClick={() => setDocumentTab('physical')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${documentTab === 'physical'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Physical Docs
                          </button>
                        </div>
                      </div>

                      {/* Digital Documents Tab */}
                      {documentTab === 'digital' && (
                        viewReg.documents && viewReg.documents.length > 0 ? (
                          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <div className="divide-y divide-slate-100 max-h-[160px] overflow-y-auto">
                              {viewReg.documents.map((doc: any) => (
                                <div key={doc.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileText size={16} className="text-slate-400" />
                                    <div>
                                      <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{doc.file_name || doc.fileName}</p>
                                      {doc.description && <p className="text-xs text-slate-400">{doc.description}</p>}
                                    </div>
                                  </div>
                                  {doc.file && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(doc.file, '_blank')}
                                      className="text-blue-600 hover:text-blue-700 text-xs h-7 px-2"
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 italic p-3 border border-slate-200 rounded bg-slate-50">No digital documents uploaded</div>
                        )
                      )}

                      {/* Physical Documents Tab */}
                      {documentTab === 'physical' && (
                        viewReg.student_documents && viewReg.student_documents.length > 0 ? (
                          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <div className="divide-y divide-slate-100 max-h-[160px] overflow-y-auto">
                              {viewReg.student_documents.map((doc: any) => (
                                <div key={doc.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <FileText size={16} className="text-amber-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                                      <div className="flex gap-2 mt-0.5">
                                        {doc.document_number && (
                                          <span className="text-xs text-slate-500">#{doc.document_number}</span>
                                        )}
                                        {doc.remarks && (
                                          <span className="text-xs text-slate-400 italic">{doc.remarks}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'Held' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {doc.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 italic p-3 border border-slate-200 rounded bg-slate-50">No physical documents on record</div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Preferences Section */}
                  {viewReg.preferences && viewReg.preferences.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 font-heading">Study Preferences</h4>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex flex-wrap gap-2">
                          {viewReg.preferences.map((pref, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-slate-200 shadow-sm">
                              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">{typeof pref === 'object' && 'priority' in pref ? pref.priority : idx + 1}</span>
                              <div className="text-xs">
                                <span className="font-semibold block text-slate-800">{typeof pref === 'string' ? pref : pref.courseName}</span>
                                {typeof pref === 'object' && 'location' in pref && <span className="text-slate-500">{pref.location}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Reorganized */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Primary Actions */}
                      <div className="flex gap-3 flex-1">
                        <Button
                          variant="outline"
                          className="flex-1 h-11"
                          onClick={() => setViewReg(null)}
                        >
                          Close
                        </Button>
                        <Button
                          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => router.push(`/app/student-profile/registration/${viewReg.id}`)}
                        >
                          <UserCircle size={16} className="mr-2" /> Full Profile
                        </Button>
                      </div>

                      {/* Secondary Action */}
                      <Button
                        className="sm:w-auto w-full h-11 bg-teal-600 hover:bg-teal-700"
                        onClick={() => {
                          setReceiptData(viewReg);
                          setShowReceipt(true);
                          setViewReg(null);
                        }}
                      >
                        <FileText size={16} className="mr-2" /> Print Receipt
                      </Button>
                    </div>
                  </div>
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
      </Dialog.Root >

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
