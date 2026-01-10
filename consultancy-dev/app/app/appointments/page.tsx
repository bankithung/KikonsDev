'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Appointment, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Video, Phone, Plus, Eye, X, ChevronLeft, ChevronRight, User as UserIcon, CalendarDays, MoreVertical, MapPin, Mail, BarChart2, Share, MessageCircle, Heart } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogPortal } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';

export default function AppointmentsPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Form State
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [counselorId, setCounselorId] = useState<string>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState<Appointment['type']>('Video Call');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  // Fetch Appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: apiClient.appointments.list,
  });

  // Fetch Company Users (Counselors)
  const { data: companyUsers = [] } = useQuery<User[]>({
    queryKey: ['companyUsers'],
    queryFn: apiClient.getCompanyUsers,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: apiClient.appointments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Session locked in! 🎯');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to lock session');
    }
  });

  const resetForm = () => {
    setStudentName('');
    setStudentEmail('');
    setCounselorId('');
    setDate('');
    setTime('');
    setDuration('30');
    setType('Video Call');
    setNotes('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselorId) {
      toast.error('Select a counselor');
      return;
    }

    createAppointmentMutation.mutate({
      studentName,
      studentEmail: studentEmail || 'student@example.com',
      counselor: parseInt(counselorId),
      date,
      time,
      duration: parseInt(duration),
      type,
      status: 'Scheduled',
      notes,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
      </div>
    );
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt: Appointment) => {
      try {
        const aptDate = parseISO(apt.date);
        return isSameDay(aptDate, date);
      } catch (e) {
        return false;
      }
    });
  };

  const selectedDayAppointments = getAppointmentsForDate(selectedDate);

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between px-6 py-3 gap-4 -mx-4 sm:-mx-6 lg:-mx-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              List
            </button>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium px-4 h-10 shadow-sm">
            + New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
        {/* Left Column: List or Calendar */}
        <div className={`${view === 'calendar' ? 'lg:col-span-8' : 'lg:col-span-12'} border-r border-slate-200 flex flex-col`}>

          {view === 'calendar' ? (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">
              {/* Calendar Navigator - Lighter Tone */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50 bg-slate-50/30 shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-slate-900 min-w-[150px]">{format(currentDate, 'MMMM yyyy')}</h2>
                  <div className="flex items-center bg-white rounded-full border border-slate-100 p-0.5 shadow-sm">
                    <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="p-1.5 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-900">
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-medium text-slate-500 hover:text-slate-900">Today</button>
                    <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="p-1.5 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-900">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300"></div> <span className="text-xs text-slate-500">Today</span></div>
                  <div className="flex items-center gap-2 relative">
                    <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded-sm"></div>
                    <div className="absolute left-0 top-0 w-0.5 h-full bg-emerald-500 rounded-l-sm"></div>
                    <span className="text-xs text-emerald-600 ml-1">Booked</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-l border-slate-200 sticky top-0 z-10">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-slate-600 py-3 bg-white border-r border-slate-200">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-l border-slate-200">
                  {daysInMonth.map(day => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[85px] p-2 border-r border-b border-slate-200 transition-all cursor-pointer relative group ${!isCurrentMonth ? 'bg-slate-50/5' : 'bg-white'} ${isSelected ? 'bg-slate-50/30' : 'hover:bg-slate-50/20'} ${dayAppointments.length > 0 ? 'bg-emerald-50 border-2 border-emerald-200 border-l-4 border-l-emerald-500 z-[1] -m-[1px]' : ''}`}
                        onClick={() => {
                          setSelectedDate(day);
                          setDate(format(day, 'yyyy-MM-dd'));
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-slate-900 text-white shadow-sm scale-110' : isSelected ? 'text-slate-950 bg-slate-100' : 'text-slate-500 group-hover:text-slate-800'}`}>
                            {format(day, 'd')}
                          </span>
                          {dayAppointments.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                        </div>

                        <div className="space-y-1 mt-2">
                          {dayAppointments.slice(0, 2).map((apt: Appointment) => (
                            <div key={apt.id} className="text-xs text-slate-900 truncate bg-emerald-50 px-2 py-1.5 rounded-md border border-emerald-100 flex items-center gap-2">
                              <span className="text-emerald-600 font-medium">
                                {apt.time.slice(0, 5)}
                              </span>
                              {apt.studentName}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && <p className="text-xs text-slate-500 pl-1">+{dayAppointments.length - 2} more</p>}
                        </div>
                        {isSelected && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Feed View (List View) - Lighter Tone */
            <div className="flex-1 overflow-auto p-8 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((apt: Appointment) => (
                  <div key={apt.id} className="group relative bg-white rounded-lg border border-slate-200 p-4 hover:border-emerald-300 transition-all cursor-pointer shadow-sm hover:shadow-md">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                          {apt.type === 'Video Call' ? <Video size={18} /> : apt.type === 'Phone Call' ? <Phone size={18} /> : <UserIcon size={18} />}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-base font-semibold text-slate-900">{apt.studentName}</h3>
                          <span className="text-xs text-slate-500">{apt.type}</span>
                        </div>
                      </div>
                      <Badge className={`text-xs px-2 py-0.5 ${apt.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <span className="text-xs text-slate-500 block mb-1">Date & Time</span>
                        <span className="text-sm font-medium text-slate-900">{format(new Date(apt.date), 'MMM dd')} • {apt.time.slice(0, 5)}</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <span className="text-xs text-slate-500 block mb-1">Assigned To</span>
                        <span className="text-sm font-medium text-slate-900">{apt.counselor_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-md px-3" onClick={() => router.push(`/app/appointments/${apt.id}`)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {appointments.length === 0 && (
                <div className="py-32 text-center">
                  <BarChart2 size={40} className="mx-auto text-slate-100 mb-6" />
                  <h3 className="text-xl font-semibold text-slate-900">No Appointments</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">No appointments scheduled yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Context Sidebar - Lighter Tone */}
        {view === 'calendar' && (
          <div className="lg:col-span-4 p-6 space-y-6 sticky top-0 h-full overflow-y-auto">
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-5 border-b border-slate-200">
                <p className="text-xs text-slate-500 mb-1">{format(selectedDate, 'EEEE')}</p>
                <h2 className="text-xl font-semibold text-slate-900">{format(selectedDate, 'MMM dd, yyyy')}</h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700">Today's Schedule</h3>
                  <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-md">{selectedDayAppointments.length} Items</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {selectedDayAppointments.length > 0 ? (
                    selectedDayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => (
                      <div key={apt.id} className="group flex gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:border-emerald-200 transition-all">
                        <div className="w-1 h-full rounded-full bg-emerald-500 shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-900">{apt.time.slice(0, 5)}</span>
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{apt.duration} min</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 truncate">{apt.studentName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">with {apt.counselor_name}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <BarChart2 size={24} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">No scheduled items</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <Button onClick={() => setIsCreateOpen(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10 font-medium">
                    New Appointment
                  </Button>
                  <p className="text-xs text-center text-slate-400">Check availability before booking</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Appointment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 rounded-2xl overflow-hidden border-none shadow-2xl">
          <div className="bg-white px-6 py-4 border-b border-slate-200">
            <DialogTitle className="text-xl font-bold text-slate-900">Schedule Appointment</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Book a meeting with a client</p>
          </div>

          <form className="p-6 space-y-5" onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Client Name</Label>
                <input
                  className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Enter client name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Email</Label>
                <input
                  type="email"
                  className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="client@email.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Assign To</Label>
              <Select value={counselorId} onValueChange={setCounselorId}>
                <SelectTrigger className="h-10 bg-white border border-slate-200 rounded-lg">
                  <SelectValue placeholder="Select staff member..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200">
                  {companyUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <span className="text-slate-900">{user.first_name || user.username} {user.last_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 bg-white border border-slate-200 rounded-lg" required />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 bg-white border border-slate-200 rounded-lg" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Meeting Type</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="h-10 bg-white border border-slate-200 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="Video Call">Video Call</SelectItem>
                    <SelectItem value="Phone Call">Phone Call</SelectItem>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="h-10 bg-white border border-slate-200 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10 flex-1">Schedule Appointment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog >

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </>
  );
}
