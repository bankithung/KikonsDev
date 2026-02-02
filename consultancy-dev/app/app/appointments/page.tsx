'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Appointment, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon, Clock, Video, Phone, Plus, ChevronLeft, ChevronRight,
  User as UserIcon, Search, Filter, RefreshCw, MoreHorizontal, Mail, Trash2, Edit, Eye,
  CalendarDays, Users, CheckCircle, XCircle
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AppointmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // View & Filter State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    counselorId: '',
    date: '',
    time: '',
    duration: '30',
    type: 'Video Call' as Appointment['type'],
    notes: '',
  });

  // Data Fetching
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: apiClient.appointments.list,
  });

  const { data: companyUsers = [] } = useQuery<User[]>({
    queryKey: ['companyUsers'],
    queryFn: apiClient.getCompanyUsers,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: apiClient.appointments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Appointment scheduled successfully!');
    },
    onError: () => toast.error('Failed to schedule appointment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.appointments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setEditingAppointment(null);
      setIsCreateOpen(false);
      resetForm();
      toast.success('Appointment updated successfully!');
    },
    onError: () => toast.error('Failed to update appointment'),
  });

  const deleteMutation = useMutation({
    mutationFn: apiClient.appointments.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment deleted');
    },
    onError: () => toast.error('Failed to delete appointment'),
  });

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'Scheduled').length,
      completed: appointments.filter(a => a.status === 'Completed').length,
      cancelled: appointments.filter(a => a.status === 'Cancelled').length,
      upcoming: appointments.filter(a => {
        try {
          return isFuture(parseISO(a.date)) && a.status === 'Scheduled';
        } catch { return false; }
      }).length,
      todayCount: appointments.filter(a => {
        try {
          return isSameDay(parseISO(a.date), today);
        } catch { return false; }
      }).length,
    };
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = searchQuery === '' ||
        apt.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.counselor_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, searchQuery, statusFilter]);

  // Calendar Helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt: Appointment) => {
      try {
        return isSameDay(parseISO(apt.date), date);
      } catch { return false; }
    });
  };

  const selectedDayAppointments = getAppointmentsForDate(selectedDate);

  // Form Handlers
  const resetForm = () => {
    setFormData({
      studentName: '',
      studentEmail: '',
      counselorId: '',
      date: '',
      time: '',
      duration: '30',
      type: 'Video Call',
      notes: '',
    });
    setEditingAppointment(null);
  };

  const handleOpenCreate = (presetDate?: Date) => {
    resetForm();
    if (presetDate) {
      setFormData(prev => ({ ...prev, date: format(presetDate, 'yyyy-MM-dd') }));
    }
    setIsCreateOpen(true);
  };

  const handleEdit = (apt: Appointment) => {
    setEditingAppointment(apt);
    setFormData({
      studentName: apt.studentName,
      studentEmail: apt.studentEmail || '',
      counselorId: apt.counselor.toString(),
      date: apt.date,
      time: apt.time,
      duration: apt.duration.toString(),
      type: apt.type,
      notes: apt.notes || '',
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.counselorId) {
      toast.error('Please select a counselor');
      return;
    }

    const payload = {
      studentName: formData.studentName,
      studentEmail: formData.studentEmail || 'contact@example.com',
      counselor: formData.counselorId,
      date: formData.date,
      time: formData.time,
      duration: parseInt(formData.duration),
      type: formData.type,
      status: 'Scheduled' as const,
      notes: formData.notes,
    };

    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video Call': return <Video size={14} className="text-blue-500" />;
      case 'Phone Call': return <Phone size={14} className="text-green-500" />;
      default: return <UserIcon size={14} className="text-purple-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2">

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden hover:shadow-md transition-all">
          <div className="h-1 w-full bg-blue-500" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scheduled</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.scheduled}</h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <CalendarDays size={18} className="text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] text-blue-600 mt-2">{stats.todayCount} today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden hover:shadow-md transition-all">
          <div className="h-1 w-full bg-emerald-500" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.completed}</h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-[10px] text-emerald-600 mt-2">All time</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden hover:shadow-md transition-all">
          <div className="h-1 w-full bg-amber-500" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upcoming</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.upcoming}</h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
            </div>
            <p className="text-[10px] text-amber-600 mt-2">In the future</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden hover:shadow-md transition-all">
          <div className="h-1 w-full bg-slate-400" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cancelled</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.cancelled}</h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <XCircle size={18} className="text-slate-500" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Header Row: View Toggle + Search + Filters + New Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Toggle + Search */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setView('calendar')}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900')}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900')}
            >
              List
            </button>
          </div>

          <div className="relative flex-1 min-w-[180px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white border-slate-200 text-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px] bg-white border-slate-200 text-xs shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right: New Appointment Button */}
        <Button onClick={() => handleOpenCreate()} size="sm" className="h-9 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shrink-0">
          <Plus className="mr-2 h-3.5 w-3.5" /> New Appointment
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Calendar / List View */}
        <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", view === 'calendar' ? 'lg:col-span-8' : 'lg:col-span-12')}>

          {view === 'calendar' ? (
            <div className="flex flex-col">
              {/* Calendar Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-slate-900">{format(currentDate, 'MMMM yyyy')}</h2>
                  <div className="flex items-center bg-white rounded-full border border-slate-200 p-0.5">
                    <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="p-1.5 hover:bg-slate-100 rounded-full">
                      <ChevronLeft size={14} className="text-slate-500" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-2 text-xs font-medium text-slate-600 hover:text-slate-900">Today</button>
                    <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="p-1.5 hover:bg-slate-100 rounded-full">
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] font-semibold text-slate-500 uppercase py-2 bg-slate-50">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {daysInMonth.map(day => {
                  const dayAppointments = getAppointmentsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = isSameDay(day, selectedDate);
                  const todayCheck = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setFormData(prev => ({ ...prev, date: format(day, 'yyyy-MM-dd') }));
                      }}
                      className={cn(
                        "min-h-[70px] p-1.5 border-b border-r border-slate-100 cursor-pointer transition-all relative group/cell",
                        !isCurrentMonth && 'bg-slate-50/50 opacity-50',
                        isSelected && 'bg-teal-50 ring-1 ring-teal-300 ring-inset',
                        !isSelected && 'hover:bg-slate-50'
                      )}
                    >
                      {/* Hover Plus Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCreate(day);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center opacity-0 group-hover/cell:opacity-100 hover:bg-teal-600 transition-all shadow-sm z-10"
                        title="Add appointment"
                      >
                        <Plus size={12} />
                      </button>

                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                          todayCheck && 'bg-teal-600 text-white',
                          isSelected && !todayCheck && 'bg-teal-100 text-teal-700',
                          !todayCheck && !isSelected && 'text-slate-600'
                        )}>
                          {format(day, 'd')}
                        </span>
                        {dayAppointments.length > 0 && (
                          <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                            {dayAppointments.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayAppointments.slice(0, 2).map((apt) => (
                          <div key={apt.id} className="text-[10px] text-slate-700 truncate bg-teal-50 px-1.5 py-0.5 rounded border-l-2 border-teal-400">
                            <span className="font-medium text-teal-600">{apt.time.slice(0, 5)}</span> {apt.studentName.split(' ')[0]}
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <p className="text-[9px] text-slate-400 pl-1">+{dayAppointments.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="p-4">
              {filteredAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredAppointments.map((apt) => (
                    <div key={apt.id} className="group bg-white border border-slate-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                            {getTypeIcon(apt.type)}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">{apt.studentName}</h3>
                            <p className="text-[10px] text-slate-500">{apt.type}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal size={14} className="text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[140px]">
                            <DropdownMenuItem onClick={() => handleEdit(apt)} className="text-xs">
                              <Edit size={12} className="mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(apt.id)} className="text-xs text-red-600">
                              <Trash2 size={12} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-slate-50 rounded-md px-2.5 py-2">
                          <p className="text-[9px] text-slate-400 uppercase font-semibold">Date & Time</p>
                          <p className="text-xs font-medium text-slate-800">{format(new Date(apt.date), 'MMM dd')} • {apt.time.slice(0, 5)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-md px-2.5 py-2">
                          <p className="text-[9px] text-slate-400 uppercase font-semibold">Duration</p>
                          <p className="text-xs font-medium text-slate-800">{apt.duration} min</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <Badge className={cn("text-[9px] px-2 py-0.5 border", getStatusColor(apt.status))}>
                          {apt.status}
                        </Badge>
                        <span className="text-[10px] text-slate-500">with {apt.counselor_name || 'Staff'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <CalendarDays size={32} className="mx-auto text-slate-200 mb-3" />
                  <h3 className="text-sm font-semibold text-slate-700">No appointments found</h3>
                  <p className="text-xs text-slate-400 mt-1">Create a new appointment to get started</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Selected Day Details (Calendar View Only) */}
        {view === 'calendar' && (
          <div className="lg:col-span-4 space-y-3">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 py-3">
                <p className="text-[10px] font-medium uppercase opacity-80">{format(selectedDate, 'EEEE')}</p>
                <h2 className="text-lg font-bold">{format(selectedDate, 'MMM dd, yyyy')}</h2>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-700">Schedule</h3>
                  <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                    {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {selectedDayAppointments.length > 0 ? (
                    selectedDayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => (
                      <div key={apt.id} className="flex gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all group">
                        <div className="w-1 rounded-full bg-teal-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-teal-600">{apt.time.slice(0, 5)}</span>
                            <span className="text-[9px] text-slate-400">{apt.duration}min</span>
                          </div>
                          <h4 className="text-sm font-medium text-slate-900 truncate">{apt.studentName}</h4>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            {getTypeIcon(apt.type)} {apt.type}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <CalendarDays size={20} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">No appointments</p>
                    </div>
                  )}
                </div>

                <Button onClick={() => handleOpenCreate(selectedDate)} className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white h-9 text-xs font-medium">
                  <Plus size={14} className="mr-1.5" /> Add Appointment
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-5 py-4">
            <DialogTitle className="text-lg font-bold">{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
            <p className="text-sm opacity-80 mt-0.5">Schedule a meeting with a client</p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Client Name *</Label>
                <Input
                  value={formData.studentName}
                  onChange={(e) => setFormData(p => ({ ...p, studentName: e.target.value }))}
                  placeholder="Enter name"
                  className="h-9 text-sm border-slate-200"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Email</Label>
                <Input
                  type="email"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData(p => ({ ...p, studentEmail: e.target.value }))}
                  placeholder="client@email.com"
                  className="h-9 text-sm border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Assign To *</Label>
              <Select value={formData.counselorId} onValueChange={(v) => setFormData(p => ({ ...p, counselorId: v }))}>
                <SelectTrigger className="h-9 text-sm border-slate-200"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {companyUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name || user.username} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Date *</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} className="h-9 text-sm border-slate-200" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Time *</Label>
                <Input type="time" value={formData.time} onChange={(e) => setFormData(p => ({ ...p, time: e.target.value }))} className="h-9 text-sm border-slate-200" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Meeting Type</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="h-9 text-sm border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Video Call">Video Call</SelectItem>
                    <SelectItem value="Phone Call">Phone Call</SelectItem>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Duration</Label>
                <Select value={formData.duration} onValueChange={(v) => setFormData(p => ({ ...p, duration: v }))}>
                  <SelectTrigger className="h-9 text-sm border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="45">45 Minutes</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="h-9 text-sm border-slate-200"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button type="button" variant="outline" className="flex-1 h-11 text-sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white text-sm">
                {editingAppointment ? 'Save Changes' : 'Schedule Appointment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
