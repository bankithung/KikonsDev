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

export function DocumentTransfer() {
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-slate-900">Document Transfer</h2>
                <p className="text-sm text-slate-600 mt-1">Transfer documents between team members</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Transfer */}
                <div className="space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
                            <CardTitle className="text-lg font-semibold font-heading flex items-center gap-2">
                                <Package className="h-5 w-5 text-teal-600" />
                                New Transfer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="font-body font-medium">Select Receiver</Label>
                                <Select onValueChange={setReceiver} value={receiver}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choose employee..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users?.map((u: any) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {u.first_name} {u.last_name} ({u.username})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-body font-medium">Select Documents ({selectedDocs.length} selected)</Label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input placeholder="Search documents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10" />
                                </div>
                                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg bg-white custom-scrollbar">
                                    {availableDocs.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-8">No 'IN' documents available</p>
                                    ) : (
                                        <div className="p-2 space-y-1">
                                            {availableDocs.map(doc => (
                                                <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${selectedDocs.includes(doc.id) ? 'bg-teal-50 border border-teal-200' : ''}`}>
                                                    <Checkbox
                                                        checked={selectedDocs.includes(doc.id)}
                                                        onCheckedChange={(checked: boolean) => {
                                                            if (checked) setSelectedDocs([...selectedDocs, doc.id]);
                                                            else setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                                                        }}
                                                    />
                                                    <div className="text-sm flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate">{doc.fileName}</p>
                                                        <p className="text-xs text-slate-500">{doc.studentName}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full h-11 bg-teal-600 hover:bg-teal-700"
                                onClick={handleSend}
                                disabled={selectedDocs.length === 0 || !receiver || createTransferMutation.isPending}
                            >
                                {createTransferMutation.isPending ? 'Sending...' : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" /> Send Transfer
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Transfer History */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 font-heading">Transfer History</h2>
                    {!transfers || transfers.length === 0 ? (
                        <Card className="border-slate-200">
                            <CardContent className="p-12 text-center">
                                <Clock size={40} className="mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-500 font-body">No recent transfers</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {transfers.map((t: any) => (
                                <Card key={t.id} className="border-slate-200 hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span className="font-semibold text-slate-900">{t.sender_name}</span>
                                                        <ArrowRight size={14} className="text-slate-400" />
                                                        <span className="font-semibold text-slate-900">{t.receiver_name}</span>
                                                        <Badge variant={t.status === 'Pending' ? 'outline' : 'secondary'} className={
                                                            t.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                t.status === 'Accepted' ? 'bg-green-50 text-green-700' :
                                                                    'bg-red-50 text-red-700'
                                                        }>
                                                            {t.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-600 font-body">{t.documents.length} Documents</p>
                                                    <p className="text-xs text-slate-400 mt-1">{format(new Date(t.created_at), 'dd MMM yyyy, HH:mm')}</p>
                                                    {t.accepted_at && (
                                                        <p className="text-xs text-slate-400">Accepted: {format(new Date(t.accepted_at), 'dd MMM yyyy, HH:mm')}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {t.status === 'Pending' && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => acceptTransferMutation.mutate(t.id)}
                                                        disabled={acceptTransferMutation.isPending}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50 border-red-200"
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
