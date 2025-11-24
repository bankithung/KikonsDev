'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Send, CheckCircle, Clock, Package, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentTransferPage() {
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [receiver, setReceiver] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingTransfers, setPendingTransfers] = useState<any[]>([
        { id: 1, receiver: 'Mike Chen', sender: 'You', docCount: 3, status: 'Pending', date: new Date() }
    ]);

    const { data: documents } = useQuery({
        queryKey: ['documents-transfer'],
        queryFn: apiClient.documents.list,
    });

    const availableDocs = documents?.filter(d => d.status === 'IN' &&
        (searchTerm === '' || d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.studentName?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const handleSend = () => {
        if (selectedDocs.length === 0 || !receiver) return;

        const newTransfer = {
            id: Date.now(),
            receiver,
            sender: 'You',
            docCount: selectedDocs.length,
            status: 'Pending',
            date: new Date(),
        };

        setPendingTransfers([newTransfer, ...pendingTransfers]);
        setSelectedDocs([]);
        setReceiver('');
        alert('Transfer Initiated Successfully!');
    };

    const handleReceive = (id: number) => {
        setPendingTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'Received' } : t));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Document Transfer</h1>
                <p className="text-sm text-slate-600 mt-1 font-body">Transfer documents between team members</p>
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
                                        <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                                        <SelectItem value="Mike Chen">Mike Chen</SelectItem>
                                        <SelectItem value="Emily Davis">Emily Davis</SelectItem>
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

                            <Button className="w-full h-11 bg-teal-600 hover:bg-teal-700" onClick={handleSend} disabled={selectedDocs.length === 0 || !receiver}>
                                <Send className="mr-2 h-4 w-4" /> Send Transfer
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Transfer History */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 font-heading">Transfer History</h2>
                    {pendingTransfers.length === 0 ? (
                        <Card className="border-slate-200">
                            <CardContent className="p-12 text-center">
                                <Clock size={40} className="mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-500 font-body">No recent transfers</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {pendingTransfers.map((t) => (
                                <Card key={t.id} className="border-slate-200 hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="font-semibold text-slate-900 font-heading">To: {t.receiver}</p>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {t.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 font-body">{t.docCount} Documents</p>
                                                <p className="text-xs text-slate-400 mt-1">{format(t.date, 'dd MMM yyyy, HH:mm')}</p>
                                            </div>
                                            {t.status === 'Pending' ? (
                                                <Button size="sm" variant="outline" onClick={() => handleReceive(t.id)} className="shrink-0">
                                                    Mark Received
                                                </Button>
                                            ) : (
                                                <CheckCircle size={20} className="text-green-600 shrink-0" />
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
