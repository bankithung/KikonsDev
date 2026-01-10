'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Phone, Mail, MessageSquare, CheckCircle, AlertCircle, Plus, Search, Filter, Eye, MoreHorizontal, MessageCircle, Share, Heart, Bookmark, BarChart2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogPortal } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Enquiry } from '@/lib/types';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { CompleteFollowUpModal } from '@/components/common/CompleteFollowUpModal';
import { useRouter } from 'next/navigation';

interface FollowUp {
  id: string;
  enquiryId: string;
  studentName: string;
  type: 'Call' | 'Email' | 'SMS' | 'WhatsApp';
  scheduledFor: string;
  status: 'Pending' | 'Completed' | 'Missed';
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  assignedTo: number | null;
  assignedToName?: string;
  assignedToEmail?: string;
  created_by_name?: string;
  created_at: string;
}

export default function FollowUpsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [rescheduleData, setRescheduleData] = useState<{ id: string, date: string, time: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [newFollowUp, setNewFollowUp] = useState({
    enquiryId: '',
    type: 'Call',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    priority: 'Medium',
    notes: '',
    assignedToId: ''
  });

  const queryClient = useQueryClient();

  const { data: enquiries = [] } = useQuery<Enquiry[]>({
    queryKey: ['enquiries'],
    queryFn: apiClient.enquiries.list,
  });

  const { data: companyUsers = [] } = useQuery<any[]>({
    queryKey: ['companyUsers'],
    queryFn: apiClient.getCompanyUsers,
  });

  const { data: followUps = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ['followUps'],
    queryFn: apiClient.followUps.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiClient.followUps.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      toast.success('Follow-up updated!');
    },
  });

  const createMutation = useMutation({
    mutationFn: apiClient.followUps.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      setIsCreateOpen(false);
      toast.success('Follow-up scheduled! 🎉');
      setNewFollowUp({
        enquiryId: '',
        type: 'Call',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        priority: 'Medium',
        notes: '',
        assignedToId: ''
      });
    },
    onError: () => toast.error('Failed to schedule follow-up.'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string, comment: string }) => apiClient.followUps.completeWithComment(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      setIsCompleteModalOpen(false);
      setSelectedFollowUp(null);
      toast.success('Follow-up completed! 🎯');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to complete follow-up'),
  });

  const handleReschedule = (followUpId: string, currentDate: string) => {
    const dateObj = new Date(currentDate);
    setRescheduleData({
      id: followUpId,
      date: dateObj.toISOString().split('T')[0],
      time: dateObj.toTimeString().slice(0, 5)
    });
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleData) return;
    updateMutation.mutate({
      id: rescheduleData.id,
      data: {
        scheduledFor: `${rescheduleData.date}T${rescheduleData.time}:00`,
        status: 'Pending'
      }
    });
    setIsRescheduleOpen(false);
    setRescheduleData(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowUp.enquiryId) {
      toast.error('Select an enquiry');
      return;
    }
    createMutation.mutate({
      enquiry: parseInt(newFollowUp.enquiryId),
      type: newFollowUp.type,
      priority: newFollowUp.priority,
      notes: newFollowUp.notes,
      scheduledFor: `${newFollowUp.date}T${newFollowUp.time}:00`,
      assignedToId: newFollowUp.assignedToId || undefined,
      status: 'Pending'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalFollowUps = followUps.length;
  const completedCount = followUps.filter((f: FollowUp) => f.status === 'Completed').length;
  const completionRate = totalFollowUps > 0 ? Math.round((completedCount / totalFollowUps) * 100) : 0;

  const filteredFollowUps = followUps.filter((f: FollowUp) => {
    const matchesSearch = f.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || f.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Pagination
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredFollowUps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFollowUps = filteredFollowUps.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 flex items-center justify-between px-6 py-3 -mx-4 sm:-mx-6 lg:-mx-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filteredFollowUps.length} follow-up{filteredFollowUps.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium px-4 h-10 shadow-sm">
          + Add Follow-up
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
        {/* Main Feed */}
        <div className="lg:col-span-8 border-r border-slate-100">

          {/* Status Filters */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            {['all', 'Pending', 'Completed', 'Missed'].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${filterStatus === status ? 'text-emerald-600 bg-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {status === 'all' ? 'All' : status}
                {filterStatus === status && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600"></div>}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="w-full h-10 bg-white border border-slate-200 rounded-lg pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Feed Content */}
          <div className="p-4 space-y-3">
            {paginatedFollowUps.map((followUp: FollowUp) => (
              <div
                key={followUp.id}
                className="p-3 border border-slate-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group/post relative bg-white"
              >
                <div className="flex gap-2.5">
                  {/* User Avatar */}
                  <div className="shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-semibold text-white">
                      {followUp.studentName.slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{followUp.studentName}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">{formatDistanceToNow(new Date(followUp.scheduledFor), { addSuffix: true })}</span>
                      </div>

                    </div>

                    {/* Tags / Status Indicators */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <Badge className={`text-[9px] px-1.5 py-0 h-5 ${followUp.priority === 'High' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        followUp.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {followUp.priority}
                      </Badge>
                      <Badge className={`text-[9px] px-1.5 py-0 h-5 ${followUp.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        followUp.status === 'Missed' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                        {followUp.status}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5">
                        {followUp.type}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="mb-2">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-1">
                        {followUp.notes || `Scheduled ${followUp.type.toLowerCase()} with ${followUp.studentName}`}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        <span>{format(new Date(followUp.scheduledFor), 'MMM dd, HH:mm')}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px]">{followUp.assignedToName || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="self-center pl-2">
                    <Button
                      size="sm"
                      className="h-9 px-4 text-sm font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/app/follow-ups/${followUp.id}`);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFollowUps.length === 0 && (
              <div className="py-32 text-center">
                <div className="h-20 w-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                  <BarChart2 size={40} />
                </div>
                <p className="text-slate-400 font-medium">No follow-ups found</p>
                <p className="text-slate-400 text-sm mt-1">Adjust your filters or create a new follow-up</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredFollowUps.length > 0 && (
            <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, filteredFollowUps.length)}</span> of <span className="font-semibold">{filteredFollowUps.length}</span> follow-ups
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 rounded-lg"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 rounded-lg"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Stats */}
        <div className="hidden lg:block lg:col-span-4 p-6 space-y-6 bg-slate-50/50 border-l border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Statistics</h2>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Follow-ups</p>
                <p className="text-2xl font-bold text-slate-900">{totalFollowUps}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${completionRate}%` }}></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">High Priority Pending</p>
                <p className="text-2xl font-bold text-rose-600">{followUps.filter(f => f.priority === 'High' && f.status === 'Pending').length}</p>
                <p className="text-xs text-slate-500 mt-1">Require attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Simplified & Refined */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 rounded-[40px] overflow-hidden border-none shadow-2xl">
          <div className="bg-white px-6 py-4 border-b border-slate-200">
            <DialogTitle className="text-xl font-bold text-slate-900">Add New Follow-up</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Schedule a follow-up with a student</p>
          </div>

          <form onSubmit={handleCreate} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Student</Label>
                <Select value={newFollowUp.enquiryId} onValueChange={(val: string) => setNewFollowUp({ ...newFollowUp, enquiryId: val })} required>
                  <SelectTrigger className="h-10 bg-white border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">
                    <SelectValue placeholder="Select a student..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200">
                    {enquiries.map((enq) => (
                      <SelectItem key={enq.id} value={enq.id.toString()}>
                        <span className="font-medium text-slate-900">{enq.candidateName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Contact Method</Label>
                <Select value={newFollowUp.type} onValueChange={(val: string) => setNewFollowUp({ ...newFollowUp, type: val as any })}>
                  <SelectTrigger className="h-10 bg-white border border-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="Call">Phone Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Priority</Label>
                <Select value={newFollowUp.priority} onValueChange={(val: string) => setNewFollowUp({ ...newFollowUp, priority: val as any })}>
                  <SelectTrigger className="h-10 bg-white border border-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Assign to (Employee)</Label>
                <Select value={newFollowUp.assignedToId} onValueChange={(val: string) => setNewFollowUp({ ...newFollowUp, assignedToId: val })}>
                  <SelectTrigger className="h-10 bg-white border border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {companyUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <span className="text-slate-900">{user.first_name || user.username} {user.last_name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Date</Label>
                <Input
                  type="date"
                  value={newFollowUp.date}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })}
                  className="h-10 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Time</Label>
                <Input
                  type="time"
                  value={newFollowUp.time}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, time: e.target.value })}
                  className="h-10 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Notes (Optional)</Label>
              <textarea
                placeholder="Add any additional notes or context..."
                value={newFollowUp.notes}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                className="w-full min-h-[100px] bg-white border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                Add Follow-up
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[400px] p-8 rounded-[32px] border-none shadow-2xl bg-white">
          <div className="mb-6">
            <DialogTitle className="text-xl font-bold text-slate-900">Reschedule Follow-up</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Choose a new date and time</p>
          </div>

          {rescheduleData && (
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">New Date</Label>
                  <Input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="h-10 bg-white border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">New Time</Label>
                  <Input
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                    className="h-10 bg-white border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg" onClick={() => setIsRescheduleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                  Reschedule
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <CompleteFollowUpModal
        followUp={selectedFollowUp}
        open={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setSelectedFollowUp(null);
        }}
        onComplete={(comment) => {
          if (selectedFollowUp) {
            completeMutation.mutate({ id: selectedFollowUp.id, comment });
          }
        }}
        isLoading={completeMutation.isPending}
      />
    </>
  );
}
