'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { FileText, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, FolderOpen, RotateCcw, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

export function DocumentTracking() {
    const [filterType, setFilterType] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 12;
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();

    // Fetch digital transfers
    const { data: transfers, isLoading: loadingTransfers } = useQuery({
        queryKey: ['document-transfers'],
        queryFn: apiClient.documentTransfers.list,
    });

    // Fetch physical transfers
    const { data: physicalTransfers, isLoading: loadingPhysicalTransfers } = useQuery({
        queryKey: ['physical-transfers'],
        queryFn: apiClient.physicalTransfers.list,
    });

    // Fetch physical documents (for return history)
    const { data: physicalDocs, isLoading: loadingPhysicalDocs } = useQuery({
        queryKey: ['student-documents-all'],
        queryFn: () => apiClient.studentDocuments.list(),
    });

    // Fetch registrations for student names
    const { data: registrations } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    const regMap = registrations?.reduce((acc: Record<string, string>, reg) => {
        acc[reg.id] = reg.studentName;
        return acc;
    }, {}) || {};

    const isLoading = loadingTransfers || loadingPhysicalDocs || loadingPhysicalTransfers;



    // Mutations
    const cancelDigitalMutation = useMutation({
        mutationFn: (id: string) => apiClient.documentTransfers.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-transfers'] });
            toast.success('Transfer cancelled');
        }
    });

    const cancelPhysicalMutation = useMutation({
        mutationFn: (id: string) => apiClient.physicalTransfers.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['physical-transfers'] });
            toast.success('Transfer cancelled');
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-slate-500 text-sm">Loading tracking data...</div>
            </div>
        );
    }

    const handleCancel = (event: any) => {
        if (event.category === 'digital') {
            cancelDigitalMutation.mutate(event.originalId);
        } else if (event.category === 'physical-transfer') {
            cancelPhysicalMutation.mutate(event.originalId);
        }
    };

    // Convert digital transfers to events
    const digitalEvents = transfers?.map((t: any) => ({
        id: `transfer-${t.id}`,
        date: new Date(t.created_at),
        title: `Digital Transfer: ${t.status}`,
        desc: `${t.sender_name} → ${t.receiver_name} (${t.documents.length} file${t.documents.length > 1 ? 's' : ''})`,
        status: t.status,
        category: 'digital',
        type: t.status === 'Accepted' ? 'accepted' : t.status === 'Rejected' ? 'rejected' : t.status === 'Cancelled' ? 'cancelled' : 'pending',
        message: t.message,
        sender: t.sender,
        originalId: t.id,
    })) || [];

    // Convert physical transfers to events
    const physicalTransferEvents = physicalTransfers?.map((t: any) => ({
        id: `phy-transfer-${t.id}`,
        date: new Date(t.created_at),
        title: `Phy Transfer: ${t.status}`,
        desc: `${t.sender_name} → ${t.receiver_name} (${t.documents.length} doc${t.documents.length > 1 ? 's' : ''})`,
        status: t.status,
        category: 'physical-transfer',
        type: t.status === 'Accepted' ? 'accepted' : t.status === 'Rejected' ? 'rejected' : t.status === 'Cancelled' ? 'cancelled' : 'pending',
        message: t.message,
        sender: t.sender,
        originalId: t.id,
    })) || [];

    // Convert physical document returns to events
    const physicalEvents = physicalDocs?.filter(d => d.status === 'Returned' && d.returnedAt).map((d: any) => ({
        id: `physical-${d.id}`,
        date: new Date(d.returnedAt),
        title: 'Physical Doc Returned',
        desc: `${d.name} returned to ${regMap[d.registration] || 'student'}`,
        status: 'Returned',
        category: 'physical',
        type: 'returned',
    })) || [];

    // Combine and sort all events
    const allEvents = [...digitalEvents, ...physicalTransferEvents, ...physicalEvents];
    const sortedEvents = [...allEvents].sort((a, b) => b.date.getTime() - a.date.getTime());

    // Filter events
    const filteredEvents = filterType === 'all'
        ? sortedEvents
        : filterType === 'digital'
            ? sortedEvents.filter(e => e.category === 'digital')
            : filterType === 'physical'
                ? sortedEvents.filter(e => e.category === 'physical' || e.category === 'physical-transfer')
                : sortedEvents.filter(e => e.type === filterType);

    const paginatedEvents = filteredEvents.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE) || 1;
    const hasNext = (currentPage + 1) * PAGE_SIZE < filteredEvents.length;
    const hasPrev = currentPage > 0;

    const getIcon = (event: any) => {
        if (event.category === 'physical') {
            return <RotateCcw size={14} className="text-green-600" />;
        }
        switch (event.type) {
            case 'accepted': return <CheckCircle size={14} className="text-green-600" />;
            case 'rejected': return <XCircle size={14} className="text-red-600" />;
            case 'pending': return <Clock size={14} className="text-amber-600" />;
            default: return <Send size={14} className="text-blue-600" />;
        }
    };

    const getIconBg = (event: any) => {
        if (event.category === 'physical') {
            return 'bg-green-50 text-green-600';
        }
        switch (event.type) {
            case 'accepted': return 'bg-green-50 text-green-600';
            case 'rejected': return 'bg-red-50 text-red-600';
            case 'pending': return 'bg-amber-50 text-amber-600';
            default: return 'bg-blue-50 text-blue-600';
        }
    };

    return (
        <div className="space-y-3">
            {/* Header Bar */}
            <div className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-2">
                <div className="flex items-center gap-3 pl-2">
                    <div className="h-7 w-7 bg-teal-50 text-teal-600 rounded flex items-center justify-center">
                        <Clock size={14} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Activity Timeline</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                        {filteredEvents.length}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={filterType} onValueChange={(val) => { setFilterType(val); setCurrentPage(0); }}>
                        <SelectTrigger className="h-8 w-[150px] text-xs border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            <SelectItem value="digital">Digital Transfers</SelectItem>
                            <SelectItem value="physical">Physical Returns</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                        <button
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={!hasPrev}
                            className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs font-medium text-slate-500 min-w-[40px] text-center">
                            {currentPage + 1}/{totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={!hasNext}
                            className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            {paginatedEvents.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-12 text-center border-dashed">
                    <Clock size={32} className="text-slate-200 mx-auto mb-2" />
                    <h3 className="text-slate-700 font-semibold text-sm mb-1">No Events Tracked</h3>
                    <p className="text-slate-400 text-xs">Activities will appear once transfers or returns happen.</p>
                </div>
            ) : (
                <Card className="border-slate-200">
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {paginatedEvents.map((event: any) => {
                                // Extract ID from event.id (e.g. "transfer-123" -> "123")
                                const rawId = event.id.split('-').pop();
                                const type = event.category === 'physical-transfer' ? 'physical' : 'digital';
                                const isLinkable = event.category !== 'physical'; // Physical returns don't have a transfer page yet? Or maybe they do if we track returns as transfers? No, returns are simple doc updates.

                                return (
                                    <Link
                                        href={isLinkable ? `/app/documents/transfer/${type}/${rawId}` : '#'}
                                        key={event.id}
                                        className={`group block transition-colors ${isLinkable ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                                        onClick={(e) => !isLinkable && e.preventDefault()}
                                    >
                                        <div className="flex items-start gap-3 p-3">
                                            <div className={`mt-0.5 h-8 w-8 rounded flex items-center justify-center shrink-0 ${getIconBg(event)}`}>
                                                {getIcon(event)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-medium text-slate-700">{event.title}</h3>
                                                        <Badge className={`rounded px-1.5 py-0 text-[10px] font-medium border-none ${event.category === 'physical'
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : event.category === 'physical-transfer'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {event.category === 'physical' ? 'Return' : event.category === 'physical-transfer' ? 'Phy Transfer' : 'Digital'}
                                                        </Badge>
                                                        <Badge className={`rounded px-1.5 py-0 text-[10px] font-medium border-none ${event.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                                                            event.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                event.status === 'Cancelled' ? 'bg-slate-100 text-slate-700' :
                                                                    'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {event.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400 shrink-0 group-hover:hidden transition-all duration-200">
                                                            {format(event.date, 'dd MMM, HH:mm')}
                                                        </span>
                                                        {isLinkable && (
                                                            <div className="hidden group-hover:block transition-all duration-200">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 text-[10px] px-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                                                                >
                                                                    View Details
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{event.desc}</p>

                                                {event.message && (
                                                    <p className="text-[10px] text-slate-500 italic mt-1">"{event.message}"</p>
                                                )}

                                                {event.status === 'Accepted' && (
                                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                                                        <CheckCircle size={10} />
                                                        Verified
                                                    </div>
                                                )}

                                                {event.status === 'Pending' && (['digital', 'physical-transfer'].includes(event.category)) &&
                                                    (currentUser?.id?.toString() === event.sender?.toString() || (currentUser?.role && ['DEV_ADMIN', 'COMPANY_ADMIN'].includes(currentUser.role))) && (
                                                        <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                                                                onClick={() => handleCancel(event)}
                                                                disabled={cancelDigitalMutation.isPending || cancelPhysicalMutation.isPending}
                                                            >
                                                                Cancel Request
                                                            </Button>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


