'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, User, Phone, Mail, MessageSquare, CheckCircle, Clock, MessageCircle, X, Edit2, Trash2, Reply, MoreVertical, Share, Heart, Bookmark, Plus, BarChart2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { CompleteFollowUpModal } from '@/components/common/CompleteFollowUpModal';
import { FollowUpComment } from '@/lib/types';
import * as Dialog from '@radix-ui/react-dialog';
import { Label } from '@/components/ui/label';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export default function FollowUpDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const id = params.id as string;

    const [comment, setComment] = useState('');
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');

    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const { data: followUp, isLoading } = useQuery({
        queryKey: ['followUp', id],
        queryFn: () => apiClient.followUps.getDetails(id),
        enabled: !!id
    });

    const addCommentMutation = useMutation({
        mutationFn: ({ comment, parentId }: { comment: string, parentId?: string }) =>
            apiClient.followUps.addComment(id, comment, parentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followUp', id] });
            setComment('');
            setReplyText('');
            setReplyingToId(null);
            toast.success('Post added to thread!');
        }
    });

    const updateCommentMutation = useMutation({
        mutationFn: ({ commentId, text }: { commentId: string, text: string }) =>
            apiClient.followUps.updateComment(commentId, text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followUp', id] });
            setEditingCommentId(null);
            setEditText('');
            toast.success('Thread updated!');
        },
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) => apiClient.followUps.deleteComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followUp', id] });
            setDeleteConfirmId(null);
            toast.success('Thread removed!');
        },
    });

    const completeMutation = useMutation({
        mutationFn: (data: { comment: string, outcomeStatus: string, admissionPossibility: number }) => apiClient.followUps.completeWithComment({ id, ...data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followUp', id] });
            queryClient.invalidateQueries({ queryKey: ['followUps'] });
            setShowCompleteModal(false);
            toast.success('Goal achieved! 🎯');
        },
    });

    const rescheduleMutation = useMutation({
        mutationFn: (data: { scheduledFor: string }) => apiClient.followUps.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followUp', id] });
            queryClient.invalidateQueries({ queryKey: ['followUps'] });
            setShowRescheduleModal(false);
            toast.success('Timeline shifted!');
        },
    });

    const { data: allFollowUps = [] } = useQuery({
        queryKey: ['followUps'],
        queryFn: apiClient.followUps.list,
    });

    const totalFollowUps = allFollowUps.length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!followUp) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                <p className="text-slate-500 font-semibold uppercase tracking-widest">Entry Destroyed or Not Found</p>
                <Button onClick={() => router.push('/app/follow-ups')} className="bg-slate-900 rounded-full px-8">Return to Feed</Button>
            </div>
        );
    }

    const isAssigned = user && followUp.assignedTo === user.id;
    const isAdmin = user && ['DEV_ADMIN', 'COMPANY_ADMIN'].includes(user.role);
    const canComplete = (isAssigned || isAdmin) && followUp.status === 'Pending';

    const topLevelComments = followUp.comments?.filter((c: FollowUpComment) => !c.parent_comment) || [];
    const getReplies = (commentId: string) => {
        return followUp.comments?.filter((c: FollowUpComment) => c.parent_comment === commentId) || [];
    };

    const renderComment = (c: FollowUpComment, isReply = false) => {
        const canEdit = user && c.user === user.id;
        const canDelete = user && (c.user === user.id || ['DEV_ADMIN', 'COMPANY_ADMIN'].includes(user.role));
        const isEditing = editingCommentId === c.id;
        const isReplying = replyingToId === c.id;
        const showEdited = c.updated_at && c.updated_at !== c.created_at;
        const replies = getReplies(c.id);

        return (
            <div key={c.id} className={`${isReply ? 'ml-12 mt-4' : 'mt-6 pt-6 border-t border-slate-100'}`}>
                <div className="flex gap-4">
                    <div className="shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200`}>
                            {c.user_name.slice(0, 2).toUpperCase()}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-slate-900">{c.user_name}</span>
                                <span className="text-xs font-medium text-slate-400">@{c.user_name.toLowerCase().replace(/\s/g, '')}</span>
                                <span className="text-slate-300 text-[10px]">•</span>
                                <span className="text-xs font-medium text-slate-400">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                                {c.is_completion_comment && (
                                    <Badge className="bg-slate-100 text-slate-900 border-slate-200 text-[9px] font-semibold uppercase tracking-widest px-1.5 ml-2">Verified Resolve</Badge>
                                )}
                            </div>
                            {(canEdit || canDelete) && !c.is_completion_comment && (
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                        <button className="p-1.5 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                                            <MoreVertical size={16} />
                                        </button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Portal>
                                        <DropdownMenu.Content className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 min-w-[150px]">
                                            {canEdit && (
                                                <DropdownMenu.Item className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer outline-none uppercase tracking-widest" onSelect={() => { setEditingCommentId(c.id); setEditText(c.comment); }}>
                                                    <Edit2 size={14} /> Edit Entry
                                                </DropdownMenu.Item>
                                            )}
                                            {canDelete && (
                                                <DropdownMenu.Item className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 rounded-xl cursor-pointer outline-none uppercase tracking-widest" onSelect={() => setDeleteConfirmId(c.id)}>
                                                    <Trash2 size={14} /> Remove Entry
                                                </DropdownMenu.Item>
                                            )}
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Root>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-3 mt-2">
                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => updateCommentMutation.mutate({ commentId: c.id, text: editText })} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 h-8" disabled={updateCommentMutation.isPending}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="rounded-lg px-4 h-8">Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-1">
                                <p className="text-sm text-slate-700 leading-relaxed">{c.comment}</p>
                                {!c.is_completion_comment && (
                                    <div className="flex items-center gap-4 mt-3">
                                        <button onClick={() => setReplyingToId(isReplying ? null : c.id)} className={`flex items-center gap-1.5 text-xs font-medium transition-all ${isReplying ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-900'}`}>
                                            <MessageCircle size={14} /> {replies.length > 0 && replies.length} Reply
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {isReplying && (
                            <div className="mt-4 space-y-3 border-l-2 border-emerald-500/20 pl-4">
                                <textarea placeholder={`Reply to @${c.user_name.toLowerCase().replace(/\s/g, '')}...`} value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => addCommentMutation.mutate({ comment: replyText, parentId: c.id })} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 h-8" disabled={addCommentMutation.isPending}>Reply</Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setReplyingToId(null); setReplyText(''); }} className="rounded-lg px-4 h-8">Cancel</Button>
                                </div>
                            </div>
                        )}

                        {replies.length > 0 && <div className="space-y-2">{replies.map((reply: FollowUpComment) => renderComment(reply, true))}</div>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => router.push('/app/follow-ups')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 text-sm font-medium"
            >
                <ArrowLeft size={16} />
                Back to Follow-ups
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Follow-up Info Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700 shrink-0">
                                {followUp.studentName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-semibold text-slate-900">{followUp.studentName}</h1>
                                <p className="text-sm text-slate-500 mt-0.5">Follow-up via {followUp.type}</p>
                            </div>
                            <Badge className={`text-xs shrink-0 ${followUp.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                followUp.status === 'Missed' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                    'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                {followUp.status}
                            </Badge>

                            {followUp.status === 'Completed' && followUp.outcome_status && (
                                <Badge variant="outline" className={`text-xs ml-2 ${followUp.outcome_status === 'Positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        followUp.outcome_status.includes('Negative') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                    {followUp.outcome_status}
                                </Badge>
                            )}

                            {followUp.status === 'Completed' && followUp.admission_possibility !== undefined && followUp.admission_possibility > 0 && (
                                <div className="flex items-center gap-1.5 ml-2 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                    <div className="h-1.5 w-12 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${followUp.admission_possibility >= 75 ? 'bg-emerald-500' :
                                                    followUp.admission_possibility >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                                }`}
                                            style={{ width: `${followUp.admission_possibility}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">{followUp.admission_possibility}%</span>
                                </div>
                            )}
                        </div>

                        {followUp.notes && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-slate-700 leading-relaxed">{followUp.notes}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={`text-xs ${followUp.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                followUp.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                {followUp.priority} Priority
                            </Badge>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{followUp.comments?.length || 0} comments</span>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-white rounded-lg border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-900">Comments</h2>
                        </div>

                        <div className="p-6">
                            {topLevelComments.length > 0 ? (
                                <div className="space-y-0">
                                    {topLevelComments.map((c: FollowUpComment) => renderComment(c))}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <MessageCircle size={28} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-500">No comments yet</p>
                                </div>
                            )}
                        </div>

                        {/* Add Comment */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                                    {user?.username?.slice(0, 1).toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <textarea
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[70px] resize-none"
                                        placeholder="Add a comment..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => addCommentMutation.mutate({ comment })}
                                            disabled={addCommentMutation.isPending || !comment.trim()}
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium px-4 h-9"
                                        >
                                            Add Comment
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Details Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Details</h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Scheduled For</p>
                                <p className="text-sm font-medium text-slate-900">{format(new Date(followUp.scheduledFor), 'MMM dd, yyyy')}</p>
                                <p className="text-xs text-slate-500">{format(new Date(followUp.scheduledFor), 'h:mm a')}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Assigned To</p>
                                <p className="text-sm font-medium text-slate-900">{followUp.assignedToName || 'Unassigned'}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Created By</p>
                                <p className="text-sm font-medium text-slate-900">{followUp.created_by_name || '-'}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Contact Method</p>
                                <p className="text-sm font-medium text-slate-900">{followUp.type}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    {canComplete && (
                        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Actions</h3>
                            <Button
                                onClick={() => setShowCompleteModal(true)}
                                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm"
                            >
                                <CheckCircle size={16} className="mr-2" />
                                Mark Complete
                            </Button>
                            <Button
                                onClick={() => setShowRescheduleModal(true)}
                                variant="outline"
                                className="w-full h-10 rounded-lg font-medium text-sm border-slate-200"
                            >
                                <Clock size={16} className="mr-2" />
                                Reschedule
                            </Button>
                        </div>
                    )}

                    {/* Status Display for completed/missed */}
                    {!canComplete && (
                        <div className="bg-white rounded-lg border border-slate-200 p-5">
                            <div className={`w-full py-3 rounded-lg text-center text-sm font-medium ${followUp.status === 'Completed' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' :
                                followUp.status === 'Missed' ? 'text-rose-700 bg-rose-50 border border-rose-200' :
                                    'text-slate-600 bg-slate-50 border border-slate-200'
                                }`}>
                                {followUp.status === 'Completed' ? '✓ Completed' : followUp.status}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reschedule Modal */}
            <Dialog.Root open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[95vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-2xl z-[101] border border-slate-200 animate-in zoom-in-95">
                        <Dialog.Title className="text-lg font-semibold text-slate-900 mb-1">Reschedule Follow-up</Dialog.Title>
                        <p className="text-sm text-slate-500 mb-5">Choose a new date and time</p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">New Date</Label>
                                <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="h-10 bg-white border-slate-200 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">New Time</Label>
                                <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="h-10 bg-white border-slate-200 rounded-lg" />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-5 border-t border-slate-200">
                            <Button variant="outline" onClick={() => setShowRescheduleModal(false)} className="flex-1 h-10 rounded-lg">Cancel</Button>
                            <Button onClick={() => rescheduleMutation.mutate({ scheduledFor: `${rescheduleDate}T${rescheduleTime}:00` })} className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Reschedule</Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Complete Modal */}
            <CompleteFollowUpModal
                followUp={followUp}
                open={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                onComplete={(data) => completeMutation.mutate(data)}
                isLoading={completeMutation.isPending}
            />

            {/* Delete Confirm */}
            <Dialog.Root open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[110]" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[350px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-2xl z-[111] border border-slate-200 animate-in zoom-in-95">
                        <p className="text-lg font-semibold text-slate-900 mb-2">Delete Comment?</p>
                        <p className="text-slate-500 text-sm mb-5">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1 h-10 rounded-lg">Cancel</Button>
                            <Button onClick={() => deleteConfirmId && deleteCommentMutation.mutate(deleteConfirmId)} className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-lg">Delete</Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
