'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Plus, Clock, X, Bell, Phone, Mail, MessageSquare,
    Calendar, User, Flag, CheckCircle2, Layout, FileText,
    Circle, Loader2, Check, ChevronDown, ChevronUp, Search,
    MoreHorizontal, Trash2
} from 'lucide-react';
import { Task } from '@/lib/types';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
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

// Priority colors for left border
const PRIORITY_COLORS = {
    High: 'border-l-red-500',
    Medium: 'border-l-amber-500',
    Low: 'border-l-slate-400',
};

const PRIORITY_BG = {
    High: 'bg-red-50 text-red-700',
    Medium: 'bg-amber-50 text-amber-700',
    Low: 'bg-slate-100 text-slate-600',
};

// Column icons
const COLUMN_ICONS = {
    'Todo': Circle,
    'In Progress': Loader2,
    'Done': Check,
};

const COLUMN_COLORS = {
    'Todo': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-200 text-slate-700' },
    'In Progress': { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    'Done': { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
};

// Format date to IST readable format
function formatTaskDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return format(date, 'MMM d');
    } catch {
        return dateString;
    }
}

// Check if date is overdue
function isOverdue(dateString: string | undefined): boolean {
    if (!dateString) return false;
    try {
        const date = new Date(dateString);
        return date < new Date();
    } catch {
        return false;
    }
}

