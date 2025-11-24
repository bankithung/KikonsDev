'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Video, Phone, Plus, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';

interface Appointment {
  id: string;
  studentName: string;
  studentEmail: string;
  counselor: string;
  date: string;
  time: string;
  duration: number;
  type: 'In-Person' | 'Video Call' | 'Phone Call';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [counselor, setCounselor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState<'In-Person' | 'Video Call' | 'Phone Call'>('Video Call');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: apiClient.appointments.list,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: apiClient.appointments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsCreateOpen(false);
      resetForm();
      alert('Appointment booked successfully!');
    },
  });

  const resetForm = () => {
    setStudentName('');
    setCounselor('');
    setDate('');
    setTime('');
    setDuration('30');
    setType('Video Call');
    setNotes('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAppointmentMutation.mutate({
      studentName, // In a real app, this would be an ID
      studentEmail: 'student@example.com', // Placeholder
      counselor,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading appointments...</div>
      </div>
    );
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const todayAppointments = appointments.filter((apt: Appointment) =>
    isSameDay(new Date(apt.date), new Date()) && apt.status === 'Scheduled'
  );

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt: Appointment) => isSameDay(new Date(apt.date), date));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Appointments</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Schedule and manage counseling sessions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className={`h-9 font-body ${view === 'calendar' ? 'bg-teal-50 text-teal-700' : ''}`} onClick={() => setView('calendar')}>
            Calendar
          </Button>
          <Button variant="outline" size="sm" className={`h-9 font-body ${view === 'list' ? 'bg-teal-50 text-teal-700' : ''}`} onClick={() => setView('list')}>
            List
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="h-9 bg-teal-600 hover:bg-teal-700 font-body">
            <Plus className="mr-2 h-4 w-4" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Today's Appointments Alert */}
      {todayAppointments.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900 font-body">
                You have {todayAppointments.length} appointment{todayAppointments.length > 1 ? 's' : ''} scheduled today
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'calendar' ? (
        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold font-heading">{format(currentDate, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentDate(d => addDays(d, -30))}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" className="h-8 font-body px-3" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentDate(d => addDays(d, 30))}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2 font-body">
                  {day}
                </div>
              ))}
              {daysInMonth.map(day => {
                const dayAppointments = getAppointmentsForDate(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all ${isToday ? 'border-teal-500 bg-teal-50' :
                      dayAppointments.length > 0 ? 'border-blue-200 bg-blue-50/50' :
                        'border-slate-200 hover:border-slate-300'
                      }`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <p className={`text-sm font-semibold mb-1 font-body ${isToday ? 'text-teal-600' : 'text-slate-900'}`}>
                      {format(day, 'd')}
                    </p>
                    {dayAppointments.slice(0, 2).map((apt: Appointment) => (
                      <div key={apt.id} className="text-[10px] bg-blue-600 text-white px-1 py-0.5 rounded mb-0.5 truncate font-body">
                        {apt.time} - {apt.studentName.split(' ')[0]}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <p className="text-[9px] text-slate-500 font-body">+{dayAppointments.length - 2} more</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt: Appointment) => (
            <Card key={apt.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${apt.type === 'Video Call' ? 'bg-purple-100 text-purple-600' :
                      apt.type === 'Phone Call' ? 'bg-blue-100 text-blue-600' :
                        'bg-teal-100 text-teal-600'
                      }`}>
                      {apt.type === 'Video Call' ? <Video size={20} /> :
                        apt.type === 'Phone Call' ? <Phone size={20} /> :
                          <CalendarIcon size={20} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 font-heading">{apt.studentName}</h3>
                      <p className="text-sm text-slate-600 font-body mt-1">{apt.notes}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-body">
                        <span>{format(new Date(apt.date), 'dd MMM yyyy')} at {apt.time}</span>
                        <span>•</span>
                        <span>{apt.duration} minutes</span>
                        <span>•</span>
                        <span>with {apt.counselor}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${apt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                    apt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                    {apt.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Appointment Modal */}
      <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 font-heading">Book Appointment</Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label className="font-body">Student Name</Label>
                <Input
                  className="h-11"
                  placeholder="e.g. John Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Counselor</Label>
                <Input
                  className="h-11"
                  placeholder="e.g. Dr. Smith"
                  value={counselor}
                  onChange={(e) => setCounselor(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body">Date</Label>
                  <Input
                    type="date"
                    className="h-11"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">Time</Label>
                  <Input
                    type="time"
                    className="h-11"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-body">Type</Label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In-Person">In-Person</SelectItem>
                      <SelectItem value="Video Call">Video Call</SelectItem>
                      <SelectItem value="Phone Call">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Notes</Label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border border-slate-300 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-body"
                  placeholder="Add any details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 h-11 font-body">Cancel</Button>
                <Button type="submit" className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 font-body" disabled={createAppointmentMutation.isPending}>
                  {createAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
                </Button>
              </div>
            </form>
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
