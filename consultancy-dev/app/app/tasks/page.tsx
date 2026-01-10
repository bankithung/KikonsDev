'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, Clock, X, Bell, Phone, Mail, MessageSquare, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '@/lib/types';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function TasksPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        assignedTo: '',
        dueDate: '',
        status: 'Todo'
    });

    // Pagination state: { [columnName]: currentPageIndex }
    const [columnPages, setColumnPages] = useState<Record<string, number>>({
        'Todo': 0,
        'In Progress': 0,
        'Done': 0
    });

    const PAGE_SIZE = 5;

    const queryClient = useQueryClient();

    // Fetch Users for Assignment
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: apiClient.users.list,
    });

    const { data: tasks = [], isLoading } = useQuery<Task[]>({
        queryKey: ['tasks'],
        queryFn: apiClient.tasks.list,
    });

    // Fetch assigned follow-ups
    const { data: allFollowUps = [] } = useQuery({
        queryKey: ['followUps'],
        queryFn: apiClient.followUps.list,
    });

    // Filter to show only assigned pending follow-ups
    const myFollowUps = user ? allFollowUps.filter((f: any) =>
        f.assignedTo === user.id && f.status === 'Pending'
    ) : [];

    const createTaskMutation = useMutation({
        mutationFn: apiClient.tasks.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsCreateOpen(false);
            setNewTask({ title: '', assignedTo: '', dueDate: '', status: 'Todo' });
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) => apiClient.tasks.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        createTaskMutation.mutate(newTask);
    };

    const handleMoveTask = (id: string, newStatus: string) => {
        updateTaskMutation.mutate({ id, status: newStatus });
    };

    const columns = ['Todo', 'In Progress', 'Done'];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-slate-500">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tasks</h1>
                    <p className="text-sm text-slate-600 mt-1">Organize and track team tasks</p>
                </div>
                <Button className="h-9 bg-teal-600 hover:bg-teal-700" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Task
                </Button>
            </div>

            {/* My Pending Follow-ups Section */}
            {myFollowUps.length > 0 && (
                <Card className="border-teal-200 bg-teal-50/30">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-teal-600" />
                                <h2 className="text-lg font-bold text-slate-900">My Pending Follow-ups</h2>
                                <span className="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full font-semibold">
                                    {myFollowUps.length}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/app/follow-ups')}
                                className="text-teal-600 border-teal-300 hover:bg-teal-100"
                            >
                                View All
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {myFollowUps.slice(0, 6).map((followUp: any) => (
                                <Card key={followUp.id} className="border-slate-200 hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${followUp.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                                                followUp.type === 'Email' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-green-100 text-green-600'
                                                }`}>
                                                {followUp.type === 'Call' && <Phone size={18} />}
                                                {followUp.type === 'Email' && <Mail size={18} />}
                                                {(followUp.type === 'WhatsApp' || followUp.type === 'SMS') && <MessageSquare size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-900 text-sm truncate">{followUp.studentName}</h4>
                                                <p className="text-xs text-slate-500">{followUp.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                            <Calendar size={12} />
                                            <span>{format(new Date(followUp.scheduledFor), 'MMM dd, HH:mm')}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => router.push(`/app/follow-ups/${followUp.id}`)}
                                        >
                                            <Eye size={14} className="mr-2" />
                                            View Details
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {myFollowUps.length > 6 && (
                            <p className="text-center text-sm text-slate-500 mt-4">
                                And {myFollowUps.length - 6} more pending follow-ups...
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Mobile: Stack view, Desktop: Kanban */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
                {columns.map((col) => {
                    const columnTasks = tasks.filter((t: any) => t.status === col);
                    const totalCount = columnTasks.length;
                    const currentPage = columnPages[col] || 0;
                    const paginatedTasks = columnTasks.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
                    const hasNext = (currentPage + 1) * PAGE_SIZE < totalCount;
                    const hasPrev = currentPage > 0;

                    // For "Done" column, also include completed follow-ups if on the first page
                    const completedFollowUps = col === 'Done' && currentPage === 0
                        ? allFollowUps.filter((f: any) => f.status === 'Completed' && user && f.assignedTo === user.id)
                        : [];

                    return (
                        <div key={col} className="flex flex-col bg-slate-100 rounded-xl p-4 h-[650px]">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-900">{col}</h3>
                                    <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {totalCount}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={!hasPrev}
                                        onClick={() => setColumnPages(prev => ({ ...prev, [col]: (prev[col] || 0) - 1 }))}
                                    >
                                        <ChevronLeft size={14} />
                                    </Button>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                        {currentPage + 1}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={!hasNext}
                                        onClick={() => setColumnPages(prev => ({ ...prev, [col]: (prev[col] || 0) + 1 }))}
                                    >
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                {/* Render tasks */}
                                {paginatedTasks.map((task: Task) => (
                                    <Card key={task.id} className="cursor-move hover:shadow-md transition-all border-slate-200 bg-white group relative">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <p className="font-medium text-sm text-slate-900 leading-snug">{task.title}</p>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white shadow-sm rounded-md border border-slate-100 p-1 flex gap-1">
                                                    {columns.filter(c => c !== col).map(targetCol => (
                                                        <button
                                                            key={targetCol}
                                                            onClick={() => handleMoveTask(task.id, targetCol)}
                                                            className="text-[10px] px-2 py-1 bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded border border-slate-200"
                                                        >
                                                            Move to {targetCol}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>{task.due_date || task.dueDate}</span>
                                                </div>
                                                <div className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md font-medium">
                                                    {task.assigned_to_name || task.assignedTo}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* Render completed follow-ups in Done column */}
                                {col === 'Done' && completedFollowUps.map((followUp: any) => (
                                    <Card
                                        key={`followup-${followUp.id}`}
                                        className="hover:shadow-md transition-all border-green-200 bg-green-50 cursor-pointer"
                                        onClick={() => router.push(`/app/follow-ups/${followUp.id}`)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${followUp.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                                                    followUp.type === 'Email' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-green-100 text-green-600'
                                                    }`}>
                                                    {followUp.type === 'Call' && <Phone size={14} />}
                                                    {followUp.type === 'Email' && <Mail size={14} />}
                                                    {(followUp.type === 'WhatsApp' || followUp.type === 'SMS') && <MessageSquare size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-slate-900 leading-snug truncate">{followUp.studentName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                                                            Follow-up
                                                        </span>
                                                        <span className="text-xs text-slate-500">{followUp.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Bell size={12} />
                                                    <span>Completed</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Button
                                variant="ghost"
                                className="mt-3 text-slate-500 hover:text-slate-900 hover:bg-slate-200 w-full justify-start h-9 text-sm font-medium"
                                onClick={() => {
                                    setNewTask({ ...newTask, status: col });
                                    setIsCreateOpen(true);
                                }}
                            >
                                <Plus size={16} className="mr-2" /> Add Task
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* Create Task Modal */}
            <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border">
                        <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 font-heading">Create New Task</Dialog.Title>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-body">Task Title</Label>
                                <Input
                                    placeholder="Enter task title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-body">Assigned To</Label>
                                <Select value={newTask.assignedTo} onValueChange={(val: string) => setNewTask({ ...newTask, assignedTo: val })}>
                                    <SelectTrigger><SelectValue placeholder="Select Assignee" /></SelectTrigger>
                                    <SelectContent>
                                        {users.filter((u: any) => u.id !== user?.id).map((u: any) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.username} {u.first_name ? `(${u.first_name})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-body">Due Date</Label>
                                <Input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-body">Status</Label>
                                <Select value={newTask.status} onValueChange={(val: string) => setNewTask({ ...newTask, status: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todo">Todo</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={createTaskMutation.isPending}>
                                    {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
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