// Task History Component
function TaskHistory({ taskId }: { taskId: string | number }) {
    const { data: history, isLoading } = useQuery({
        queryKey: ['task-history', taskId],
        queryFn: () => apiClient.tasks.history(taskId),
        enabled: !!taskId
    });

    if (isLoading) return <div className="text-xs text-slate-500 p-3">Loading history...</div>;

    if (!history || history.length === 0) {
        return <div className="text-xs text-slate-500 p-3">No activity history found.</div>;
    }

    return (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {history.map((log: any) => (
                <div key={log.id} className="flex gap-2 items-start text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-slate-800">{log.user}</span>
                            <span className="text-[10px] text-slate-400">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{log.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Compact Sortable Task Card Component
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

    const [showTooltip, setShowTooltip] = useState(false);
    const priority = (task.priority || 'Low') as keyof typeof PRIORITY_COLORS;
    const overdue = task.status !== 'Done' && isOverdue(task.due_date || task.dueDate);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onEdit?.(task)}
            className={`
                bg-white rounded-lg border-l-[3px] ${PRIORITY_COLORS[priority]} 
                border border-slate-200 p-2.5 cursor-grab active:cursor-grabbing
                transition-all duration-150 group
                ${isDragging ? 'opacity-50 shadow-lg scale-[1.02] rotate-1' : ''}
                ${isOver ? 'ring-2 ring-teal-400 ring-opacity-50' : ''}
                hover:shadow-md hover:border-slate-300
            `}
        >
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-[13px] font-medium text-slate-800 leading-snug line-clamp-2 flex-1">
                    {task.title}
                </h4>
                {task.description && (
                    <div className="relative shrink-0">
                        <button
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTooltip(!showTooltip);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600"
                        >
                            <FileText size={12} />
                        </button>
                        {showTooltip && (
                            <div className="absolute right-0 top-5 z-50 w-52 p-2 bg-slate-900 text-white text-[11px] rounded-md shadow-lg pointer-events-none">
                                {task.description}
                                <div className="absolute -top-1 right-2 w-2 h-2 bg-slate-900 rotate-45" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Metadata Row */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {/* Due Date */}
                    <div className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                        <Clock size={10} />
                        <span>{formatTaskDate(task.due_date || task.dueDate)}</span>
                    </div>

                    {/* Comments Count */}
                    {(task.comments_count || 0) > 0 && (
                        <div className="flex items-center gap-0.5 text-[11px] text-slate-400">
                            <MessageSquare size={10} />
                            <span>{task.comments_count}</span>
                        </div>
                    )}
                </div>

                {/* Assignee Avatar */}
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                        {(task.assigned_to_name || task.assignedTo || '?').toString().charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Static Task Card for Drag Overlay
function TaskCardOverlay({ task }: { task: Task }) {
    const priority = (task.priority || 'Low') as keyof typeof PRIORITY_COLORS;

    return (
        <div className={`
            bg-white rounded-lg border-l-[3px] ${PRIORITY_COLORS[priority]} 
            border-2 border-teal-400 p-2.5 shadow-2xl w-[260px] rotate-2
        `}>
            <h4 className="text-[13px] font-medium text-slate-800 leading-snug mb-1.5">
                {task.title}
            </h4>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock size={10} />
                    <span>{formatTaskDate(task.due_date || task.dueDate)}</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-[9px] font-bold text-white">
                    {(task.assigned_to_name || task.assignedTo || '?').toString().charAt(0).toUpperCase()}
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
    const colors = COLUMN_COLORS[title as keyof typeof COLUMN_COLORS] || COLUMN_COLORS['Todo'];
    const Icon = COLUMN_ICONS[title as keyof typeof COLUMN_ICONS] || Circle;

    return (
        <div className={`
            flex flex-col rounded-xl border transition-all duration-200 min-h-[400px]
            ${isOver ? 'border-teal-400 bg-teal-50/50 ring-2 ring-teal-200' : `${colors.border} bg-white`}
        `}>
            {/* Column Header */}
            <div className={`flex items-center justify-between px-3 py-2.5 border-b ${colors.border}`}>
                <div className="flex items-center gap-2">
                    <Icon size={14} className={`${colors.text} ${title === 'In Progress' ? 'animate-spin' : ''}`} />
                    <h3 className={`font-semibold text-sm ${colors.text}`}>{title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${colors.badge}`}>
                        {count}
                    </span>
                </div>
                <button
                    onClick={onAddTask}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors"
                    title="Add task"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Cards Container */}
            <div
                ref={setNodeRef}
                className="flex-1 space-y-2 p-2 overflow-y-auto custom-scrollbar"
                style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
                {children}
            </div>
        </div>
    );
}

export default function TasksPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [followUpsExpanded, setFollowUpsExpanded] = useState(true);

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

    // Filter tasks based on search and priority
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = !searchQuery ||
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            return matchesSearch && matchesPriority;
        });
    }, [tasks, searchQuery, priorityFilter]);

    // Group tasks by column
    const tasksByColumn = useMemo(() => {
        const grouped: Record<ColumnType, Task[]> = {
            'Todo': [],
            'In Progress': [],
            'Done': [],
        };
        filteredTasks.forEach((task) => {
            const status = task.status as ColumnType;
            if (grouped[status]) {
                grouped[status].push(task);
            } else {
                grouped['Todo'].push(task);
            }
        });
        return grouped;
    }, [filteredTasks]);

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
            await queryClient.cancelQueries({ queryKey: ['tasks'] });
            const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
            queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
                if (!old) return [];
                return old.map((task) =>
                    task.id === id ? { ...task, ...data } : task
                );
            });
            return { previousTasks };
        },
        onError: (err, newTodo, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['tasks'], context.previousTasks);
            }
        },
        onSettled: (data, error, variables) => {
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
                assignedTo: editingTask.assignedTo || editingTask.assigned_to,
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

        queryClient.setQueryData(['tasks'], finalTasks);

        const payload = finalTasks.map((t, index) => ({
            id: t.id,
            position: index,
            status: t.status,
            reason: t.id === activeId ? moveReasonText : undefined
        }));

        reorderTaskMutation.mutate(payload);

        setMoveReasonOpen(false);
        setMoveReasonText('');
        setPendingMove(null);
    };

    const handleCancelMove = () => {
        setMoveReasonOpen(false);
        setMoveReasonText('');
        setPendingMove(null);
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

        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        const overTask = tasks.find(t => t.id === overId);
        const isOverColumn = COLUMNS.includes(overId as ColumnType);

        let newStatus: ColumnType | undefined;

        if (isOverColumn) {
            newStatus = overId as ColumnType;
        } else if (overTask) {
            const status = overTask.status;
            if (COLUMNS.includes(status as ColumnType)) {
                newStatus = status as ColumnType;
            }
        }

        if (newStatus && activeTask.status !== newStatus) {
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

        let finalTasks = [...tasks];

        const isOverColumn = COLUMNS.includes(overId as ColumnType);
        let newStatus = activeTask.status;

        if (isOverColumn) {
            newStatus = overId as ColumnType;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask && COLUMNS.includes(overTask.status as ColumnType)) {
                newStatus = overTask.status as ColumnType;
            }
        }

        if (activeTask.status !== newStatus) {
            finalTasks = finalTasks.map(t =>
                t.id === activeId ? { ...t, status: newStatus } : t
            );
        }

        if (activeId !== overId && !isOverColumn) {
            const oldIndex = finalTasks.findIndex((t) => t.id === activeId);
            const newIndex = finalTasks.findIndex((t) => t.id === overId);
            finalTasks = arrayMove(finalTasks, oldIndex, newIndex);
        }

        queryClient.setQueryData(['tasks'], finalTasks);

        if (activeId !== overId || (currentOriginalStatus && currentOriginalStatus !== newStatus)) {
            if (currentOriginalStatus && currentOriginalStatus !== newStatus) {
                setPendingMove({
                    activeId,
                    overId,
                    newStatus: newStatus as ColumnType,
                    finalTasks
                });
                setMoveReasonOpen(true);
            } else {
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
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    // Stats
    const totalTasks = tasks.length;
    const completedTasks = tasksByColumn['Done'].length;
    const inProgressTasks = tasksByColumn['In Progress'].length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="text-sm text-slate-500">Loading tasks...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-end gap-2">

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 w-40 text-xs"
                        />
                    </div>

                    {/* Priority Filter */}
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* New Task Button */}
                    <Button
                        className="h-8 text-xs bg-teal-600 hover:bg-teal-700 shadow-sm"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Plus className="mr-1 h-3.5 w-3.5" /> New Task
                    </Button>
                </div>
            </div>

            {/* My Pending Follow-ups Section - Collapsible */}
            {myFollowUps.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setFollowUpsExpanded(!followUpsExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-teal-100/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Bell className="h-3.5 w-3.5 text-teal-600" />
                            <span className="text-xs font-semibold text-slate-700">My Pending Follow-ups</span>
                            <span className="bg-teal-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {myFollowUps.length}
                            </span>
                        </div>
                        {followUpsExpanded ? (
                            <ChevronUp size={14} className="text-slate-500" />
                        ) : (
                            <ChevronDown size={14} className="text-slate-500" />
                        )}
                    </button>

                    {followUpsExpanded && (
                        <div className="px-3 pb-2.5 flex flex-wrap gap-2">
                            {myFollowUps.slice(0, 6).map((followUp: any) => (
                                <button
                                    key={followUp.id}
                                    onClick={() => router.push(`/app/follow-ups/${followUp.id}`)}
                                    className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 hover:shadow-sm hover:border-teal-300 transition-all text-left"
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${followUp.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                                        followUp.type === 'Email' ? 'bg-purple-100 text-purple-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                        {followUp.type === 'Call' && <Phone size={10} />}
                                        {followUp.type === 'Email' && <Mail size={10} />}
                                        {(followUp.type === 'WhatsApp' || followUp.type === 'SMS') && <MessageSquare size={10} />}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium text-slate-800 leading-tight">{followUp.studentName}</p>
                                        <p className="text-[10px] text-slate-500">{format(new Date(followUp.scheduledFor), 'MMM dd, HH:mm')}</p>
                                    </div>
                                </button>
                            ))}
                            {myFollowUps.length > 6 && (
                                <button
                                    onClick={() => router.push('/app/follow-ups')}
                                    className="flex items-center px-2.5 py-1.5 text-[11px] text-teal-600 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100 font-medium"
                                >
                                    +{myFollowUps.length - 6} more
                                </button>
                            )}
                        </div>
                    )}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                        <div className="flex flex-col items-center justify-center h-24 text-slate-400">
                                            <Circle size={20} className="mb-1 opacity-50" />
                                            <span className="text-xs">No tasks</span>
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
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[480px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl z-50 border border-slate-200 overflow-hidden outline-none">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-teal-100 rounded-lg text-teal-600">
                                    <Plus size={16} />
                                </div>
                                <div>
                                    <Dialog.Title className="text-sm font-bold text-slate-900">New Task</Dialog.Title>
                                    <p className="text-[11px] text-slate-500">Add to your board</p>
                                </div>
                            </div>
                            <Dialog.Close asChild>
                                <button className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                    <X size={16} />
                                </button>
                            </Dialog.Close>
                        </div>

                        <form onSubmit={handleCreateTask}>
                            <div className="p-5 space-y-4">
                                {/* Title */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-slate-600">Title</Label>
                                    <Input
                                        placeholder="What needs to be done?"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="h-9 text-sm"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-slate-600">Description</Label>
                                    <Textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Add details..."
                                        className="min-h-[70px] text-sm resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Assignee */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-600">Assign to</Label>
                                        <Select value={newTask.assignedTo} onValueChange={(val) => setNewTask({ ...newTask, assignedTo: val })}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.filter((u: any) => u.id !== user?.id).map((u: any) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                        {u.username}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-600">Priority</Label>
                                        <Select value={newTask.priority} onValueChange={(val: any) => setNewTask({ ...newTask, priority: val })}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Due Date */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-600">Due date</Label>
                                        <Input
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="h-9 text-sm"
                                            required
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-600">Status</Label>
                                        <Select value={newTask.status} onValueChange={(val) => setNewTask({ ...newTask, status: val })}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Todo">Todo</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="h-8 px-4 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-8 px-4 text-xs bg-teal-600 hover:bg-teal-700"
                                    disabled={createTaskMutation.isPending}
                                >
                                    {createTaskMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                        <Plus className="w-3 h-3 mr-1" />
                                    )}
                                    Create
                                </Button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Edit Task Modal */}
            <Dialog.Root open={isEditOpen} onOpenChange={setIsEditOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[520px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl z-50 border border-slate-200 overflow-hidden outline-none max-h-[85vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
                            <Dialog.Title className="text-sm font-bold text-slate-900">Edit Task</Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                    <X size={16} />
                                </button>
                            </Dialog.Close>
                        </div>

                        {editingTask && (
                            <Tabs defaultValue="details" className="w-full">
                                <div className="px-5 pt-3 border-b border-slate-100">
                                    <TabsList className="grid w-full grid-cols-2 h-8">
                                        <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                                        <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="details" className="mt-0">
                                    <form onSubmit={handleUpdateTask}>
                                        <div className="p-5 space-y-4">
                                            {/* Title */}
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium text-slate-600">Title</Label>
                                                <Input
                                                    value={editingTask.title}
                                                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                                    className="h-9 text-sm"
                                                    required
                                                />
                                            </div>

                                            {/* Description */}
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium text-slate-600">Description</Label>
                                                <Textarea
                                                    value={editingTask.description || ''}
                                                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                                    placeholder="Add details..."
                                                    className="min-h-[70px] text-sm resize-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Assignee */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-slate-600">Assign to</Label>
                                                    <Select
                                                        value={String(editingTask.assignedTo || editingTask.assigned_to || '')}
                                                        onValueChange={(val) => setEditingTask({ ...editingTask, assignedTo: parseInt(val) })}
                                                    >
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Select..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {users.map((u: any) => (
                                                                <SelectItem key={u.id} value={String(u.id)}>
                                                                    {u.username}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Priority */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-slate-600">Priority</Label>
                                                    <Select
                                                        value={editingTask.priority || 'Medium'}
                                                        onValueChange={(val: any) => setEditingTask({ ...editingTask, priority: val })}
                                                    >
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="High">High</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Due Date */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-slate-600">Due date</Label>
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
                                                        className="h-9 text-sm"
                                                        required
                                                    />
                                                </div>

                                                {/* Status */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-slate-600">Status</Label>
                                                    <Select
                                                        value={editingTask.status}
                                                        onValueChange={(val: any) => setEditingTask({ ...editingTask, status: val })}
                                                    >
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Todo">Todo</SelectItem>
                                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                                            <SelectItem value="Done">Done</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={() => setIsEditOpen(false)}
                                                className="h-8 px-4 text-xs"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="h-8 px-4 text-xs bg-teal-600 hover:bg-teal-700"
                                                disabled={updateTaskMutation.isPending}
                                            >
                                                {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </form>
                                </TabsContent>

                                <TabsContent value="history" className="mt-0 p-5">
                                    <h3 className="text-xs font-semibold text-slate-700 mb-3">Activity History</h3>
                                    <TaskHistory taskId={editingTask.id} />
                                </TabsContent>
                            </Tabs>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Move Reason Dialog */}
            <Dialog.Root open={moveReasonOpen} onOpenChange={(open) => !open && handleCancelMove()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[360px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-5 shadow-2xl z-50 border border-slate-200">
                        <Dialog.Title className="text-sm font-bold text-slate-900 mb-1">Move Reason</Dialog.Title>
                        <p className="text-xs text-slate-500 mb-4">Why is this task being moved?</p>

                        <div className="space-y-3">
                            <Textarea
                                placeholder="e.g., Completed the initial draft..."
                                value={moveReasonText}
                                onChange={(e) => setMoveReasonText(e.target.value)}
                                className="min-h-[60px] text-sm"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleCancelMove} className="flex-1 h-8 text-xs">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmMove}
                                    className="flex-1 h-8 text-xs bg-teal-600 hover:bg-teal-700"
                                    disabled={!moveReasonText.trim()}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
