'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, FileEdit, Trash2, User as UserIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from '@/store/toastStore';

export default function ApprovalRequestsPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);

    // Redirect if not admin
    if (user && user.role !== 'DEV_ADMIN' && user.role !== 'COMPANY_ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                <p className="text-slate-600 mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }

    const { data: requests, isLoading } = useQuery({
        queryKey: ['approval-requests'],
        queryFn: apiClient.approvalRequests.list,
    });

    const approveMutation = useMutation({
        mutationFn: async ({ id, note }: { id: number; note: string }) => {
            await apiClient.approvalRequests.approve(id, note);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
            // Invalidate entity caches to show updated data
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            queryClient.invalidateQueries({ queryKey: ['registrations'] });
            queryClient.invalidateQueries({ queryKey: ['enrollments'] });
            handleCloseModal();
            toast.success('Request approved successfully');
        },
        onError: () => {
            toast.error('Failed to approve request');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, note }: { id: number; note: string }) => {
            await apiClient.approvalRequests.reject(id, note);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
            // Invalidate entity caches in case of rejection too
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            queryClient.invalidateQueries({ queryKey: ['registrations'] });
            queryClient.invalidateQueries({ queryKey: ['enrollments'] });
            handleCloseModal();
            toast.success('Request rejected');
        },
        onError: () => {
            toast.error('Failed to reject request');
        }
    });

    const handleAction = (request: any, type: 'APPROVE' | 'REJECT') => {
        setSelectedRequest(request);
        setActionType(type);
        setReviewNote('');
    };

    const handleSubmitReview = () => {
        if (!selectedRequest || !actionType) return;

        if (actionType === 'APPROVE') {
            approveMutation.mutate({ id: selectedRequest.id, note: reviewNote });
        } else {
            rejectMutation.mutate({ id: selectedRequest.id, note: reviewNote });
        }
    };

    const handleCloseModal = () => {
        setSelectedRequest(null);
        setActionType(null);
        setReviewNote('');
    };

    const pendingRequests = requests?.filter((r: any) => r.status === 'PENDING') || [];
    const historyRequests = requests?.filter((r: any) => r.status !== 'PENDING') || [];

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-slate-500">Loading requests...</div></div>;
    }

    return (
        <div className="space-y-4">

            <Tabs defaultValue="pending" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex h-9">
                        <TabsTrigger
                            value="pending"
                            className="px-4 text-xs font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all rounded-md relative flex items-center gap-2"
                        >
                            Pending
                            {pendingRequests.length > 0 && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="px-4 text-xs font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all rounded-md"
                        >
                            History
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="pending" className="mt-6">
                    {pendingRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <Check className="w-10 h-10 text-green-500 mb-3 bg-green-100 p-2 rounded-full" />
                            <h3 className="text-sm font-semibold text-slate-900">All Caught Up!</h3>
                            <p className="text-xs text-slate-500 mt-1">No pending requests.</p>
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-[100px]">Action</th>
                                        <th className="px-4 py-3 w-[200px]">Entity</th>
                                        <th className="px-4 py-3 w-[180px]">Requested By</th>
                                        <th className="px-4 py-3">Reason</th>
                                        <th className="px-4 py-3 w-[180px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingRequests.map((request: any) => (
                                        <RequestRow
                                            key={request.id}
                                            request={request}
                                            onApprove={() => handleAction(request, 'APPROVE')}
                                            onReject={() => handleAction(request, 'REJECT')}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    {historyRequests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm">No history available</div>
                    ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-[100px]">Status</th>
                                        <th className="px-4 py-3 w-[200px]">Entity</th>
                                        <th className="px-4 py-3 w-[180px]">Requested By</th>
                                        <th className="px-4 py-3">Reason</th>
                                        <th className="px-4 py-3 w-[140px] text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {historyRequests.map((request: any) => (
                                        <RequestRow key={request.id} request={request} isHistory />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Review Modal */}
            <Dialog.Root open={!!selectedRequest} onOpenChange={handleCloseModal}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-all duration-300" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-0 shadow-2xl focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {selectedRequest && (
                            <div className="flex flex-col max-h-[90vh]">
                                <div className={`p-5 text-white ${actionType === 'APPROVE' ? 'bg-teal-600' : 'bg-red-600'}`}>
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        {actionType === 'APPROVE' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                        {actionType === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
                                    </h2>
                                    <p className="text-white/80 text-xs mt-1">
                                        Please confirm your action below.
                                    </p>
                                </div>
                                <div className="p-5 overflow-y-auto">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={selectedRequest.action === 'DELETE' ? 'destructive' : 'default'} className="h-5 text-[10px] px-1.5">
                                                {selectedRequest.action}
                                            </Badge>
                                            <span className="text-xs font-bold text-slate-400 uppercase">{selectedRequest.entity_type}</span>
                                        </div>
                                        <p className="font-semibold text-slate-900 text-sm mb-2">{selectedRequest.entity_name}</p>
                                        <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                                            <span className="font-semibold text-slate-800">Reason:</span> {selectedRequest.message}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            Review Note (Optional)
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none min-h-[80px]"
                                            placeholder="Add comments for the requestor..."
                                            value={reviewNote}
                                            onChange={(e) => setReviewNote(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                    <Button variant="ghost" size="sm" onClick={handleCloseModal}>Cancel</Button>
                                    <Button
                                        size="sm"
                                        className={actionType === 'APPROVE' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-600 hover:bg-red-700'}
                                        onClick={handleSubmitReview}
                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                    >
                                        {approveMutation.isPending || rejectMutation.isPending ? 'Processing...' : 'Confirm'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}

function RequestRow({ request, onApprove, onReject, isHistory }: any) {
    const isDelete = request.action === 'DELETE';
    const statusColor = request.status === 'APPROVED' ? 'text-green-600 bg-green-50 border-green-200' :
        request.status === 'REJECTED' ? 'text-red-600 bg-red-50 border-red-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200';

    return (
        <tr className="hover:bg-slate-50/80 transition-colors group">
            <td className="px-4 py-3 align-top">
                {isHistory ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor}`}>
                        {request.status}
                    </span>
                ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isDelete ? 'text-red-700 bg-red-50 border-red-200' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>
                        {isDelete ? <Trash2 className="w-3 h-3 mr-1" /> : <FileEdit className="w-3 h-3 mr-1" />}
                        {request.action}
                    </span>
                )}
            </td>
            <td className="px-4 py-3 align-top">
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-sm">{request.entity_name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{request.entity_type}</span>
                </div>
            </td>
            <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold border border-slate-200">
                        {request.requested_by_name?.charAt(0) || <UserIcon size={10} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-700">{request.requested_by_name || 'System'}</span>
                        <span className="text-[10px] text-slate-400">{format(new Date(request.created_at), 'MMM d, HH:mm')}</span>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 align-top">
                <p className="text-sm text-slate-600 line-clamp-2 max-w-xs" title={request.message}>
                    {request.message}
                </p>
                {isHistory && request.review_note && (
                    <p className="text-xs text-slate-400 italic mt-1 border-l-2 border-slate-200 pl-2">
                        Note: {request.review_note}
                    </p>
                )}
            </td>
            {isHistory ? (
                <td className="px-4 py-3 align-top text-right text-xs text-slate-400 font-mono">
                    {format(new Date(request.created_at), 'yyyy-MM-dd')}
                </td>
            ) : (
                <td className="px-4 py-3 align-top text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="outline" className="h-7 w-7 border-red-200 text-red-600 hover:bg-red-50" onClick={onReject} title="Reject">
                            <X className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" className="h-7 w-7 bg-teal-600 hover:bg-teal-700 text-white" onClick={onApprove} title="Approve">
                            <Check className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </td>
            )}
        </tr>
    );
}
