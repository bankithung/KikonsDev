'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Video, Phone, MapPin, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function AppointmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: appointment, isLoading } = useQuery({
        queryKey: ['appointment', id],
        queryFn: () => apiClient.appointments.get(id),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">Appointment not found</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const getTypeIcon = () => {
        switch (appointment.type) {
            case 'Video Call': return <Video size={20} className="text-emerald-600" />;
            case 'Phone Call': return <Phone size={20} className="text-blue-600" />;
            default: return <MapPin size={20} className="text-amber-600" />;
        }
    };

    return (
        <>
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 text-sm font-medium"
            >
                <ArrowLeft size={16} />
                Back
            </button>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Main Card */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                {getTypeIcon()}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">{appointment.studentName}</h2>
                                <p className="text-sm text-slate-500">{appointment.type}</p>
                            </div>
                        </div>
                        <Badge className={`${appointment.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : appointment.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {appointment.status}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Calendar size={14} />
                                <span className="text-xs">Date</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900">{format(new Date(appointment.date), 'EEEE, MMMM dd, yyyy')}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Clock size={14} />
                                <span className="text-xs">Time</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900">{appointment.time} ({appointment.duration} mins)</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <User size={14} />
                                <span className="text-xs">Assigned To</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900">{appointment.counselor_name || 'Unassigned'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Mail size={14} />
                                <span className="text-xs">Client Email</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900">{appointment.studentEmail || '-'}</p>
                        </div>
                    </div>

                    {appointment.notes && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h3 className="text-sm font-medium text-slate-700 mb-2">Notes</h3>
                            <p className="text-sm text-slate-600">{appointment.notes}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => router.back()}>
                        Back to Appointments
                    </Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                        Mark as Completed
                    </Button>
                </div>
            </div>
        </>
    );
}
