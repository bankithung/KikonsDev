'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock, X, Bell, Phone, Mail, MessageSquare, GripVertical, Calendar, User, Flag, CheckCircle2, Layout, FileText } from 'lucide-react';
import { Task } from '@/lib/types';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, AlignLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// DnD Kit imports
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Column type definition
const COLUMNS = ['Todo', 'In Progress', 'Done'] as const;
type ColumnType = typeof COLUMNS[number];

// Format date to IST readable format
function formatTaskDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return format(date, 'MMM d, yyyy');
    } catch {
        return dateString;
    }
}

// Task History Component
function TaskHistory({ taskId }: { taskId: string | number }) {
    const { data: history, isLoading } = useQuery({
        queryKey: ['task-history', taskId],
        queryFn: () => apiClient.tasks.history(taskId),
        enabled: !!taskId
    });

    if (isLoading) return <div className="text-sm text-slate-500 p-4">Loading history...</div>;

    if (!history || history.length === 0) {
        return <div className="text-sm text-slate-500 p-4">No activity history found.</div>;
    }

    return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto p-1">
            {history.map((log: any) => (
                <div key={log.id} className="flex gap-3 items-start text-sm border-b pb-3 last:border-0 last:pb-0">
                    <div className="mt-1 w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-slate-900">{log.user}</span>
                            <span className="text-xs text-slate-400">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-slate-600">{log.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Sortable Task Card Component
function SortableTaskCard({ task, onEdit }: { task: Task; onEdit?: (task: Task) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({ id: task.id });

    // State for tooltip
    const [showTooltip, setShowTooltip] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-md border p-3 transition-all group relative ${isDragging
                ? 'opacity-40 border-dashed border-slate-300'
                : isOver
                    ? 'border-teal-400 bg-teal-50 shadow-md ring-2 ring-teal-200'
                    : 'border-slate-200 hover:shadow-sm'
                }`}
        >
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                {/* Description Icon */}
                {task.description && (
                    <div className="relative">
                        <button
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTooltip(!showTooltip);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-teal-600 transition-colors"
                        >
                            <AlignLeft size={12} />
                        </button>
                        {showTooltip && (
                            <div className="absolute right-0 top-6 z-50 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg pointer-events-none">
                                {task.description}
                                <div className="absolute -top-1 right-2 w-2 h-2 bg-slate-800 rotate-45" />
                            </div>
                        )}
                    </div>
                )}

                {/* Edit Icon */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(task);
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Pencil size={12} />
                </button>
            </div>

            <div className="flex items-start gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 p-1 rounded hover:bg-slate-100 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0"
                >
                    <GripVertical size={14} />
                </button>
                <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-sm text-slate-800 leading-tight mb-1">{task.title}</p>
                    {task.priority && (
                        <div className="mb-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${task.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {task.priority}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <Clock size={11} />
                                <span>{formatTaskDate(task.due_date || task.dueDate)}</span>
                            </div>
                            {(task.comments_count || 0) > 0 && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500" title={`${task.comments_count} comments`}>
                                    <MessageSquare size={11} />
                                    <span>{task.comments_count}</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] text-teal-700 font-medium">
                            {task.assigned_to_name || task.assignedTo}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Static Task Card for Drag Overlay
function TaskCardOverlay({ task }: { task: Task }) {
    return (
        <div className="bg-white rounded-md border-2 border-teal-400 p-3 shadow-2xl w-[280px] rotate-2">
            <div className="flex items-start gap-2">
                <div className="mt-0.5 p-1 text-teal-500 shrink-0">
                    <GripVertical size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 leading-tight mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <Clock size={11} />
                                <span>{formatTaskDate(task.due_date || task.dueDate)}</span>
                            </div>
                            {(task.comments_count || 0) > 0 && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500" title={`${task.comments_count} comments`}>
                                    <MessageSquare size={11} />
                                    <span>{task.comments_count}</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] text-teal-700 font-medium">
                            {task.assigned_to_name || task.assignedTo}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}


// Droppable Column Component
function DroppableColumn({
    id,
    title,
    count,
    children,
    onAddTask,
}: {
    id: string;
    title: string;
    count: number;
    children: React.ReactNode;
    onAddTask: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    const getColumnStyles = () => {
        if (isOver) return 'border-teal-400 bg-teal-50 ring-2 ring-teal-200 ring-opacity-50';
        switch (title) {
            case 'Todo':
            case 'In Progress':
                return 'bg-blue-50 border-blue-200';
            case 'Done':
                return 'bg-emerald-50 border-emerald-200';
            default:
                return 'bg-slate-50 border-slate-200';
        }
    };

    return (
        <div
            className={`flex flex-col rounded-xl border transition-all duration-200 ${getColumnStyles()}`}
        >
            <div className={`flex items-center justify-between px-3 py-3 border-b rounded-t-xl ${isOver ? 'border-teal-200 bg-teal-100/50' :
                (title === 'Todo' || title === 'In Progress') ? 'border-blue-200 bg-blue-100/50' :
                    'border-emerald-200 bg-emerald-100/50'
                }`}>
                <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm ${(title === 'Todo' || title === 'In Progress') ? 'text-blue-700' :
                        'text-emerald-700'
                        }`}>{title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${(title === 'Todo' || title === 'In Progress') ? 'bg-white text-blue-600' :
                        'bg-white text-emerald-600'
                        }`}>
                        {count}
                    </span>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className="flex-1 space-y-2 overflow-y-auto custom-scrollbar p-2 min-h-[300px] max-h-[450px]"
            >
                {children}
            </div>

            <button
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-t hover:brightness-95 ${(title === 'Todo' || title === 'In Progress') ? 'text-blue-600 border-blue-200 hover:bg-blue-200/50' :
                    'text-emerald-600 border-emerald-200 hover:bg-emerald-200/50'
                    }`}
                onClick={onAddTask}
            >
                <Plus size={14} /> Add task
            </button>
        </div>
    );
}

export default function TasksPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTask, setNewTask] = useState<{
        title: string;
        description: string;
        assignedTo: string;
        dueDate: string;
        priority: 'Low' | 'Medium' | 'High';
        status: string;
    }>({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'Medium',
        status: 'Todo'
    });

    // Edit State
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Move Reason State
    const [moveReasonOpen, setMoveReasonOpen] = useState(false);
    const [moveReasonText, setMoveReasonText] = useState('');
    const [pendingMove, setPendingMove] = useState<{
        activeId: string;
        overId: string;
        newStatus: ColumnType;
        finalTasks: Task[];
    } | null>(null);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [originalStatus, setOriginalStatus] = useState<ColumnType | null>(null);

    const queryClient = useQueryClient();

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    // Group tasks by column
    const tasksByColumn = useMemo(() => {
        const grouped: Record<ColumnType, Task[]> = {
            'Todo': [],
            'In Progress': [],
            'Done': [],
        };
        tasks.forEach((task) => {
            const status = task.status as ColumnType;
            if (grouped[status]) {
                grouped[status].push(task);
            } else {
                grouped['Todo'].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    // Get active task for overlay
    const activeTask = useMemo(() => {
        if (!activeId) return null;
        return tasks.find((t) => t.id === activeId) || null;
    }, [activeId, tasks]);

    const createTaskMutation = useMutation({
        mutationFn: apiClient.tasks.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsCreateOpen(false);
            setNewTask({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', status: 'Todo' });
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => apiClient.tasks.update(id, data),
        onMutate: async ({ id, data }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['tasks'] });

            // Snapshot the previous value
            const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

            // Optimistically update to the new value
            queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
                if (!old) return [];
                return old.map((task) =>
                    task.id === id ? { ...task, ...data } : task
                );
            });

            // Return a context object with the snapshotted value
            return { previousTasks };
        },
        onError: (err, newTodo, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousTasks) {
                queryClient.setQueryData(['tasks'], context.previousTasks);
            }
        },
        onSettled: (data, error, variables) => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (variables?.id) {
                queryClient.invalidateQueries({ queryKey: ['task-history', variables.id] });
            }
        },
    });

    const reorderTaskMutation = useMutation({
        mutationFn: (items: any[]) => apiClient.tasks.reorder(items),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            // Invalidate history for affected tasks
            variables.forEach((item) => {
                if (item.id) {
                    queryClient.invalidateQueries({ queryKey: ['task-history', item.id] });
                }
            });
        },
    });

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        createTaskMutation.mutate(newTask);
    };

    const handleUpdateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask) return;

        updateTaskMutation.mutate({
            id: editingTask.id,
            data: {
                title: editingTask.title,
                description: editingTask.description,
                assignedTo: editingTask.assignedTo || editingTask.assigned_to, // Handle both mapping cases if needed
                dueDate: editingTask.dueDate || editingTask.due_date,
                priority: editingTask.priority,
                status: editingTask.status
            }
        }, {
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingTask(null);
            }
        });
    };

    const handleConfirmMove = () => {
        if (!pendingMove) return;
        const { finalTasks, activeId, newStatus } = pendingMove;

        // Optimistic Update
        queryClient.setQueryData(['tasks'], finalTasks);

        const payload = finalTasks.map((t, index) => ({
            id: t.id,
            position: index,
            status: t.status,
            // Only attach reason to the moved task
            reason: t.id === activeId ? moveReasonText : undefined
        }));

        reorderTaskMutation.mutate(payload);

        // Reset
        setMoveReasonOpen(false);
        setMoveReasonText('');
        setPendingMove(null);
    };

    const handleCancelMove = () => {
        setMoveReasonOpen(false);
        setMoveReasonText('');
        setPendingMove(null);
        // Refetch to revert drag visual
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    // DnD Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const activeIdStr = event.active.id as string;
        setActiveId(activeIdStr);
        const task = tasks.find(t => t.id === activeIdStr);
        if (task && COLUMNS.includes(task.status as ColumnType)) {
            setOriginalStatus(task.status as ColumnType);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the active task
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        const overTask = tasks.find(t => t.id === overId);
        const isOverColumn = COLUMNS.includes(overId as ColumnType);

        // Calculate new status
        let newStatus: ColumnType | undefined;

        if (isOverColumn) {
            newStatus = overId as ColumnType;
        } else if (overTask) {
            // Ensure the overTask has a valid column status
            const status = overTask.status;
            if (COLUMNS.includes(status as ColumnType)) {
                newStatus = status as ColumnType;
            }
        }

        // If status changed (moving between columns)
        if (newStatus && activeTask.status !== newStatus) {
            // Optimistic update for drag over (visual only first)
            queryClient.setQueryData(['tasks'], (old: Task[] = []) => {
                return old.map(t =>
                    t.id === activeId ? { ...t, status: newStatus } : t
                );
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        const currentOriginalStatus = originalStatus;
        setOriginalStatus(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        const activeTask = tasks.find(t => t.id === activeId);

        if (!activeTask) return;

        // 1. Calculate final tasks state locally
        let finalTasks = [...tasks];

        // Determine new status
        const isOverColumn = COLUMNS.includes(overId as ColumnType);
        let newStatus = activeTask.status; // defaults to current (potentially updated by DragOver)

        if (isOverColumn) {
            newStatus = overId as ColumnType;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask && COLUMNS.includes(overTask.status as ColumnType)) {
                newStatus = overTask.status as ColumnType;
            }
        }

        // Apply status change if needed (redundant if DragOver did it, but safe)
        if (activeTask.status !== newStatus) {
            finalTasks = finalTasks.map(t =>
                t.id === activeId ? { ...t, status: newStatus } : t
            );
        }

        // 2. Handle Reordering via arrayMove
        if (activeId !== overId && !isOverColumn) {
            const oldIndex = finalTasks.findIndex((t) => t.id === activeId);
            const newIndex = finalTasks.findIndex((t) => t.id === overId);
            finalTasks = arrayMove(finalTasks, oldIndex, newIndex);
        }

        // 3. Optimistic Update (Update full list)
        queryClient.setQueryData(['tasks'], finalTasks);

        // 4. Send to Backend (Batch Update)
        // Check if anything actually changed to avoid spam?
        // We know something changed if activeId != overId OR status changed.
        // We can simply verify against originalStatus for status changes.
        // For position, we check indices.
        // Easiest is to just send if activeId !== overId OR currentOriginalStatus !== newStatus

        if (activeId !== overId || (currentOriginalStatus && currentOriginalStatus !== newStatus)) {
            // If status changed and it's a cross-column move, prompt for reason
            if (currentOriginalStatus && currentOriginalStatus !== newStatus) {
                setPendingMove({
                    activeId,
                    overId,
                    newStatus: newStatus as ColumnType,
                    finalTasks
                });
                setMoveReasonOpen(true);
            } else {
                // Just reordering within same column or simple update
                const payload = finalTasks.map((t, index) => ({
                    id: t.id,
                    position: index,
                    status: t.status
                }));
                reorderTaskMutation.mutate(payload);
            }
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
        // Optional: Revert optimistic updates if needed, but react-query usually handles this on refetch
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-slate-500">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
                    <p className="text-xs text-slate-500">Drag and drop tasks to change status</p>
                </div>
                <Button className="h-8 text-xs bg-teal-600 hover:bg-teal-700" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" /> New Task
                </Button>
            </div>

            {/* My Pending Follow-ups Section */}
            {myFollowUps.length > 0 && (
                <div className="bg-teal-50/50 border border-teal-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-teal-600" />
                            <h2 className="text-sm font-semibold text-slate-800">My Pending Follow-ups</h2>
                            <span className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                {myFollowUps.length}
                            </span>
                        </div>
                        <button
                            onClick={() => router.push('/app/follow-ups')}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                        >
                            View All →
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {myFollowUps.slice(0, 4).map((followUp: any) => (
                            <button
                                key={followUp.id}
                                onClick={() => router.push(`/app/follow-ups/${followUp.id}`)}
                                className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-2 hover:shadow-sm hover:border-teal-300 transition-all"
                            >
                                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${followUp.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                                    followUp.type === 'Email' ? 'bg-purple-100 text-purple-600' :
                                        'bg-green-100 text-green-600'
                                    }`}>
                                    {followUp.type === 'Call' && <Phone size={12} />}
                                    {followUp.type === 'Email' && <Mail size={12} />}
                                    {(followUp.type === 'WhatsApp' || followUp.type === 'SMS') && <MessageSquare size={12} />}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-medium text-slate-800 leading-tight">{followUp.studentName}</p>
                                    <p className="text-[10px] text-slate-500">{format(new Date(followUp.scheduledFor), 'MMM dd, HH:mm')}</p>
                                </div>
                            </button>
                        ))}
                        {myFollowUps.length > 4 && (
                            <button
                                onClick={() => router.push('/app/follow-ups')}
                                className="flex items-center px-3 py-2 text-xs text-teal-600 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100"
                            >
                                +{myFollowUps.length - 4} more
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Kanban Board with DnD */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                    {COLUMNS.map((column) => {
                        const columnTasks = tasksByColumn[column];
                        const taskIds = columnTasks.map((t) => t.id);

                        return (
                            <SortableContext
                                key={column}
                                items={taskIds}
                                strategy={verticalListSortingStrategy}
                            >
                                <DroppableColumn
                                    id={column}
                                    title={column}
                                    count={columnTasks.length}
                                    onAddTask={() => {
                                        setNewTask({ ...newTask, status: column });
                                        setIsCreateOpen(true);
                                    }}
                                >
                                    {columnTasks.length === 0 ? (
                                        <div className="flex items-center justify-center h-20 text-xs text-slate-400">
                                            Drop tasks here
                                        </div>
                                    ) : (
                                        columnTasks.map((task) => (
                                            <SortableTaskCard
                                                key={task.id}
                                                task={task}
                                                onEdit={(t) => {
                                                    setEditingTask(t);
                                                    setIsEditOpen(true);
                                                }}
                                            />
                                        ))
                                    )}
                                </DroppableColumn>
                            </SortableContext>
                        );
                    })}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
                </DragOverlay>
            </DndContext>

            {/* Create Task Modal */}
            <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[650px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl z-50 border border-slate-200 overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                                    <Layout size={20} />
                                </div>
                                <div>
                                    <Dialog.Title className="text-lg font-bold text-slate-900 font-heading leading-tight">Create New Task</Dialog.Title>
                                    <p className="text-xs text-slate-500 font-medium">Add a new task to your board</p>
                                </div>
                            </div>
                            <Dialog.Close asChild>
                                <button className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                    <X size={20} />
                                </button>
                            </Dialog.Close>
                        </div>

                        <form onSubmit={handleCreateTask}>
                            <div className="p-6 space-y-5">
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Title</Label>
                                    <Input
                                        placeholder="What needs to be done?"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="font-medium text-slate-900 border-slate-200 focus:border-teal-500 focus:ring-teal-500 h-10"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText size={12} /> Description
                                    </Label>
                                    <Textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Add more details about this task..."
                                        className="min-h-[100px] text-sm resize-none border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Assignee */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <User size={12} /> Assigned To
                                        </Label>
                                        <Select value={newTask.assignedTo} onValueChange={(val: string) => setNewTask({ ...newTask, assignedTo: val })}>
                                            <SelectTrigger className="h-10 border-slate-200 focus:ring-teal-500">
                                                <SelectValue placeholder="Select Assignee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.filter((u: any) => u.id !== user?.id).map((u: any) => (
                                                    <SelectItem key={u.id} value={String(u.id)} className="cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            {u.username}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Flag size={12} /> Priority
                                        </Label>
                                        <Select
                                            value={newTask.priority}
                                            onValueChange={(val: any) => setNewTask({ ...newTask, priority: val })}
                                        >
                                            <SelectTrigger className="h-10 border-slate-200 focus:ring-teal-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low" className="cursor-pointer text-slate-600">Low</SelectItem>
                                                <SelectItem value="Medium" className="cursor-pointer text-amber-600 font-medium">Medium</SelectItem>
                                                <SelectItem value="High" className="cursor-pointer text-rose-600 font-medium">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Due Date */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar size={12} /> Due Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="h-10 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                                            required
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <CheckCircle2 size={12} /> Status
                                        </Label>
                                        <Select value={newTask.status} onValueChange={(val: string) => setNewTask({ ...newTask, status: val })}>
                                            <SelectTrigger className="h-10 border-slate-200 focus:ring-teal-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Todo" className="cursor-pointer">Todo</SelectItem>
                                                <SelectItem value="In Progress" className="cursor-pointer text-blue-600">In Progress</SelectItem>
                                                <SelectItem value="Done" className="cursor-pointer text-emerald-600">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="h-10 px-5 text-slate-600 border-slate-300 hover:bg-white hover:text-slate-800"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-200 font-medium"
                                    disabled={createTaskMutation.isPending}
                                >
                                    {createTaskMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Creating...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Plus size={16} />
                                            <span>Create Task</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Edit Task Modal */}
            <Dialog.Root open={isEditOpen} onOpenChange={setIsEditOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border max-h-[90vh] overflow-y-auto">
                        <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 font-heading">Edit Task</Dialog.Title>
                        {editingTask && (
                            <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="history">History & Comments</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details">
                                    <form onSubmit={handleUpdateTask} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="font-body">Task Title</Label>
                                                <Input
                                                    value={editingTask.title}
                                                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="font-body">Description</Label>
                                                <Textarea
                                                    value={editingTask.description || ''}
                                                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                                    placeholder="Add details about this task..."
                                                    className="min-h-[100px]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-body">Assigned To</Label>
                                                <Select
                                                    value={String(editingTask.assignedTo || editingTask.assigned_to || '')}
                                                    onValueChange={(val) => setEditingTask({ ...editingTask, assignedTo: parseInt(val) })}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select Assignee" /></SelectTrigger>
                                                    <SelectContent>
                                                        {users.map((u: any) => (
                                                            <SelectItem key={u.id} value={String(u.id)}>
                                                                {u.username}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-body">Priority</Label>
                                                <Select
                                                    value={editingTask.priority || 'Medium'}
                                                    onValueChange={(val: any) => setEditingTask({ ...editingTask, priority: val })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Low">Low</SelectItem>
                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                        <SelectItem value="High">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-body">Due Date</Label>
                                                <Input
                                                    type="date"
                                                    value={(() => {
                                                        const dateVal = editingTask.dueDate || editingTask.due_date;
                                                        if (!dateVal) return '';
                                                        try {
                                                            return format(new Date(dateVal), 'yyyy-MM-dd');
                                                        } catch {
                                                            return '';
                                                        }
                                                    })()}
                                                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-body">Status</Label>
                                                <Select
                                                    value={editingTask.status}
                                                    onValueChange={(val: any) => setEditingTask({ ...editingTask, status: val })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Todo">Todo</SelectItem>
                                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                                        <SelectItem value="Done">Done</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-6 border-t mt-4">
                                            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)} className="flex-1">Cancel</Button>
                                            <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={updateTaskMutation.isPending}>
                                                {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </form>
                                </TabsContent>
                                <TabsContent value="history">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-slate-700">Activity History</h3>
                                        <TaskHistory taskId={editingTask.id} />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                        <Dialog.Close asChild>
                            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Move Reason Dialog */}
            <Dialog.Root open={moveReasonOpen} onOpenChange={(open) => !open && handleCancelMove()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border">
                        <Dialog.Title className="text-lg font-bold text-slate-900 mb-2 font-heading">Reason for Move</Dialog.Title>
                        <p className="text-sm text-slate-500 mb-4">Please specify why this task is being moved.</p>

                        <div className="space-y-4">
                            <Textarea
                                placeholder="e.g., Completed the initial draft..."
                                value={moveReasonText}
                                onChange={(e) => setMoveReasonText(e.target.value)}
                                className="min-h-[80px]"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleCancelMove} className="flex-1">Cancel</Button>
                                <Button onClick={handleConfirmMove} className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={!moveReasonText.trim()}>
                                    Confirm Move
                                </Button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
