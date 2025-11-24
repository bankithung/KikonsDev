'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, FileText, Calendar, Bell, Search, Filter } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface DocumentWithExpiry {
    id: string;
    fileName: string;
    type: string;
    studentName: string;
    expiryDate: string;
    status: 'Valid' | 'Expiring Soon' | 'Expired';
    daysUntilExpiry: number;
}

export function DocumentExpiry() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['documents-expiring'],
        queryFn: async () => {
            const data = await apiClient.documents.getExpiringSoon();
            return data as DocumentWithExpiry[];
        },
    });

    if (isLoading) return <div className="flex items-center justify-center p-8"><div className="animate-pulse text-slate-500">Loading documents...</div></div>;

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const expiredCount = documents.filter(d => d.status === 'Expired').length;
    const expiringSoonCount = documents.filter(d => d.status === 'Expiring Soon').length;
    const validCount = documents.filter(d => d.status === 'Valid').length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-slate-900">Document Expiry Tracking</h2>
                <p className="text-sm text-slate-600 mt-1">Monitor document validity and prevent last-minute issues</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 font-body">Expired</p>
                                <h3 className="text-3xl font-bold text-red-600 font-heading">{expiredCount}</h3>
                            </div>
                            <AlertTriangle className="h-10 w-10 text-red-600" />
                        </div>
                        <p className="text-xs text-red-600 mt-2 font-body font-semibold">Immediate action required</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 font-body">Expiring Soon</p>
                                <h3 className="text-3xl font-bold text-yellow-600 font-heading">{expiringSoonCount}</h3>
                            </div>
                            <Bell className="h-10 w-10 text-yellow-600" />
                        </div>
                        <p className="text-xs text-yellow-600 mt-2 font-body font-semibold">Within 90 days</p>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 font-body">Valid</p>
                                <h3 className="text-3xl font-bold text-green-600 font-heading">{validCount}</h3>
                            </div>
                            <FileText className="h-10 w-10 text-green-600" />
                        </div>
                        <p className="text-xs text-green-600 mt-2 font-body font-semibold">No action needed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-slate-200 bg-slate-50">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search by student or file..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-white" />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Expired">Expired</SelectItem>
                                <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                                <SelectItem value="Valid">Valid</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="h-10" onClick={() => { setFilterStatus('all'); setSearchTerm(''); }}>
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Table */}
            <Card className="border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Document</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden md:table-cell">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Expiry Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden lg:table-cell">Days Left</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredDocs.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-teal-500" />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 font-body">{doc.type}</p>
                                                <p className="text-xs text-slate-500 font-body truncate max-w-[200px]">{doc.fileName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-700 font-body hidden md:table-cell">{doc.studentName}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-900 font-body">{format(new Date(doc.expiryDate), 'dd MMM yyyy')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 hidden lg:table-cell">
                                        <span className={`text-sm font-semibold font-body ${doc.daysUntilExpiry < 0 ? 'text-red-600' :
                                            doc.daysUntilExpiry < 90 ? 'text-yellow-600' :
                                                'text-green-600'
                                            }`}>
                                            {doc.daysUntilExpiry < 0 ? `${Math.abs(doc.daysUntilExpiry)} days ago` : `${doc.daysUntilExpiry} days`}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${doc.status === 'Expired' ? 'bg-red-100 text-red-700' :
                                            doc.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        {doc.status !== 'Valid' && (
                                            <Button size="sm" variant="outline" className="h-8 text-xs font-body">
                                                <Bell size={12} className="mr-1" /> Notify
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
