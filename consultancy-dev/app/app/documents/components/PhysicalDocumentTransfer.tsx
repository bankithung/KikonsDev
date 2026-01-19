'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Send, CheckCircle, Clock, FolderOpen, Search, RotateCcw, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';

export function PhysicalDocumentTransfer() {
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [receiver, setReceiver] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionType, setActionType] = useState<'transfer' | 'return'>('transfer');
    const [message, setMessage] = useState('');
    const [messageModalOpen, setMessageModalOpen] = useState(false);

    // Fetch company users for receiver dropdown (backend already filters by company)
    const { data: companyUsers } = useQuery({
        queryKey: ['company-users-raw'],
        queryFn: apiClient.getCompanyUsers,
    });

    const filteredUsers = companyUsers?.filter((u: any) => u.id !== currentUser?.id) || [];

    // Fetch physical documents
    const { data: documents } = useQuery({
        queryKey: ['student-documents-all'],
        queryFn: () => apiClient.studentDocuments.list(),
    });

    // Fetch registrations for student names
    const { data: registrations } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    // Fetch physical transfers for activity feed
    const { data: physicalTransfers } = useQuery({
        queryKey: ['physical-transfers'],
        queryFn: apiClient.physicalTransfers.list,
    });

    const regMap = registrations?.reduce((acc: Record<number, string>, reg) => {
        acc[parseInt(reg.id)] = reg.studentName;
        return acc;
    }, {}) || {};

    const availableDocs = documents?.filter(d => d.status === 'Held' &&
        (searchTerm === '' || d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            regMap[d.registration]?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const returnDocsMutation = useMutation({
        mutationFn: (docIds: string[]) => apiClient.studentDocuments.returnDocs(docIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-documents-all'] });
            setSelectedDocs([]);
            toast.success('Documents returned to student successfully');
        },
        onError: () => {
            toast.error('Failed to return documents');
        }
    });

    const createTransferMutation = useMutation({
        mutationFn: (data: any) => apiClient.physicalTransfers.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['physical-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['student-documents-all'] });
            setSelectedDocs([]);
            setReceiver('');
            setMessage('');
            setMessageModalOpen(false);
            toast.success('Transfer initiated successfully');
        },
        onError: () => {
            toast.error('Failed to initiate transfer');
        }
    });

    const cancelTransferMutation = useMutation({
        mutationFn: (id: string) => apiClient.physicalTransfers.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['physical-transfers'] });
            toast.success('Transfer cancelled successfully');
        },
        onError: () => {
            toast.error('Failed to cancel transfer');
        }
    });

    // Status Update Mutation (for sender)
    const updateStatusMutation = useMutation({
        mutationFn: (data: { id: string; status: string; note?: string }) =>
            apiClient.physicalTransfers.updateStatus(data.id, { status: data.status, note: data.note }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['physical-transfers'] });
            toast.success('Status updated successfully');
            setStatusModalOpen(false);
            setSelectedTransfer(null);
            setStatusNote('');
        },
        onError: () => {
            toast.error('Failed to update status');
        }
    });

    // Confirm Receipt Mutation (for receiver)
    const confirmReceiptMutation = useMutation({
        mutationFn: (data: { id: string; message: string }) =>
            apiClient.physicalTransfers.confirmReceipt(data.id, data.message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['physical-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['student-documents-all'] });
            toast.success('Receipt confirmed successfully');
            setConfirmModalOpen(false);
            setSelectedTransfer(null);
            setConfirmMessage('');
        },
        onError: () => {
            toast.error('Failed to confirm receipt');
        }
    });

    // State for modals
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const handleAction = () => {
        if (selectedDocs.length === 0) return;

        if (actionType === 'return') {
            returnDocsMutation.mutate(selectedDocs);
        } else {
            // For transfer between employees
            setMessageModalOpen(true);
        }
    };

    const handleConfirmTransfer = () => {
        createTransferMutation.mutate({
            receiver: receiver,
            documents: selectedDocs,
            message: message
        });
    };

    // Pagination for recent activity
    const [historyPage, setHistoryPage] = useState(0);
    const HISTORY_PAGE_SIZE = 8;

    // Combine physical returns and digital transfers for activity feed
    const physicalReturns = documents?.filter(d => d.status === 'Returned').map(d => ({
        id: `physical-${d.id}`,
        type: 'return' as const,
        name: d.name,
        student: regMap[d.registration] || 'Unknown',
        date: d.returnedAt ? new Date(d.returnedAt) : new Date(),
        status: 'Returned'
    })) || [];

    const transferActivity = physicalTransfers?.map((t: any) => ({
        id: `transfer-${t.id}`,
        originalId: t.id,
        type: 'transfer' as const,
        name: t.documents_details?.map((d: any) => d.name).join(', ') || `${t.documents.length} document(s)`,
        student: `${t.sender_name} → ${t.receiver_name}`,
        date: new Date(t.created_at),
        status: t.status,
        sender: t.sender,
        receiver: t.receiver,
        message: t.message
    })) || [];

    const allActivity = [...physicalReturns, ...transferActivity]
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    const paginatedActivity = allActivity.slice(
        historyPage * HISTORY_PAGE_SIZE,
        (historyPage + 1) * HISTORY_PAGE_SIZE
    );

    const hasNextHistory = (historyPage + 1) * HISTORY_PAGE_SIZE < allActivity.length;
    const hasPrevHistory = historyPage > 0;
    const totalPages = Math.ceil(allActivity.length / HISTORY_PAGE_SIZE) || 1;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Action Card */}
                <Card className="border-slate-200">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-orange-600" />
                            Physical Document Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {/* Action Type Toggle */}
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                            <button
                                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${actionType === 'transfer'
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                onClick={() => setActionType('transfer')}
                            >
                                <Send size={12} className="inline mr-1.5" />
                                Transfer to Employee
                            </button>
                            <button
                                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${actionType === 'return'
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                onClick={() => setActionType('return')}
                            >
                                <RotateCcw size={12} className="inline mr-1.5" />
                                Return to Student
                            </button>
                        </div>

                        {actionType === 'transfer' && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Transfer To</Label>
                                <Select onValueChange={setReceiver} value={receiver}>
                                    <SelectTrigger className="h-9 text-sm border-slate-200">
                                        <SelectValue placeholder="Select an employee..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-50">
                                        {filteredUsers.map((u: any) => {
                                            const displayName = (u.first_name || u.last_name)
                                                ? `${u.first_name || ''} ${u.last_name || ''} (${u.username})`
                                                : u.username;
                                            return (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-slate-400" />
                                                        {displayName}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-600">
                                Select Documents ({selectedDocs.length} selected)
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search documents..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 text-sm border-slate-200"
                                />
                            </div>
                            <div className="h-[400px] overflow-y-auto border border-slate-200 rounded-lg bg-slate-50/50 p-1 custom-scrollbar">
                                {availableDocs.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <FolderOpen className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                                        <p className="text-xs text-slate-400">No documents available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {availableDocs.map(doc => (
                                            <div
                                                key={doc.id}
                                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${selectedDocs.includes(doc.id)
                                                    ? 'bg-orange-50 border border-orange-100'
                                                    : 'bg-transparent hover:bg-white border border-transparent'
                                                    }`}
                                                onClick={() => {
                                                    if (selectedDocs.includes(doc.id)) setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                                                    else setSelectedDocs([...selectedDocs, doc.id]);
                                                }}
                                            >
                                                <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedDocs.includes(doc.id)
                                                    ? 'bg-orange-600 border-orange-600 text-white'
                                                    : 'bg-white border-slate-300'
                                                    }`}>
                                                    {selectedDocs.includes(doc.id) && <CheckCircle className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-700 text-xs truncate">{doc.name}</p>
                                                    <p className="text-[10px] text-slate-400">{regMap[doc.registration] || 'Unknown'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            className={`w-full h-9 text-white font-medium text-sm ${actionType === 'return'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                            onClick={handleAction}
                            disabled={selectedDocs.length === 0 || (actionType === 'transfer' && !receiver) || returnDocsMutation.isPending}
                        >
                            {returnDocsMutation.isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {actionType === 'return' ? <RotateCcw size={14} /> : <Send size={14} />}
                                    <span>{actionType === 'return' ? 'Return to Student' : 'Transfer Documents'}</span>
                                </div>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                {allActivity.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1 py-0.5">
                            <button
                                onClick={() => setHistoryPage(p => p - 1)}
                                disabled={!hasPrevHistory}
                                className="h-6 w-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-medium text-slate-500 px-1 min-w-[40px] text-center">
                                {historyPage + 1}/{totalPages}
                            </span>
                            <button
                                onClick={() => setHistoryPage(p => p + 1)}
                                disabled={!hasNextHistory}
                                className="h-6 w-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    {allActivity.length === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg border-dashed">
                            <Clock size={32} className="text-slate-200 mb-2" />
                            <p className="text-slate-400 text-sm">No activity history</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {paginatedActivity.map((item) => (
                                <Card key={item.id} className="border-slate-200 hover:border-slate-300 transition-all">
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded flex items-center justify-center ${item.type === 'return'
                                                    ? 'bg-green-50 text-green-600'
                                                    : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {item.type === 'return' ? <RotateCcw size={14} /> : <Send size={14} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-700 text-xs">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {item.student} • {format(item.date, 'dd MMM, HH:mm')}
                                                    </p>
                                                    {item.message && (
                                                        <p className="text-[10px] text-slate-500 italic truncate max-w-[200px] mt-0.5">
                                                            "{item.message}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge className={`border-none rounded px-1.5 py-0 text-[10px] font-medium ${item.type === 'return'
                                                ? 'bg-green-100 text-green-700'
                                                : item.status === 'Delivered'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : item.status === 'Accepted'
                                                        ? 'bg-green-100 text-green-700'
                                                        : item.status === 'Rejected'
                                                            ? 'bg-red-100 text-red-700'
                                                            : item.status === 'Cancelled'
                                                                ? 'bg-slate-100 text-slate-600'
                                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {item.type === 'return' ? 'Returned' : item.status === 'Delivered' ? 'Verified' : item.status}
                                            </Badge>
                                        </div>
                                        {/* Sender Actions - Update Status */}
                                        {item.type === 'transfer' &&
                                            !['Delivered', 'Rejected', 'Cancelled', 'Returned'].includes(item.status) &&
                                            currentUser?.id.toString() === item.sender.toString() && (
                                                <div className="pt-2 flex gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 font-medium h-7 text-xs"
                                                        onClick={() => {
                                                            setSelectedTransfer(item);
                                                            setStatusModalOpen(true);
                                                        }}
                                                    >
                                                        Update Status
                                                    </Button>
                                                    {item.status === 'Pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium h-7 text-xs px-2"
                                                            onClick={() => cancelTransferMutation.mutate(item.originalId)}
                                                            disabled={cancelTransferMutation.isPending}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                        {/* Receiver Actions - Confirm Receipt */}
                                        {item.type === 'transfer' &&
                                            !['Delivered', 'Rejected', 'Cancelled', 'Returned'].includes(item.status) &&
                                            currentUser?.id.toString() === item.receiver?.toString() && (
                                                <div className="pt-2">
                                                    <Button
                                                        size="sm"
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-7 text-xs"
                                                        onClick={() => {
                                                            setSelectedTransfer(item);
                                                            setConfirmModalOpen(true);
                                                        }}
                                                    >
                                                        Confirm Receipt
                                                    </Button>
                                                </div>
                                            )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            {/* Message Confirmation Modal */}
            <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Message</DialogTitle>
                        <DialogDescription>
                            Add an optional message for the recipient.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label className="mb-2 block text-xs">Message (Optional)</Label>
                        <Textarea
                            placeholder="Enter your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMessageModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmTransfer} disabled={createTransferMutation.isPending} className="bg-orange-600 hover:bg-orange-700">
                            {createTransferMutation.isPending ? 'Sending...' : 'Send Transfer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Update Modal (for Sender) */}
            <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Delivery Status</DialogTitle>
                        <DialogDescription>
                            Update the status of this document transfer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-4">
                        <div>
                            <Label className="mb-2 block text-xs">New Status</Label>
                            <Select onValueChange={setSelectedStatus} value={selectedStatus}>
                                <SelectTrigger className="h-9 text-sm border-slate-200">
                                    <SelectValue placeholder="Select status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dispatched">Dispatched</SelectItem>
                                    <SelectItem value="In Transit">In Transit</SelectItem>
                                    <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-2 block text-xs">Note (Optional)</Label>
                            <Textarea
                                placeholder="Add a note about this status update..."
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setStatusModalOpen(false);
                            setSelectedTransfer(null);
                            setSelectedStatus('');
                            setStatusNote('');
                        }}>Cancel</Button>
                        <Button
                            onClick={() => {
                                if (selectedTransfer && selectedStatus) {
                                    updateStatusMutation.mutate({
                                        id: selectedTransfer.originalId,
                                        status: selectedStatus,
                                        note: statusNote
                                    });
                                }
                            }}
                            disabled={!selectedStatus || updateStatusMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Receipt Modal (for Receiver) */}
            <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Receipt</DialogTitle>
                        <DialogDescription>
                            Confirm that you have received the physical documents.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label className="mb-2 block text-xs">Confirmation Message (Optional)</Label>
                        <Textarea
                            placeholder="Add any notes about the received documents..."
                            value={confirmMessage}
                            onChange={(e) => setConfirmMessage(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setConfirmModalOpen(false);
                            setSelectedTransfer(null);
                            setConfirmMessage('');
                        }}>Cancel</Button>
                        <Button
                            onClick={() => {
                                if (selectedTransfer) {
                                    confirmReceiptMutation.mutate({
                                        id: selectedTransfer.originalId,
                                        message: confirmMessage
                                    });
                                }
                            }}
                            disabled={confirmReceiptMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {confirmReceiptMutation.isPending ? 'Confirming...' : 'Confirm Receipt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

