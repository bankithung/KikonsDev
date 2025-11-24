'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter, Search, Eye, Edit, Trash2, X, Phone, Mail, GraduationCap } from 'lucide-react';
import { Enquiry } from '@/lib/types';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { toast } from '@/store/toastStore';

export default function EnquiriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewEnquiry, setViewEnquiry] = useState<Enquiry | null>(null);
  const [actionEnquiry, setActionEnquiry] = useState<Enquiry | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['enquiries'],
    queryFn: apiClient.enquiries.list,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.enquiries.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setShowConfirm(false);
      setActionEnquiry(null);
      alert('Enquiry deleted successfully');
    },
    onError: (error) => {
      console.error("Failed to delete enquiry", error);
      alert('Failed to delete enquiry');
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!actionEnquiry) return;
      await apiClient.approvalRequests.create({
        action: 'DELETE',
        entity_type: 'enquiry',
        entity_id: Number(actionEnquiry.id),
        entity_name: actionEnquiry.candidateName,
        message: data.message,
      });
    },
    onSuccess: () => {
      setShowRequest(false);
      setActionEnquiry(null);
      toast.success('Delete request sent to admin for approval');
    },
    onError: (error) => {
      console.error("Failed to create request", error);
      alert('Failed to create request');
    }
  });

  const handleDirectDelete = () => {
    if (actionEnquiry) {
      deleteMutation.mutate(actionEnquiry.id);
    }
  };

  const handleSubmitRequest = (message: string) => {
    requestMutation.mutate({ message });
  };

  const handleDeleteClick = (enquiry: Enquiry) => {
    setActionEnquiry(enquiry);

    if (user?.role === 'COMPANY_ADMIN' || user?.role === 'DEV_ADMIN') {
      setShowConfirm(true);
    } else {
      setShowRequest(true);
    }
  };

  const filteredEnquiries = enquiries?.filter(enq => {
    const matchesSearch = enq.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.mobile.includes(searchTerm) ||
      enq.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || enq.status === filterStatus;
    const matchesStream = filterStream === 'all' || enq.stream === filterStream;

    return matchesSearch && matchesStatus && matchesStream;
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-slate-500">Loading enquiries...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Enquiries</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Manage and track all student enquiries</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button onClick={() => router.push('/app/enquiries/new')} className="h-9 bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" /> New Enquiry
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {isFilterOpen && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Stream</Label>
                <Select value={filterStream} onValueChange={setFilterStream}>
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streams</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterStream('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, mobile, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 border-slate-300"
        />
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">Academic</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Added By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEnquiries && filteredEnquiries.length > 0 ? (
                filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold shrink-0">
                          {enquiry.candidateName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{enquiry.candidateName}</p>
                          <p className="text-xs text-slate-500 truncate sm:hidden">{enquiry.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-700 flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          {enquiry.mobile}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" />
                          {enquiry.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">{enquiry.courseInterested}</p>
                        <p className="text-xs text-slate-500">{enquiry.stream} • {enquiry.schoolName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">
                      {format(new Date(enquiry.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">
                      {enquiry.created_by_name || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${enquiry.status === 'New' ? 'bg-blue-100 text-blue-700' :
                        enquiry.status === 'Converted' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setViewEnquiry(enquiry)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-600"
                          onClick={() => router.push(`/app/enquiries/${enquiry.id}`)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteClick(enquiry)}
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
                    <div className="flex flex-col items-center gap-2">
                      <GraduationCap size={40} className="text-slate-300" />
                      <p className="font-medium">No enquiries found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick View Modal */}
      <Dialog.Root open={!!viewEnquiry} onOpenChange={() => setViewEnquiry(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none z-50 border border-slate-200 overflow-y-auto">
            {viewEnquiry && (
              <>
                <Dialog.Title className="text-xl font-bold text-slate-900 mb-4 font-heading">
                  Enquiry Details
                </Dialog.Title>

                <div className="space-y-6">
                  {/* Student Info */}
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xl">
                        {viewEnquiry.candidateName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 font-heading">{viewEnquiry.candidateName}</h3>
                        <p className="text-sm text-slate-600">ID: {viewEnquiry.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Mobile" value={viewEnquiry.mobile} icon={Phone} />
                    <InfoItem label="Email" value={viewEnquiry.email} icon={Mail} />
                    <InfoItem label="Course" value={viewEnquiry.courseInterested} icon={GraduationCap} />
                    <InfoItem label="Stream" value={viewEnquiry.stream} />
                    <InfoItem label="School" value={viewEnquiry.schoolName} />
                    <InfoItem label="Date" value={format(new Date(viewEnquiry.date), 'dd MMM yyyy')} />
                  </div>

                  {/* Family Details */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 font-heading">Family Details</h4>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                      <p className="text-slate-700"><span className="font-semibold">Father:</span> {viewEnquiry.fatherName}</p>
                      <p className="text-slate-700"><span className="font-semibold">Mother:</span> {viewEnquiry.motherName}</p>
                      <p className="text-slate-600 text-xs">{viewEnquiry.permanentAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setViewEnquiry(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 h-11 bg-teal-600 hover:bg-teal-700"
                    onClick={() => {
                      router.push(`/app/enquiries/${viewEnquiry.id}`);
                      setViewEnquiry(null);
                    }}
                  >
                    <Edit size={16} className="mr-2" /> Edit Details
                  </Button>
                </div>

                <Dialog.Close asChild>
                  <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
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
          setActionEnquiry(null);
        }}
        onConfirm={handleDirectDelete}
        title="Delete Enquiry"
        description={
          actionEnquiry
            ? `Are you sure you want to delete the enquiry from ${actionEnquiry.candidateName}? This action cannot be undone.`
            : 'Are you sure you want to delete this enquiry?'
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
          setActionEnquiry(null);
        }}
        onSubmit={handleSubmitRequest}
        action="DELETE"
        entityType="Enquiry"
        entityName={actionEnquiry?.candidateName || ''}
        isLoading={requestMutation.isPending}
      />
    </div>
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
