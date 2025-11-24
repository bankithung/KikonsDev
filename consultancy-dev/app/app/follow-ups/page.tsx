'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Phone, Mail, MessageSquare, CheckCircle, AlertCircle, Plus, Search, Filter } from 'lucide-react';
import { format, addDays } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Enquiry } from '@/lib/types';
import toast from 'react-hot-toast';

interface FollowUp {
  id: string;
  enquiryId: string;
  studentName: string;
  type: 'Call' | 'Email' | 'SMS' | 'WhatsApp';
  scheduledFor: string;
  status: 'Pending' | 'Completed' | 'Missed';
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  assignedTo: string;
  created_by_name?: string;
}

export default function FollowUpsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{ id: string, date: string, time: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal State
  const [newFollowUp, setNewFollowUp] = useState({
    enquiryId: '',
    type: 'Call',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    priority: 'Medium',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch enquiries for the dropdown
  const { data: enquiries = [] } = useQuery<Enquiry[]>({
    queryKey: ['enquiries'],
    queryFn: apiClient.enquiries.list,
  });

  const { data: followUps = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ['followUps'],
    queryFn: apiClient.followUps.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiClient.followUps.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      toast.success('Follow-up marked as complete!');
    },
  });

  const createMutation = useMutation({
    mutationFn: apiClient.followUps.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      setIsCreateOpen(false);
      toast.success('Follow-up scheduled successfully! 🎉');
      setNewFollowUp({
        enquiryId: '',
        type: 'Call',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        priority: 'Medium',
        notes: ''
      });
    },
    onError: () => {
      toast.error('Failed to schedule follow-up. Please try again.');
    },
  });

  const handleComplete = (id: string) => {
    updateMutation.mutate({ id, data: { status: 'Completed' } });
  };

  const handleReschedule = (followUpId: string, currentDate: string) => {
    const dateObj = new Date(currentDate);
    setRescheduleData({
      id: followUpId,
      date: dateObj.toISOString().split('T')[0],
      time: dateObj.toTimeString().slice(0, 5)
    });
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleData) return;

    updateMutation.mutate({
      id: rescheduleData.id,
      data: {
        scheduledFor: `${rescheduleData.date}T${rescheduleData.time}:00`,
        status: 'Pending'
      }
    });
    setIsRescheduleOpen(false);
    setRescheduleData(null);
    toast.success('Follow-up rescheduled successfully!');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowUp.enquiryId) {
      toast.error('Please select an enquiry first');
      return;
    }
    createMutation.mutate({
      enquiry: parseInt(newFollowUp.enquiryId),
      type: newFollowUp.type,
      priority: newFollowUp.priority,
      notes: newFollowUp.notes,
      scheduledFor: `${newFollowUp.date}T${newFollowUp.time}:00`,
      assignedTo: 'Current User', // Should come from auth store
      status: 'Pending'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading follow-ups...</div>
      </div>
    );
  }

  const filteredFollowUps = followUps.filter((f: FollowUp) => {
    const matchesSearch = f.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || f.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const todayFollowUps = followUps.filter((f: FollowUp) => {
    const today = new Date().toDateString();
    return new Date(f.scheduledFor).toDateString() === today && f.status === 'Pending';
  });

  const overdueFollowUps = followUps.filter((f: FollowUp) => {
    return new Date(f.scheduledFor) < new Date() && f.status === 'Pending';
  });

  // Calculate completion rate
  const completedCount = followUps.filter((f: FollowUp) => f.status === 'Completed').length;
  const totalFollowUps = followUps.length;
  const completionRate = totalFollowUps > 0 ? Math.round((completedCount / totalFollowUps) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Follow-up Management</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Never miss a lead with automated follow-up tracking</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="h-9 bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" /> Schedule Follow-up
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Due Today</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{todayFollowUps.length}</h3>
              </div>
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Overdue</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{overdueFollowUps.length}</h3>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Completion Rate</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{completionRate}%</h3>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search student..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-white" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Missed">Missed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-10" onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setSearchTerm(''); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List */}
      <div className="grid gap-4">
        {filteredFollowUps.map((followUp: FollowUp) => (
          <Card key={followUp.id} className={`border-2 ${followUp.status === 'Missed' ? 'border-red-200 bg-red-50/30' :
            followUp.status === 'Completed' ? 'border-green-200 bg-green-50/30' :
              followUp.priority === 'High' ? 'border-yellow-200 bg-yellow-50/30' :
                'border-slate-200'
            }`}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${followUp.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                      followUp.type === 'Email' ? 'bg-purple-100 text-purple-600' :
                        followUp.type === 'WhatsApp' ? 'bg-green-100 text-green-600' :
                          'bg-teal-100 text-teal-600'
                      }`}>
                      {followUp.type === 'Call' && <Phone size={20} />}
                      {followUp.type === 'Email' && <Mail size={20} />}
                      {followUp.type === 'WhatsApp' && <MessageSquare size={20} />}
                      {followUp.type === 'SMS' && <MessageSquare size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900 font-heading">{followUp.studentName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${followUp.priority === 'High' ? 'bg-red-100 text-red-700' :
                          followUp.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                          {followUp.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${followUp.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          followUp.status === 'Missed' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                          {followUp.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 font-body">{followUp.notes}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-body">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(followUp.scheduledFor), 'dd MMM yyyy, HH:mm')}
                        </span>
                        <span>Assigned: {followUp.assignedTo}</span>
                        <span className="ml-2">Added By: {followUp.created_by_name || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 lg:flex-col">
                  {followUp.status === 'Pending' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 font-body" onClick={() => handleComplete(followUp.id)}>
                        <CheckCircle size={14} className="mr-2" /> Complete
                      </Button>
                      <Button size="sm" variant="outline" className="font-body" onClick={() => handleReschedule(followUp.id, followUp.scheduledFor)}>
                        Reschedule
                      </Button>
                    </>
                  )}
                  {followUp.status === 'Missed' && (
                    <Button size="sm" variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 font-body" onClick={() => handleReschedule(followUp.id, followUp.scheduledFor)}>
                      Reschedule Now
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFollowUps.length === 0 && (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium font-body">No follow-ups found</p>
              <p className="text-sm text-slate-400 mt-1 font-body">Schedule your first follow-up to get started</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Follow-up Modal */}
      <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 font-heading">Schedule Follow-up</Dialog.Title>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-body">Select Enquiry</Label>
                <Select value={newFollowUp.enquiryId} onValueChange={(val: string) => setNewFollowUp({ ...newFollowUp, enquiryId: val })} required>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose an enquiry..." />
                  </SelectTrigger>
                  <SelectContent>
                    {enquiries.map((enq) => (
                      <SelectItem key={enq.id} value={enq.id.toString()}>
                        {enq.candidateName} - {enq.courseInterested}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Follow-up Type</Label>
                <Select value={newFollowUp.type} onValueChange={(val: string) => setNewFollowUp({ ...newFollowUp, type: val as any })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Call">Phone Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body">Date</Label>
                  <Input
                    type="date"
                    value={newFollowUp.date}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">Time</Label>
                  <Input
                    type="time"
                    value={newFollowUp.time}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, time: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Priority</Label>
                <Select value={newFollowUp.priority} onValueChange={(val: string) => setNewFollowUp({ ...newFollowUp, priority: val as any })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High Priority</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="Low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Notes (Optional)</Label>
                <Input
                  placeholder="Add any notes..."
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-11 bg-teal-600 hover:bg-teal-700">
                  Schedule
                </Button>
              </div>
            </form>
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reschedule Follow-up Modal */}
      <Dialog.Root open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 font-heading">Reschedule Follow-up</Dialog.Title>
            {rescheduleData && (
              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body">New Date</Label>
                    <Input
                      type="date"
                      value={rescheduleData.date}
                      onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">New Time</Label>
                    <Input
                      type="time"
                      value={rescheduleData.time}
                      onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsRescheduleOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-11 bg-teal-600 hover:bg-teal-700">
                    Reschedule
                  </Button>
                </div>
              </form>
            )}
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
