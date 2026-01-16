'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, FileText, CheckCircle, XCircle, Clock, Send, Truck, MapPin, Package, Calendar, AlertCircle, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function TransferDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const type = params.type as string; // 'digital' or 'physical'
    const id = params.id as string;

    const isPhysical = type === 'physical';
    const queryKey = isPhysical ? ['physical-transfers', id] : ['document-transfers', id];
    const fetchFn = () => isPhysical
        ? apiClient.physicalTransfers.get(id)
        : apiClient.documentTransfers.get(id);

    const { data: transfer, isLoading, error } = useQuery({
        queryKey,
        queryFn: fetchFn,
        retry: 1
    });

    const actionMutation = useMutation({
        mutationFn: (action: 'accept' | 'reject' | 'cancel') => {
            const api = isPhysical ? apiClient.physicalTransfers : apiClient.documentTransfers;
            return api[action](id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Action completed successfully');
        },
        onError: () => toast.error('Action failed')
    });

    if (isLoading) return <div className="h-[50vh] flex items-center justify-center text-slate-400 text-sm">Loading details...</div>;
    if (error || !transfer) return <div className="h-[50vh] flex items-center justify-center text-red-500 text-sm">Transfer not found</div>;

    const isSender = currentUser?.id === transfer.sender;
    const isReceiver = currentUser?.id === transfer.receiver;
    const isPending = transfer.status === 'Pending';
    const isAdmin = currentUser?.role === 'DEV_ADMIN' || currentUser?.role === 'COMPANY_ADMIN';
    const canUpdateStatus = isPhysical && (isSender || isAdmin) && !['Cancelled', 'Rejected'].includes(transfer.status);

    return (
        <div className="max-w-5xl mx-auto py-4 space-y-4">
            {/* Header Section */}
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => router.back()}>
                        <ArrowLeft size={16} className="text-slate-600" />
                    </Button>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <div>
                        <h1 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            {isPhysical ? 'Physical Delivery' : 'Digital Transfer'}
                            <span className="text-slate-400 font-normal">#{id}</span>
                        </h1>
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px] uppercase tracking-wider font-semibold", getStatusColor(transfer.status))}>
                        {transfer.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 hidden sm:inline-block">
                        Created {format(new Date(transfer.created_at), 'MMM d, yyyy')}
                    </span>
                    {canUpdateStatus && (
                        <UpdateStatusDialog transferId={id} currentStatus={transfer.status} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Timeline & Details (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Delivery Status / Timeline */}
                    {isPhysical ? (
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Truck size={14} /> Tracking History
                                </h2>
                                {transfer.tracking_number && (
                                    <div className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                                        {transfer.courier_name} : {transfer.tracking_number}
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-0">
                                <DeliveryTimeline timeline={transfer.timeline} created_at={transfer.created_at} sender_name={transfer.sender_name} />
                            </CardContent>
                        </Card>
                    ) : (
                        // Digital Transfer doesn't really have a timeline other than created -> current status
                        <Card className="border-slate-200 shadow-sm">
                            <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100">
                                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Send size={14} /> Transfer Details
                                </h2>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Sent on</p>
                                            <p className="font-medium text-slate-900">{format(new Date(transfer.created_at), 'PPP')}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Documents */}
                    <Card className="border-slate-200 shadow-sm">
                        <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14} /> Documents ({transfer.documents.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {transfer.documents_details?.map((doc: any) => (
                                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors group">
                                    <div className={`h-8 w-8 rounded text-[10px] font-bold flex items-center justify-center shrink-0 uppercase ${isPhysical ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {doc.fileName?.slice(0, 3) || 'DOC'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {doc.name || doc.fileName}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate font-mono">
                                            {doc.documentNumber || 'No Ref'}
                                        </p>
                                    </div>
                                    {isPhysical && transfer.status === 'Delivered' && (
                                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-600 border-green-200">
                                            Received
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Message / Note */}
                    {transfer.message && (
                        <Card className="border-slate-200 shadow-sm">
                            <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100">
                                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Note</h2>
                            </div>
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-600 italic leading-relaxed">
                                    "{transfer.message}"
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Participants & Actions (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Participants Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100">
                            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Participants</h2>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            <div className="relative">
                                {/* Connector Line */}
                                <div className="absolute left-[19px] top-8 bottom-4 w-0.5 bg-slate-100 -z-10" />

                                <ParticipantRow
                                    label="Sender"
                                    name={transfer.sender_name}
                                    isMe={isSender}
                                    role="sender"
                                />
                                <div className="h-4" /> {/* Spacer */}
                                <ParticipantRow
                                    label="Receiver"
                                    name={transfer.receiver_name}
                                    isMe={isReceiver}
                                    role="receiver"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    {isPending && (
                        <Card className="border-amber-200 bg-amber-50/30 shadow-none">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                                    <AlertCircle size={16} /> Action Required
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-2">
                                {isSender && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8 text-xs bg-white"
                                        onClick={() => actionMutation.mutate('cancel')}
                                        disabled={actionMutation.isPending}
                                    >
                                        Cancel Transfer
                                    </Button>
                                )}
                                {isReceiver && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            size="sm"
                                            className="w-full bg-green-600 hover:bg-green-700 text-white h-8 text-xs shadow-none"
                                            onClick={() => actionMutation.mutate('accept')}
                                            disabled={actionMutation.isPending}
                                        >
                                            Confirm Receipt
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs bg-white"
                                            onClick={() => actionMutation.mutate('reject')}
                                            disabled={actionMutation.isPending}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
                                {!isSender && !isReceiver && !isAdmin && (
                                    <p className="text-xs text-amber-700/70">
                                        Waiting for updates from participants.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// Subcomponents

function ParticipantRow({ label, name, isMe, role }: { label: string, name: string, isMe: boolean, role: 'sender' | 'receiver' }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${role === 'sender' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'
                }`}>
                <User size={18} />
            </div>
            <div className="pt-0.5">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-slate-900">{name}</p>
                    {isMe && <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 bg-slate-100 text-slate-600">You</Badge>}
                </div>
            </div>
        </div>
    );
}

function DeliveryTimeline({ timeline = [], created_at, sender_name }: { timeline: any[], created_at: string, sender_name: string }) {
    const events = [
        ...timeline,
        {
            status: 'Ticket Created',
            created_at: created_at,
            note: 'Transfer request initiated',
            updated_by_name: sender_name,
            isStart: true
        }
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="relative">
            {events.map((event, index) => {
                const isLatest = index === 0;
                const isSystem = event.isStart;

                return (
                    <div key={index} className={cn(
                        "flex gap-4 p-4 transition-colors relative",
                        isLatest && !isSystem ? "bg-white" : "hover:bg-slate-50/50"
                    )}>
                        {/* Timeline Line */}
                        {index !== events.length - 1 && (
                            <div className="absolute left-[27px] top-8 bottom-0 w-0.5 bg-slate-100" />
                        )}

                        {/* Icon */}
                        <div className={cn(
                            "relative z-10 h-6 w-6 rounded-full flex items-center justify-center border shrink-0 mt-0.5",
                            isLatest
                                ? "bg-teal-600 border-teal-600 text-white shadow-sm ring-2 ring-teal-100"
                                : "bg-white border-slate-200 text-slate-400"
                        )}>
                            {isSystem ? <Package size={12} /> : <Truck size={12} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                                <p className={cn(
                                    "text-sm font-medium",
                                    isLatest ? "text-teal-900" : "text-slate-700"
                                )}>
                                    {event.status}
                                </p>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {format(new Date(event.created_at), 'MMM d, h:mm a')}
                                </span>
                            </div>

                            {(event.location || event.note) && (
                                <div className="text-xs text-slate-500 space-y-1 mt-1">
                                    {event.location && (
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <MapPin size={10} />
                                            <span>{event.location}</span>
                                        </div>
                                    )}
                                    {event.note && (
                                        <p className="leading-relaxed opacity-90">{event.note}</p>
                                    )}
                                </div>
                            )}

                            {!isSystem && <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                Updated by <span className="font-medium text-slate-600">{event.updated_by_name}</span>
                            </p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function UpdateStatusDialog({ transferId, currentStatus }: { transferId: string, currentStatus: string }) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const [status, setStatus] = useState(currentStatus);
    const [note, setNote] = useState('');
    const [location, setLocation] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courierName, setCourierName] = useState('');

    const statusOptions = [
        'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Held'
    ];

    const mutation = useMutation({
        mutationFn: (data: any) => apiClient.physicalTransfers.updateStatus(transferId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['physical-transfers', transferId] });
            toast.success('Status updated');
            setOpen(false);
            setNote('');
            setLocation('');
        },
        onError: () => toast.error('Failed to update status')
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 shadow-sm">
                    Update Status
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-xl">
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-semibold tracking-tight text-white/90">Update Delivery</DialogTitle>
                            <DialogDescription className="text-xs text-blue-100/70 mt-1 font-medium">
                                Log a new checkpoint for this package
                            </DialogDescription>
                        </div>
                        <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Truck size={20} className="text-blue-100" />
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5 bg-white">
                    {/* Status Selection - Prominent */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-11 text-sm bg-slate-50 border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(s => (
                                    <SelectItem key={s} value={s} className="text-sm font-medium text-slate-700">{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Location Input */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Location</Label>
                        <div className="relative group">
                            <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                <MapPin size={16} />
                            </div>
                            <Input
                                className="pl-10 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. Guwahati Distribution Hub"
                            />
                        </div>
                    </div>

                    {/* Tracking Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracking #</Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                    <Package size={16} />
                                </div>
                                <Input
                                    className="pl-10 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                    value={trackingNumber}
                                    onChange={e => setTrackingNumber(e.target.value)}
                                    placeholder="AWB-123..."
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courier</Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                    <Truck size={16} />
                                </div>
                                <Input
                                    className="pl-10 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                    value={courierName}
                                    onChange={e => setCourierName(e.target.value)}
                                    placeholder="e.g. BlueDart"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</Label>
                        <Textarea
                            className="min-h-[80px] text-sm bg-slate-50 border-slate-200 focus:bg-white resize-none transition-all focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add notes about package condition or specific details..."
                        />
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-9 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-200/50">
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => mutation.mutate({ status, note, location, tracking_number: trackingNumber, courier_name: courierName })}
                        disabled={mutation.isPending}
                        className="h-9 px-6 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all hover:shadow-lg hover:shadow-teal-600/30"
                    >
                        {mutation.isPending ? 'Saving Update...' : 'Confirm Status Update'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function getStatusColor(status: string) {
    const styles = {
        Pending: 'bg-amber-100 text-amber-700 border-amber-200',
        Accepted: 'bg-green-100 text-green-700 border-green-200',
        Rejected: 'bg-red-100 text-red-700 border-red-200',
        Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
        Dispatched: 'bg-blue-100 text-blue-700 border-blue-200',
        'In Transit': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Out for Delivery': 'bg-purple-100 text-purple-700 border-purple-200',
        Delivered: 'bg-teal-100 text-teal-700 border-teal-200',
        Returned: 'bg-rose-100 text-rose-700 border-rose-200',
        Held: 'bg-orange-100 text-orange-700 border-orange-200',
    } as any;
    return styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}
