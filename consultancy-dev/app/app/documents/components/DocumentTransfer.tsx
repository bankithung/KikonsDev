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
import { Send, CheckCircle, Clock, Package, Search, XCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

import { useAuthStore } from '@/store/authStore';

export function DocumentTransfer() {
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [receiver, setReceiver] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch users for receiver dropdown
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: apiClient.users.list,
    });

    const filteredUsers = users?.filter((u: any) => u.id !== currentUser?.id) || [];

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

    const handleSend = () => {
        if (selectedDocs.length === 0 || !receiver) return;
        createTransferMutation.mutate({
            receiver: receiver,
            documents: selectedDocs
        });
    };

    // Pagination for history
    const [historyPage, setHistoryPage] = useState(0);
    const HISTORY_PAGE_SIZE = 7;

    const sortedTransfers = [...(transfers || [])].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const paginatedTransfers = sortedTransfers.slice(
        historyPage * HISTORY_PAGE_SIZE,
        (historyPage + 1) * HISTORY_PAGE_SIZE
    );

    const hasNextHistory = (historyPage + 1) * HISTORY_PAGE_SIZE < sortedTransfers.length;
    const hasPrevHistory = historyPage > 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Create Transfer */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-4 w-4 text-teal-600" />
                                Create New Transfer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Recipient</Label>
                                <Select onValueChange={setReceiver} value={receiver}>
                                    <SelectTrigger className="h-11 border-slate-200 rounded-xl bg-slate-50/30 focus:ring-teal-500/20">
                                        <SelectValue placeholder="Choose an employee..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        {filteredUsers.map((u: any) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {u.first_name} {u.last_name} ({u.username})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Documents ({selectedDocs.length} selected)</Label>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by student or file name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-10 border-slate-200 rounded-xl bg-slate-50/30 focus-visible:ring-teal-500/20"
                                    />
                                </div>
                                <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/30 custom-scrollbar p-1">
                                    {availableDocs.length === 0 ? (
                                        <div className="py-12 text-center space-y-2">
                                            <Package className="h-8 w-8 text-slate-200 mx-auto" />
                                            <p className="text-sm text-slate-400 font-medium">No documents available to transfer</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {availableDocs.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    className={`group flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer border ${selectedDocs.includes(doc.id)
                                                        ? 'bg-teal-50 border-teal-100 shadow-sm'
                                                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'
                                                        }`}
                                                    onClick={() => {
                                                        if (selectedDocs.includes(doc.id)) setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                                                        else setSelectedDocs([...selectedDocs, doc.id]);
                                                    }}
                                                >
                                                    <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedDocs.includes(doc.id)
                                                        ? 'bg-teal-600 border-teal-600 text-white'
                                                        : 'bg-white border-slate-300 group-hover:border-teal-400'
                                                        }`}>
                                                        {selectedDocs.includes(doc.id) && <CheckCircle className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-700 text-xs truncate uppercase tracking-tight">{doc.fileName}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{doc.studentName}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-100 transition-all disabled:opacity-50"
                                onClick={handleSend}
                                disabled={selectedDocs.length === 0 || !receiver || createTransferMutation.isPending}
                            >
                                {createTransferMutation.isPending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Initiating Transfer...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Send size={18} />
                                        <span>Send Transfer Request</span>
                                    </div>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Transfer History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pl-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h2>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {sortedTransfers.length} Transfers
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setHistoryPage(p => p - 1)}
                                disabled={!hasPrevHistory}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ArrowRight size={14} className="rotate-180" />
                            </button>
                            <span className="text-[10px] font-bold text-slate-500 px-2 min-w-[3rem] text-center">
                                {historyPage + 1} / {Math.ceil(sortedTransfers.length / HISTORY_PAGE_SIZE) || 1}
                            </span>
                            <button
                                onClick={() => setHistoryPage(p => p + 1)}
                                disabled={!hasNextHistory}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {sortedTransfers.length === 0 ? (
                        <div className="h-[400px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-xl border-dashed">
                            <Clock size={40} className="text-slate-100 mb-3" />
                            <p className="text-slate-400 font-medium text-sm">No transfer history found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paginatedTransfers.map((t: any) => (
                                <Card key={t.id} className="border-slate-100 hover:border-teal-100 hover:shadow-sm transition-all rounded-xl overflow-hidden group">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-slate-800 text-xs uppercase">{t.sender_name}</span>
                                                        <ArrowRight size={12} className="text-slate-300" />
                                                        <span className="font-bold text-slate-800 text-xs uppercase">{t.receiver_name}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {t.documents.length} Files • {format(new Date(t.created_at), 'MMM dd, HH:mm')}
                                                    </p>
                                                </div>
                                                <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border-none ${t.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                    t.status === 'Accepted' ? 'bg-teal-100 text-teal-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {t.status}
                                                </Badge>
                                            </div>

                                            {t.status === 'Pending' && currentUser?.id.toString() === t.receiver.toString() && (
                                                <div className="flex items-center gap-2 pt-1">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold h-9 rounded-lg transition-colors"
                                                        onClick={() => acceptTransferMutation.mutate(t.id)}
                                                        disabled={acceptTransferMutation.isPending}
                                                    >
                                                        Accept Request
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:bg-red-50 font-bold h-9 rounded-lg"
                                                        onClick={() => rejectTransferMutation.mutate(t.id)}
                                                        disabled={rejectTransferMutation.isPending}
                                                    >
                                                        Reject
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
        </div>
    );
}
