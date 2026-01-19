'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Send, CheckCircle, Clock, Package, Search, XCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { useAuthStore } from '@/store/authStore';

export function DocumentTransfer() {
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [receiver, setReceiver] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [messageModalOpen, setMessageModalOpen] = useState(false);

    // Fetch company users for receiver dropdown (backend already filters by company)
    const { data: companyUsers } = useQuery({
        queryKey: ['company-users'],
        queryFn: apiClient.getCompanyUsers,
    });

    const filteredUsers = companyUsers?.filter((u: any) => u.id !== currentUser?.id) || [];

    // Fetch documents
    const { data: documents } = useQuery({
        queryKey: ['documents-transfer'],
        queryFn: apiClient.documents.list,
    });

    // Fetch transfers
    const { data: transfers } = useQuery({
        queryKey: ['document-transfers'],
        queryFn: apiClient.documentTransfers.list,
    });

    const availableDocs = documents?.filter(d => d.status === 'IN' &&
        (searchTerm === '' || d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.studentName?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const createTransferMutation = useMutation({
        mutationFn: (data: any) => apiClient.documentTransfers.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            setSelectedDocs([]);
            setReceiver('');
            setMessage('');
            setMessageModalOpen(false);
            toast({ title: 'Success', description: 'Transfer initiated successfully', type: 'success' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to initiate transfer', type: 'error' });
        }
    });

    const acceptTransferMutation = useMutation({
        mutationFn: (id: string) => apiClient.documentTransfers.accept(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast({ title: 'Success', description: 'Transfer accepted', type: 'success' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to accept transfer', type: 'error' });
        }
    });

    const rejectTransferMutation = useMutation({
        mutationFn: (id: string) => apiClient.documentTransfers.reject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-transfers'] });
            toast({ title: 'Success', description: 'Transfer rejected', type: 'success' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to reject transfer', type: 'error' });
        }
    });

    const cancelTransferMutation = useMutation({
        mutationFn: (id: string) => apiClient.documentTransfers.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-transfers'] });
            toast({ title: 'Success', description: 'Transfer cancelled', type: 'success' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to cancel transfer', type: 'error' });
        }
    });

    const handleSend = () => {
        if (selectedDocs.length === 0 || !receiver) return;
        setMessageModalOpen(true);
    };

    const handleConfirmSend = () => {
        createTransferMutation.mutate({
            receiver: receiver,
            documents: selectedDocs,
            message: message
        });
    };

    // Pagination for history
    const [historyPage, setHistoryPage] = useState(0);
    const HISTORY_PAGE_SIZE = 8;

    const sortedTransfers = [...(transfers || [])].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const paginatedTransfers = sortedTransfers.slice(
        historyPage * HISTORY_PAGE_SIZE,
        (historyPage + 1) * HISTORY_PAGE_SIZE
    );

    const hasNextHistory = (historyPage + 1) * HISTORY_PAGE_SIZE < sortedTransfers.length;
    const hasPrevHistory = historyPage > 0;
    const totalPages = Math.ceil(sortedTransfers.length / HISTORY_PAGE_SIZE) || 1;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Create Transfer */}
                <Card className="border-slate-200">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4 text-teal-600" />
                            Create New Transfer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-600">Target Recipient</Label>
                            <Select onValueChange={setReceiver} value={receiver}>
                                <SelectTrigger className="h-9 text-sm border-slate-200">
                                    <SelectValue placeholder="Choose an employee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredUsers.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>
                                            {u.first_name} {u.last_name} ({u.username})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-slate-600">
                                    Available Documents ({selectedDocs.length} selected)
                                </Label>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by student or file name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 text-sm border-slate-200"
                                />
                            </div>
                            <div className="h-[400px] overflow-y-auto border border-slate-200 rounded-lg bg-slate-50/50 p-1 custom-scrollbar">
                                {availableDocs.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Package className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                                        <p className="text-xs text-slate-400">No documents available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {availableDocs.map(doc => (
                                            <div
                                                key={doc.id}
                                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${selectedDocs.includes(doc.id)
                                                    ? 'bg-teal-50 border border-teal-100'
                                                    : 'bg-transparent hover:bg-white border border-transparent'
                                                    }`}
                                                onClick={() => {
                                                    if (selectedDocs.includes(doc.id)) setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                                                    else setSelectedDocs([...selectedDocs, doc.id]);
                                                }}
                                            >
                                                <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedDocs.includes(doc.id)
                                                    ? 'bg-teal-600 border-teal-600 text-white'
                                                    : 'bg-white border-slate-300'
                                                    }`}>
                                                    {selectedDocs.includes(doc.id) && <CheckCircle className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-700 text-xs truncate">{doc.fileName}</p>
                                                    <p className="text-[10px] text-slate-400">{doc.studentName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full h-9 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm"
                            onClick={handleSend}
                            disabled={selectedDocs.length === 0 || !receiver || createTransferMutation.isPending}
                        >
                            {createTransferMutation.isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Sending...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Send size={14} />
                                    <span>Send Transfer</span>
                                </div>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Transfer History */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                {sortedTransfers.length}
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

                    {sortedTransfers.length === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg border-dashed">
                            <Clock size={32} className="text-slate-200 mb-2" />
                            <p className="text-slate-400 text-sm">No transfer history</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {paginatedTransfers.map((t: any) => (
                                <Card key={t.id} className="border-slate-200 hover:border-teal-100 transition-all">
                                    <CardContent className="p-3">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="font-medium text-slate-700">{t.sender_name}</span>
                                                        <ArrowRight size={10} className="text-slate-300" />
                                                        <span className="font-medium text-slate-700">{t.receiver_name}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400">
                                                        {t.documents_details?.map((d: any) => d.file_name).join(', ') || `${t.documents.length} files`} • {format(new Date(t.created_at), 'dd MMM, HH:mm')}
                                                    </p>
                                                    {t.message && (
                                                        <p className="text-[10px] text-slate-500 italic truncate max-w-[200px] mt-0.5">
                                                            "{t.message}"
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge className={`rounded px-1.5 py-0 text-[10px] font-medium border-none ${t.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                    t.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {t.status}
                                                </Badge>
                                            </div>

                                            {t.status === 'Pending' && currentUser?.id.toString() === t.receiver.toString() && (
                                                <div className="flex items-center gap-2 pt-1">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium h-7 text-xs"
                                                        onClick={() => acceptTransferMutation.mutate(t.id)}
                                                        disabled={acceptTransferMutation.isPending}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:bg-red-50 font-medium h-7 text-xs"
                                                        onClick={() => rejectTransferMutation.mutate(t.id)}
                                                        disabled={rejectTransferMutation.isPending}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {t.status === 'Pending' && (currentUser?.id.toString() === t.sender.toString() || (currentUser?.role && ['DEV_ADMIN', 'COMPANY_ADMIN'].includes(currentUser.role))) && (
                                                <div className="pt-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium h-7 text-xs"
                                                        onClick={() => cancelTransferMutation.mutate(t.id)}
                                                        disabled={cancelTransferMutation.isPending}
                                                    >
                                                        Cancel Request
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
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
                        <Button onClick={handleConfirmSend} disabled={createTransferMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
                            {createTransferMutation.isPending ? 'Sending...' : 'Send Transfer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

