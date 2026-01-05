'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { FileText, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';

export function DocumentTracking() {
    const [filterType, setFilterType] = useState('all');

    // Fetch transfers to show as tracking events
    const { data: transfers, isLoading } = useQuery({
        queryKey: ['document-transfers'],
        queryFn: apiClient.documentTransfers.list,
    });

    if (isLoading) {
        return (
            <div className="max-w-4xl space-y-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-pulse text-slate-500">Loading tracking data...</div>
                </div>
            </div>
        );
    }

    // Convert transfers to events
    const events = transfers?.map((t: any) => ({
        id: t.id,
        date: new Date(t.created_at),
        title: `Document Transfer: ${t.status}`,
        desc: `${t.sender_name} → ${t.receiver_name} (${t.documents.length} documents)`,
        status: t.status,
        type: t.status === 'Accepted' ? 'accepted' : t.status === 'Rejected' ? 'rejected' : 'pending',
    })) || [];

    const filteredEvents = filterType === 'all' ? events : events.filter((e: any) => e.type === filterType);

    const getIcon = (type: string) => {
        switch (type) {
            case 'accepted': return <CheckCircle size={16} className="text-green-600" />;
            case 'rejected': return <XCircle size={16} className="text-red-600" />;
            case 'pending': return <Clock size={16} className="text-yellow-600" />;
            default: return <FileText size={16} className="text-blue-600" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'accepted': return 'bg-green-600';
            case 'rejected': return 'bg-red-600';
            case 'pending': return 'bg-yellow-600';
            default: return 'bg-blue-600';
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Document Tracking</h2>
                    <p className="text-sm text-slate-600 mt-1">Track document history and transfers</p>
                </div>
                <div className="w-full sm:w-64">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-10 bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Activities</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-slate-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-slate-100">
                    <CardTitle className="text-lg font-semibold font-heading">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock size={40} className="mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-500 font-body">No tracking events found</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
                            {filteredEvents.map((event: any) => (
                                <div key={event.id} className="relative pl-8">
                                    <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-4 ring-white ${getColor(event.type)}`}></span>
                                    <div className="pb-8 border-b border-slate-100 last:border-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getIcon(event.type)}
                                                    <h3 className="text-base font-bold text-slate-900 font-heading">{event.title}</h3>
                                                </div>
                                                <p className="text-sm text-slate-600 font-body mt-1">{event.desc}</p>
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                {format(event.date, 'dd MMM yyyy, HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
