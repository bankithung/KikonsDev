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

    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 7;

    // Convert transfers to events
    const allEvents = transfers?.map((t: any) => ({
        id: t.id,
        date: new Date(t.created_at),
        title: `Document Transfer: ${t.status}`,
        desc: `${t.sender_name} → ${t.receiver_name} (${t.documents.length} documents)`,
        status: t.status,
        type: t.status === 'Accepted' ? 'accepted' : t.status === 'Rejected' ? 'rejected' : 'pending',
    })) || [];

    const sortedEvents = [...allEvents].sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
    const filteredEvents = filterType === 'all' ? sortedEvents : sortedEvents.filter((e: any) => e.type === filterType);

    const paginatedEvents = filteredEvents.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE) || 1;
    const hasNext = (currentPage + 1) * PAGE_SIZE < filteredEvents.length;
    const hasPrev = currentPage > 0;

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
        <div className="max-w-5xl space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6 pl-3">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
                            <Clock size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Activity Timeline</span>
                    </div>

                    <div className="hidden md:flex items-center gap-1 border-l border-slate-100 pl-6">
                        <button
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={!hasPrev}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                        >
                            <ArrowRight size={14} className="rotate-180" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-500 px-2 min-w-[3rem] text-center">
                            {currentPage + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={!hasNext}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="w-full sm:w-80 flex items-center gap-2 pr-1">
                    <Select value={filterType} onValueChange={(val) => { setFilterType(val); setCurrentPage(0); }}>
                        <SelectTrigger className="h-10 border-none bg-slate-50/50 rounded-lg focus:ring-0 shadow-none text-xs font-bold uppercase tracking-wider text-slate-500 w-full">
                            <div className="flex items-center gap-2">
                                <span className="opacity-50">Filter:</span>
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="all">Everywhere</SelectItem>
                            <SelectItem value="pending">Pending Only</SelectItem>
                            <SelectItem value="accepted">Accepted Only</SelectItem>
                            <SelectItem value="rejected">Rejected Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="relative">
                {paginatedEvents.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-sm border-dashed">
                        <div className="h-16 w-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-slate-900 font-bold mb-1 uppercase tracking-widest text-sm">No Events Tracked</h3>
                        <p className="text-slate-400 text-sm">Activities will appear once transfers are initiated.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {paginatedEvents.map((event: any, idx: number) => (
                            <div key={event.id} className="relative group">
                                {/* Connector Line */}
                                {idx !== paginatedEvents.length - 1 && (
                                    <div className="absolute left-[26px] top-12 bottom-0 w-[2px] bg-slate-100 group-last:hidden" />
                                )}

                                <div className="flex items-start gap-6">
                                    <div className={`mt-1 h-[54px] w-[54px] rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-all ${event.type === 'accepted' ? 'bg-teal-50 border-teal-100 text-teal-600' :
                                        event.type === 'rejected' ? 'bg-red-50 border-red-100 text-red-600' :
                                            'bg-amber-50 border-amber-100 text-amber-600'
                                        }`}>
                                        {getIcon(event.type)}
                                    </div>

                                    <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-teal-100 hover:shadow-md transition-all">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{event.title}</h3>
                                                <div className={`h-1.5 w-1.5 rounded-full ${event.type === 'accepted' ? 'bg-teal-500' :
                                                    event.type === 'rejected' ? 'bg-red-500' :
                                                        'bg-amber-500'
                                                    }`} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                                {format(event.date, 'MMM dd, yyyy • HH:mm')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{event.desc}</p>
                                        </div>

                                        {event.status === 'Accepted' && (
                                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                                                <div className="h-6 px-2 bg-teal-50 text-teal-700 rounded-md flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                                    <CheckCircle size={12} />
                                                    Verified Transfer
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Mobile Pagination Buttons */}
                        <div className="flex md:hidden items-center justify-center gap-4 pt-4">
                            <button
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={!hasPrev}
                                className="h-10 px-4 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 bg-white shadow-sm disabled:opacity-30 transition-all text-xs font-bold uppercase tracking-wider"
                            >
                                <ArrowRight size={14} className="rotate-180 mr-2" />
                                Prev
                            </button>
                            <span className="text-xs font-bold text-slate-500">
                                {currentPage + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={!hasNext}
                                className="h-10 px-4 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 bg-white shadow-sm disabled:opacity-30 transition-all text-xs font-bold uppercase tracking-wider"
                            >
                                Next
                                <ArrowRight size={14} className="ml-2" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
