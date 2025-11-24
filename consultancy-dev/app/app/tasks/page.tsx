import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, Clock, X } from 'lucide-react';
import { Task } from '@/lib/types';
import * as Dialog from '@radix-ui/react-dialog';

export default function TasksPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        assignedTo: '',
        dueDate: '',
        status: 'Todo'
    });

    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery<Task[]>({
        queryKey: ['tasks'],
        queryFn: apiClient.tasks.list,
    });

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

            {/* Mobile: Stack view, Desktop: Kanban */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
                {columns.map((col) => (
                    <div key={col} className="flex flex-col bg-slate-100 rounded-xl p-4 min-h-[300px]">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-900">{col}</h3>
                            <span className="bg-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold">
                                {tasks.filter((t) => t.status === col).length}
                            </span>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                            {tasks
                                .filter((t) => t.status === col)
                                .map((task: Task) => (
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
                                                    <span>{task.dueDate}</span>
                                                </div>
                                                <div className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md font-medium">
                                                    {task.assignedTo}
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
                ))}
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
                                <Input
                                    placeholder="Assignee name"
                                    value={newTask.assignedTo}
                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    required
                                />
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
                                <Select value={newTask.status} onValueChange={(val) => setNewTask({ ...newTask, status: val })}>
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
