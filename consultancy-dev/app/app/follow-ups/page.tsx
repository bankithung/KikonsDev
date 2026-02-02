'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Phone, Mail, MessageSquare, Plus, Search, Filter, BarChart2, Eye, Calendar, MessageCircle, AlertCircle, X, ChevronRight, Send, User, MoreVertical, Trash2, Edit2, Reply, Layout, FileText, CalendarDays, Clock3, MoreHorizontal, UserCircle2, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getAvatarColor, getInitials } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Enquiry } from '@/lib/types';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { CompleteFollowUpModal } from '@/components/common/CompleteFollowUpModal';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

interface FollowUp {
  id: string;
  enquiryId: string;
  studentName: string;
  student_email?: string;
  student_phone?: string;
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
  outcome_status?: string;
  admission_possibility?: number;
}

interface Comment {
  id: string;
  text: string; // Backend sends 'comment', mapped to text
  author: string; // Backend sends 'user_name'
  timestamp: string; // Backend sends 'created_at'
  user_id?: number;
  parent_comment?: string | null;
  replies?: Comment[];
}

export default function FollowUpsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState<{ id: string, date: string, time: string } | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Comment State
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  // Queries
  const { data: enquiries = [] } = useQuery<Enquiry[]>({
    queryKey: ['enquiries'],
    queryFn: apiClient.enquiries.list,
  });

  const { data: followUps = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ['followUps'],
    queryFn: apiClient.followUps.list,
  });

  // Fetch details for selected follow-up (includes comments)
  const { data: selectedDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['followUp', selectedFollowUpId],
    queryFn: () => apiClient.followUps.getDetails(selectedFollowUpId!),
    enabled: !!selectedFollowUpId
  });

  // Process comments into tree structure
  const commentsTree = useMemo(() => {
    if (!selectedDetails?.comments) return [];

    const commentsMap: Record<string, Comment> = {};
    const rootComments: Comment[] = [];

    // First pass: map and normalize
    selectedDetails.comments.forEach((c: any) => {
      commentsMap[c.id] = {
        id: c.id,
        text: c.comment,
        author: c.user_name || 'Unknown',
        timestamp: c.created_at,
        user_id: c.user,
        parent_comment: c.parent_comment,
        replies: []
      };
    });

    // Second pass: build tree
    selectedDetails.comments.forEach((c: any) => {
      const comment = commentsMap[c.id];
      if (comment.parent_comment && commentsMap[comment.parent_comment]) {
        commentsMap[comment.parent_comment].replies?.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }, [selectedDetails?.comments]);


  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiClient.followUps.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['followUp', selectedFollowUpId] });
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
    mutationFn: (data: { id: string, comment: string, outcomeStatus: string, admissionPossibility: number }) => apiClient.followUps.completeWithComment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['followUp', selectedFollowUpId] });
      setIsCompleteModalOpen(false);
      toast.success('Follow-up completed! 🎯');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to complete follow-up'),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ id, text, parentId }: { id: string, text: string, parentId?: string }) =>
      apiClient.followUps.addComment(id, text, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUp', selectedFollowUpId] });
      setNewComment('');
      setReplyingTo(null);
      // toast.success('Comment added'); 
    },
    onError: () => toast.error('Failed to add comment')
  });

  const deleteCommentMutation = useMutation({
    mutationFn: apiClient.followUps.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUp', selectedFollowUpId] });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment')
  });

  // Actions
  const handleAddComment = () => {
    if (!newComment.trim() || !selectedFollowUpId) return;
    addCommentMutation.mutate({ id: selectedFollowUpId, text: newComment });
  };

  const handleReply = (parentId: string, text: string) => {
    if (!text.trim() || !selectedFollowUpId) return;
    addCommentMutation.mutate({ id: selectedFollowUpId, text, parentId });
  };

  const handleDeleteComment = (commentId: string) => {
    setConfirmDeleteId(commentId);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      deleteCommentMutation.mutate(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowUp.enquiryId) {
      toast.error('Select an enquiry');
      return;
    }
    createMutation.mutate({
      enquiry: newFollowUp.enquiryId,
      type: newFollowUp.type,
      priority: newFollowUp.priority,
      notes: newFollowUp.notes,
      scheduledFor: `${newFollowUp.date}T${newFollowUp.time}:00`,
      assignedToId: newFollowUp.assignedToId || undefined,
      status: 'Pending'
    });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredFollowUps = followUps.filter((f: FollowUp) => {
    const matchesSearch = f.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || f.priority === filterPriority;
    const matchesType = filterType === 'all' || f.type === filterType;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Pagination
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredFollowUps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFollowUps = filteredFollowUps.slice(startIndex, endIndex);

  // Use selectedDetails if available (contains updated comments), fallback to list item
  const selectedFollowUp = selectedFollowUpId ? (selectedDetails || followUps.find(f => f.id === selectedFollowUpId)) : null;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Search, Filters & Add Button Row */}
      <div className="shrink-0 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-white border-slate-200"
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-28 text-xs bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Missed">Missed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-9 w-28 text-xs bg-white">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
          </SelectContent>
        </Select>

        {/* Close Details Button (when visible) */}
        {selectedFollowUp && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-slate-500 hidden md:flex"
            onClick={() => setSelectedFollowUpId(null)}
          >
            Close Details
          </Button>
        )}

        {/* Add Follow-up Button */}
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="mr-1 h-3 w-3" /> Add Follow-up
        </Button>
      </div>

      {/* Stats */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-200 rounded p-2 flex items-center justify-between shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Total</span>
          <span className="text-lg font-bold text-slate-900">{followUps.length}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded p-2 flex items-center justify-between shadow-sm">
          <span className="text-xs font-medium text-emerald-600 uppercase">Completion</span>
          <span className="text-lg font-bold text-emerald-700">
            {followUps.length > 0 ? Math.round((followUps.filter(f => f.status === 'Completed').length / followUps.length) * 100) : 0}%
          </span>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded p-2 flex items-center justify-between shadow-sm">
          <span className="text-xs font-medium text-rose-600 uppercase">High Priority</span>
          <span className="text-lg font-bold text-rose-700">{followUps.filter(f => f.priority === 'High' && f.status === 'Pending').length}</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded p-2 flex items-center justify-between shadow-sm">
          <span className="text-xs font-medium text-blue-600 uppercase">Pending</span>
          <span className="text-lg font-bold text-blue-700">{followUps.filter(f => f.status === 'Pending').length}</span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Left Side: List */}
        <div className={`flex flex-col gap-2 transition-all duration-300 ${selectedFollowUpId ? 'w-full lg:w-7/12 xl:w-2/3 hidden md:flex' : 'w-full'}`}>

          {/* List */}
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-2">
              {paginatedFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  onClick={() => setSelectedFollowUpId(followUp.id)}
                  className={`p-3 border rounded-lg transition-all cursor-pointer group bg-white relative
                                ${selectedFollowUpId === followUp.id
                      ? 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className="shrink-0 pt-0.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0
                                        ${getAvatarColor(followUp.studentName).bg} ${getAvatarColor(followUp.studentName).text}`}>
                        {getInitials(followUp.studentName, 2)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{followUp.studentName}</span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500">{formatDistanceToNow(new Date(followUp.scheduledFor), { addSuffix: true })}</span>
                        </div>
                        <Badge className={`text-[9px] px-1.5 py-0 h-4 ${followUp.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          {followUp.priority}
                        </Badge>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600 line-clamp-1 mb-1">
                            {followUp.notes || `Scheduled ${followUp.type.toLowerCase()}`}
                          </p>
                          {followUp.status === 'Completed' && followUp.outcome_status && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[9px] h-3.5 px-1 ${followUp.outcome_status === 'Positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                followUp.outcome_status.includes('Negative') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                {followUp.outcome_status.split('-')[0].trim()}
                              </Badge>
                              {followUp.admission_possibility !== undefined && followUp.admission_possibility > 0 && (
                                <span className={`text-[9px] font-bold ${followUp.admission_possibility >= 75 ? 'text-emerald-600' :
                                  followUp.admission_possibility >= 40 ? 'text-amber-600' : 'text-rose-600'
                                  }`}>
                                  {followUp.admission_possibility}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronRight size={16} className={`text-slate-300 transition-transform ${selectedFollowUpId === followUp.id ? 'rotate-90 text-emerald-500' : ''}`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="pt-2 flex justify-between items-center text-xs text-slate-500 shrink-0">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        </div>

        {/* Right Side: Details & Comments */}
        {
          selectedFollowUp ? (
            <div className={`flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden transition-all duration-300 shadow-sm group ${selectedFollowUpId ? 'w-full lg:w-5/12 xl:w-1/3 flex' : 'hidden w-0'}`}>
              {/* Compact Panel Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  {/* Smaller Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColor(selectedFollowUp.studentName).bg} ${getAvatarColor(selectedFollowUp.studentName).text}`}>
                    {getInitials(selectedFollowUp.studentName)}
                  </div>

                  {/* Name & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 truncate">{selectedFollowUp.studentName}</h2>
                      <Badge className={`px-1.5 py-0 h-4 text-[9px] font-bold uppercase shrink-0 ${selectedFollowUp.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        selectedFollowUp.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {selectedFollowUp.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                      <CalendarDays size={10} />
                      <span>{format(new Date(selectedFollowUp.scheduledFor), 'MMM d, yyyy')}</span>
                      <span className="text-slate-300">•</span>
                      <Clock3 size={10} />
                      <span>{format(new Date(selectedFollowUp.scheduledFor), 'p')}</span>
                    </div>
                  </div>

                  {/* Action Icons */}
                  <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600" title="View Full Profile" onClick={() => router.push(`/app/follow-ups/${selectedFollowUp.id}`)}>
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 md:hidden" onClick={() => setSelectedFollowUpId(null)}>
                      <X size={14} />
                    </Button>
                  </div>
                </div>

                {/* Compact Progress Bar */}
                {selectedFollowUp.admission_possibility !== undefined && selectedFollowUp.admission_possibility > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                    <span className="text-[9px] text-slate-400 uppercase font-medium">Admission</span>
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${selectedFollowUp.admission_possibility >= 75 ? 'bg-emerald-500' :
                          selectedFollowUp.admission_possibility >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        style={{ width: `${selectedFollowUp.admission_possibility}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-600">{selectedFollowUp.admission_possibility}%</span>
                  </div>
                )}
              </div>

              {/* Compact Notes & Actions */}
              <div className="px-4 py-3 border-b border-slate-100 shrink-0 bg-slate-50/30">
                {/* Inline Notes */}
                <div className="text-xs text-slate-600 bg-white rounded-md border border-slate-100 px-3 py-2 mb-3 leading-relaxed">
                  {selectedFollowUp.notes || <span className="text-slate-400 italic">No notes added</span>}
                </div>

                {/* Compact Action Buttons */}
                <div className="flex gap-2">
                  {selectedFollowUp.status !== 'Completed' && (
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() => setIsCompleteModalOpen(true)}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Complete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                    onClick={() => {
                      setRescheduleData({ id: selectedFollowUp.id, date: selectedFollowUp.scheduledFor.split('T')[0], time: selectedFollowUp.scheduledFor.split('T')[1].slice(0, 5) });
                      setIsRescheduleOpen(true);
                    }}
                  >
                    <Clock className="mr-1.5 h-3.5 w-3.5" /> Reschedule
                  </Button>
                </div>
              </div>

              {/* Compact Activity Log */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageCircle size={10} /> Activity
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold">{commentsTree.length}</span>
                </div>

                <ScrollArea className="flex-1 px-4 py-3">
                  {isDetailsLoading ? (
                    <div className="flex justify-center py-6"><div className="h-5 w-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div></div>
                  ) : commentsTree.length > 0 ? (
                    <div className="space-y-3">
                      {commentsTree.map((comment) => (
                        <div key={comment.id} className="group relative">
                          <div className="flex gap-2.5">
                            {/* Smaller Activity Avatar */}
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                              {comment.author[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Author & Time Inline */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-semibold text-slate-800">{comment.author}</span>
                                <span className="text-[9px] text-slate-400">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
                              </div>

                              {/* Compact Comment Bubble */}
                              <div className="bg-slate-50 px-2.5 py-2 rounded-lg text-xs text-slate-700 border border-slate-100 leading-relaxed">
                                {comment.text}
                              </div>

                              {/* Compact Actions */}
                              <div className="flex items-center gap-3 mt-1 text-[9px] font-medium">
                                <button onClick={() => setReplyingTo(comment.id)} className="text-slate-400 hover:text-emerald-600 transition-colors">Reply</button>
                                {(user?.id === comment.user_id || user?.role === 'DEV_ADMIN') && (
                                  <button onClick={() => handleDeleteComment(comment.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">Delete</button>
                                )}
                              </div>

                              {/* Compact Replies */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-2 space-y-2 pl-3 border-l border-slate-100">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="group/reply flex gap-2">
                                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 shrink-0 mt-0.5">
                                        {reply.author[0]}
                                      </div>
                                      <div className="flex-1">
                                        <div className="bg-white px-2 py-1.5 rounded text-[11px] text-slate-600 border border-slate-100/80">
                                          <span className="font-semibold text-slate-700 mr-1">{reply.author}</span>
                                          {reply.text}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[8px] text-slate-400">{formatDistanceToNow(new Date(reply.timestamp))}</span>
                                          {(user?.id === reply.user_id || user?.role === 'DEV_ADMIN') && (
                                            <button onClick={() => handleDeleteComment(reply.id)} className="text-[8px] text-slate-300 hover:text-rose-500 opacity-0 group-hover/reply:opacity-100 transition-all">Delete</button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reply Input */}
                              {replyingTo === comment.id && (
                                <div className="mt-2 flex gap-1.5 animate-in fade-in slide-in-from-top-1">
                                  <Input
                                    autoFocus
                                    className="h-7 text-[11px] border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    placeholder="Write a reply..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleReply(comment.id, e.currentTarget.value)
                                    }}
                                  />
                                  <Button size="icon" className="h-7 w-7 shrink-0" variant="ghost" onClick={() => setReplyingTo(null)}><X size={12} /></Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                        <MessageSquare size={16} className="text-slate-300" />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400">No activity yet</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Compact Comment Input */}
                <div className="px-3 py-2.5 bg-white border-t border-slate-100 shrink-0">
                  <div className="relative flex items-center">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a note..."
                      className="pl-3 pr-10 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all rounded-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-6 w-6 bg-emerald-600 hover:bg-emerald-700 text-white absolute right-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                    >
                      <Send size={11} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder for Empty Right Side */
            <div className="hidden lg:flex lg:w-5/12 xl:w-1/3 border border-slate-200 border-dashed rounded-xl bg-slate-50/50 items-center justify-center text-slate-400 flex-col gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <User size={32} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium">Select a follow-up to view details</p>
            </div>
          )
        }
      </div>

      {/* Modals remain the same */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] w-[90vw] max-w-[650px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl z-50 border border-slate-200 overflow-hidden outline-none p-0 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <Layout size={20} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 font-heading leading-tight">Add New Follow-up</DialogTitle>
                <p className="text-xs text-slate-500 font-medium">Schedule a meaningful interaction</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="p-6 space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Student Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={12} /> Student
                  </Label>
                  <Select value={newFollowUp.enquiryId} onValueChange={(val) => setNewFollowUp({ ...newFollowUp, enquiryId: val })}>
                    <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500">
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {enquiries.filter(e => e.status === 'New').map(e => (
                        <SelectItem key={e.id} value={e.id.toString()} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {e.candidateName.charAt(0).toUpperCase()}
                            </div>
                            {e.candidateName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Follow-up Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageCircle size={12} /> Type
                  </Label>
                  <Select value={newFollowUp.type} onValueChange={(val: any) => setNewFollowUp({ ...newFollowUp, type: val })}>
                    <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Call" className="cursor-pointer">
                        <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> Call</div>
                      </SelectItem>
                      <SelectItem value="Email" className="cursor-pointer">
                        <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> Email</div>
                      </SelectItem>
                      <SelectItem value="WhatsApp" className="cursor-pointer">
                        <div className="flex items-center gap-2"><MessageCircle size={14} className="text-slate-400" /> WhatsApp</div>
                      </SelectItem>
                      <SelectItem value="SMS" className="cursor-pointer">
                        <div className="flex items-center gap-2"><MessageSquare size={14} className="text-slate-400" /> SMS</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={12} /> Date
                  </Label>
                  <Input
                    type="date"
                    className="h-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    value={newFollowUp.date}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })}
                    required
                  />
                </div>

                {/* Time */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={12} /> Time
                  </Label>
                  <Input
                    type="time"
                    className="h-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    value={newFollowUp.time}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} /> Notes
                </Label>
                <Input
                  className="h-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                  placeholder="Add any relevant notes..."
                />
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5 text-slate-600 border-slate-300 hover:bg-white hover:text-slate-800"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 font-medium"
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Create Follow-up</span>
                </div>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog >

      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-xl">
          <DialogTitle>Reschedule</DialogTitle>
          {rescheduleData && (
            <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Date</Label><Input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} /></div>
                <div className="space-y-1"><Label>Time</Label><Input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full bg-emerald-600">Update</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <CompleteFollowUpModal
        followUp={selectedFollowUp || null}
        open={isCompleteModalOpen}
        onClose={() => { setIsCompleteModalOpen(false); }}
        onComplete={(data) => {
          if (selectedFollowUp) completeMutation.mutate({
            id: selectedFollowUp.id,
            comment: data.comment,
            outcomeStatus: data.outcomeStatus,
            admissionPossibility: data.admissionPossibility
          });
        }}
        isLoading={completeMutation.isPending}
      />

      <ConfirmationModal
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deleteCommentMutation.isPending}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div >
  );
}
