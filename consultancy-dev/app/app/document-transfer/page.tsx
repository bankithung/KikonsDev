'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Send, CheckCircle, Clock, Package, Search, XCircle, ArrowRight, FileText, User as UserIcon, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function DocumentTransferPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [receiverId, setReceiverId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Users (for receiver dropdown)
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: apiClient.users.list,
    });

    // Fetch Documents (only those held by current user)
    const { data: documents } = useQuery({
        queryKey: ['documents'],
        queryFn: apiClient.documents.list,
    });

    // Fetch Transfers
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
            setReceiverId('');
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
        }
    });

    const rejectTransferMutation = useMutation({
        mutationFn: (id: string) => apiClient.documentTransfers.reject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-transfers'] });
            toast({ title: 'Success', description: 'Transfer rejected', type: 'success' });
        }
    });

    const handleSend = () => {
        if (selectedDocs.length === 0 || !receiverId) return;
        createTransferMutation.mutate({
            receiver: receiverId,
            documents: selectedDocs
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Document Transfer</h1>
                <p className="text-sm text-slate-600 mt-1 font-body">Track and manage document movements</p>
            </div>

            <Tabs defaultValue="new" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="new">New Transfer</TabsTrigger>
                    <TabsTrigger value="history">Transfer History</TabsTrigger>
                </TabsList>

                <TabsContent value="new">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-slate-200">
                            <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
                                <CardTitle className="text-lg font-semibold font-heading flex items-center gap-2">
                                    <Package className="h-5 w-5 text-teal-600" />
                                    Select Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="font-body font-medium">Receiver</Label>
                                    <Select onValueChange={setReceiverId} value={receiverId}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select team member..." />
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
                                    <Label className="font-body font-medium">Documents to Transfer ({selectedDocs.length})</Label>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search available documents..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 h-10"
                                        />
                                    </div>
                                    <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg bg-white custom-scrollbar">
                                        {availableDocs.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500">
                                                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                <p>No available documents found</p>
                                            </div>
                                        ) : (
                                            <div className="p-2 space-y-1">
                                                {availableDocs.map(doc => (
                                                    <div
                                                        key={doc.id}
                                                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${selectedDocs.includes(doc.id) ? 'bg-teal-50 border border-teal-200' : 'border border-transparent'}`}
                                                        onClick={() => {
                                                            if (selectedDocs.includes(doc.id)) {
                                                                setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                                                            } else {
                                                                setSelectedDocs([...selectedDocs, doc.id]);
                                                            }
                                                        }}
                                                    >
                                                        <Checkbox
                                                            checked={selectedDocs.includes(doc.id)}
                                                            onCheckedChange={() => { }} // Handled by parent div click
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-slate-900 truncate">{doc.fileName}</p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <span>{doc.studentName || 'No Student'}</span>
                                                                <span>•</span>
                                                                <span>{doc.type}</span>
                                                            </div>
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
                                    disabled={selectedDocs.length === 0 || !receiverId || createTransferMutation.isPending}
                                >
                                    {createTransferMutation.isPending ? 'Sending...' : 'Initiate Transfer'}
                                    <Send className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Preview / Info Side */}
                        <div className="hidden lg:block space-y-6">
                            <Card className="bg-slate-50 border-slate-200 h-full">
                                <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full text-slate-500">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <ArrowRight className="h-8 w-8 text-teal-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Transfer Process</h3>
                                    <p className="max-w-xs mx-auto">
                                        Select a team member and the documents you wish to hand over.
                                        The receiver will be notified and must accept the transfer to complete the process.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle>Transfer History</CardTitle>
                            <CardDescription>Track incoming and outgoing document transfers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {transfers?.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <Clock className="mx-auto h-10 w-10 mb-3 opacity-50" />
                                        <p>No transfer history found</p>
                                    </div>
                                ) : (
                                    transfers?.map((t: any) => (
                                        <div key={t.id} className="flex flex-col gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className={`mt-1 p-2 rounded-full ${t.status === 'Accepted' ? 'bg-green-100 text-green-600' :
                                                        t.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                                            'bg-yellow-100 text-yellow-600'
                                                        }`}>
                                                        {t.status === 'Accepted' ? <CheckCircle size={20} /> :
                                                            t.status === 'Rejected' ? <XCircle size={20} /> :
                                                                <Clock size={20} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
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
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            {t.documents.length} document(s) • {format(new Date(t.created_at), 'PPP p')}
                                                        </p>
                                                        {t.accepted_at && (
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                Accepted: {format(new Date(t.accepted_at), 'PPP p')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-teal-600">
                                                            <Eye size={16} className="mr-2" /> Details
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Transfer Details</DialogTitle>
                                                            <DialogDescription>
                                                                Transfer ID: {String(t.id).substring(0, 8)}...
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-slate-500 block">Sender</span>
                                                                    <span className="font-medium">{t.sender_name}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500 block">Receiver</span>
                                                                    <span className="font-medium">{t.receiver_name}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500 block">Status</span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={
                                                                            t.status === 'Pending'
                                                                                ? 'text-yellow-600 border-yellow-200 bg-yellow-50'
                                                                                : t.status === 'Accepted'
                                                                                    ? 'text-green-600 border-green-200 bg-green-50'
                                                                                    : 'text-red-600 border-red-200 bg-red-50'
                                                                        }
                                                                    >
                                                                        {t.status}
                                                                    </Badge>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500 block">Date</span>
                                                                    <span className="font-medium">{format(new Date(t.created_at), 'PP p')}</span>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="font-medium mb-2 text-sm">Documents ({t.documents.length})</h4>
                                                                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                                                                    {t.documents_details?.map((doc: any) => (
                                                                        <div key={doc.id} className="p-2 text-sm flex items-center justify-between">
                                                                            <span className="truncate max-w-[200px]" title={doc.file_name}>{doc.file_name}</span>
                                                                            <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
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
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
