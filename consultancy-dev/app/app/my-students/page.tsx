'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Users,
    Search,
    Filter,
    ArrowRightLeft,
    UserPlus,
    GraduationCap,
    MessageSquare,
    Phone,
    Mail,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    AlertCircle,
    Clock,
    CheckCircle2,
    Loader2,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { cn, COURSES } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from '@/store/toastStore';

type StudentType = 'enquiry' | 'registration';

interface StudentItem {
    id: string;
    type: StudentType;
    name: string;
    email: string;
    phone: string;
    course?: string;
    status: string;
    date: string;
    originalData: any;
}

export default function MyStudentsPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const userId = user?.id;

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'enquiry' | 'registration'>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferTo, setTransferTo] = useState<string>('');
    const [transferNote, setTransferNote] = useState('');

    // Fetch data
    const { data: allEnquiries = [], isLoading: enquiriesLoading } = useQuery({
        queryKey: ['enquiries'],
        queryFn: apiClient.enquiries.list,
    });

    const { data: allRegistrations = [], isLoading: registrationsLoading } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['users'],
        queryFn: apiClient.users.list,
    });

    // Filter users from same company (excluding current user)
    const companyUsers = useMemo(() => {
        return allUsers.filter((u: any) =>
            u.company_id === user?.company_id &&
            u.id !== userId &&
            u.role !== 'DEV_ADMIN'
        );
    }, [allUsers, user?.company_id, userId]);

    // Filter my students
    const myEnquiries = useMemo(() => {
        return allEnquiries.filter((e: any) => e.created_by === userId);
    }, [allEnquiries, userId]);

    const myRegistrations = useMemo(() => {
        return allRegistrations.filter((r: any) => r.created_by === userId);
    }, [allRegistrations, userId]);

    // Combine and normalize students
    const allStudents: StudentItem[] = useMemo(() => {
        const enquiryItems: StudentItem[] = myEnquiries.map((e: any) => ({
            id: `enquiry-${e.id}`,
            type: 'enquiry' as StudentType,
            name: e.candidateName || e.candidate_name || '-',
            email: e.email || '-',
            phone: e.mobile || '-',
            course: e.courseInterested || e.course_interested || '-',
            status: e.status || 'New',
            date: e.date || e.created_at || new Date().toISOString(),
            originalData: e,
        }));

        const registrationItems: StudentItem[] = myRegistrations.map((r: any) => ({
            id: `registration-${r.id}`,
            type: 'registration' as StudentType,
            name: r.studentName || r.student_name || '-',
            email: r.email || '-',
            phone: r.mobile || '-',
            course: r.preferences?.[0]?.courseName || '-',
            status: r.paymentStatus || r.payment_status || 'Pending',
            date: r.registrationDate || r.registration_date || r.created_at || new Date().toISOString(),
            originalData: r,
        }));

        return [...enquiryItems, ...registrationItems].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [myEnquiries, myRegistrations]);

    // Apply filters
    const filteredStudents = useMemo(() => {
        return allStudents.filter(student => {
            const matchesSearch = !searchQuery ||
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.phone.includes(searchQuery);

            const matchesType = typeFilter === 'all' || student.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
            const matchesCourse = courseFilter === 'all' || student.course === courseFilter;

            return matchesSearch && matchesType && matchesStatus && matchesCourse;
        });
    }, [allStudents, searchQuery, typeFilter, statusFilter, courseFilter]);

    // Get unique statuses for filter
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(allStudents.map(s => s.status));
        return Array.from(statuses);
    }, [allStudents]);

    // Get unique courses for filter
    const uniqueCourses = useMemo(() => {
        const courses = new Set(allStudents.map(s => s.course).filter(c => c && c !== '-'));
        return Array.from(courses).sort();
    }, [allStudents]);

    // Stats
    const stats = useMemo(() => ({
        total: allStudents.length,
        enquiries: myEnquiries.length,
        registrations: myRegistrations.length,
        newEnquiries: myEnquiries.filter((e: any) => e.status === 'New').length,
    }), [allStudents, myEnquiries, myRegistrations]);

    // Transfer mutation
    const transferMutation = useMutation({
        mutationFn: async ({ students, toUserId }: { students: StudentItem[], toUserId: number }) => {
            const promises = students.map(async (student) => {
                const realId = student.id.split('-')[1];
                if (student.type === 'enquiry') {
                    return apiClient.enquiries.update(realId, {
                        ...student.originalData,
                        created_by: toUserId
                    });
                } else {
                    return apiClient.registrations.update(realId, {
                        ...student.originalData,
                        created_by: toUserId
                    });
                }
            });
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            queryClient.invalidateQueries({ queryKey: ['registrations'] });
            setIsTransferOpen(false);
            setSelectedStudents([]);
            setTransferTo('');
            setTransferNote('');
            toast.success('Students transferred successfully!');
        },
        onError: (error) => {
            console.error('Transfer failed:', error);
            toast.error('Failed to transfer students. Please try again.');
        }
    });

    const handleTransfer = () => {
        if (!transferTo || selectedStudents.length === 0) return;

        const studentsToTransfer = allStudents.filter(s => selectedStudents.includes(s.id));
        transferMutation.mutate({
            students: studentsToTransfer,
            toUserId: parseInt(transferTo)
        });
    };

    const toggleStudentSelection = (id: string) => {
        setSelectedStudents(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id));
        }
    };

    const isLoading = enquiriesLoading || registrationsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="text-sm text-slate-500">Loading your students...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                />
            </div>

            {/* Compact Stats - Same as Students Page */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white border border-slate-200 rounded p-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-medium text-slate-500 uppercase">Total Students</span>
                    <span className="text-lg font-bold text-slate-900">{stats.total}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded p-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-medium text-blue-600 uppercase">Enquiries</span>
                    <span className="text-lg font-bold text-blue-700">{stats.enquiries}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded p-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-medium text-emerald-600 uppercase">Registrations</span>
                    <span className="text-lg font-bold text-emerald-700">{stats.registrations}</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded p-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-medium text-amber-600 uppercase">New Leads</span>
                    <span className="text-lg font-bold text-amber-700">{stats.newEnquiries}</span>
                </div>
            </div>

            {/* Filters Panel - Same as Students Page */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {/* Type Filter */}
                    <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="enquiry">Enquiries</SelectItem>
                            <SelectItem value="registration">Registrations</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Converted">Converted</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Course Filter */}
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue placeholder="Course" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            <SelectItem value="all">All Courses</SelectItem>
                            {COURSES.map(course => (
                                <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Transfer Button */}
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs"
                        disabled={selectedStudents.length === 0}
                        onClick={() => setIsTransferOpen(true)}
                    >
                        <ArrowRightLeft size={14} className="mr-1" /> Transfer ({selectedStudents.length})
                    </Button>

                    {/* Clear Button */}
                    <Button
                        size="sm"
                        className="h-9 text-xs bg-slate-600 hover:bg-slate-700 text-white"
                        onClick={() => {
                            setTypeFilter('all');
                            setStatusFilter('all');
                            setCourseFilter('all');
                            setSearchQuery('');
                        }}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Student Table */}
            <Card className="border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-3 py-2.5 text-left">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                            onChange={toggleAllSelection}
                                            className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                        />
                                        <span className="text-[11px] font-semibold text-slate-600 uppercase">Student</span>
                                    </div>
                                </th>
                                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Type</th>
                                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase hidden md:table-cell">Contact</th>
                                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase hidden lg:table-cell">Course</th>
                                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Status</th>
                                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</th>
                                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-600 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-3 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Users size={32} className="opacity-50" />
                                            <p className="text-sm">No students found</p>
                                            <p className="text-xs">Try adjusting your filters or add new enquiries</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className={cn(
                                            "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                                            selectedStudents.includes(student.id) && "bg-teal-50"
                                        )}
                                    >
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student.id)}
                                                    onChange={() => toggleStudentSelection(student.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                                />
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs
                                                    ${student.type === 'enquiry' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}
                                                >
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{student.name}</p>
                                                    <p className="text-[10px] text-slate-500 md:hidden">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={cn(
                                                "text-[10px] font-medium px-2 py-1 rounded-full",
                                                student.type === 'enquiry'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            )}>
                                                {student.type === 'enquiry' ? 'Enquiry' : 'Registration'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 hidden md:table-cell">
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-slate-600 flex items-center gap-1">
                                                    <Mail size={10} className="text-slate-400" />
                                                    {student.email}
                                                </p>
                                                <p className="text-xs text-slate-600 flex items-center gap-1">
                                                    <Phone size={10} className="text-slate-400" />
                                                    {student.phone}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 hidden lg:table-cell">
                                            <p className="text-xs text-slate-600 truncate max-w-[150px]">{student.course}</p>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={cn(
                                                "text-[10px] font-medium px-2 py-1 rounded-full",
                                                student.status === 'New' && 'bg-blue-100 text-blue-700',
                                                student.status === 'Converted' && 'bg-emerald-100 text-emerald-700',
                                                student.status === 'Closed' && 'bg-red-100 text-red-700',
                                                student.status === 'Paid' && 'bg-emerald-100 text-emerald-700',
                                                student.status === 'Pending' && 'bg-amber-100 text-amber-700',
                                                student.status === 'Partial' && 'bg-purple-100 text-purple-700',
                                            )}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 hidden sm:table-cell">
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(student.date), 'MMM d, yyyy')}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <Link
                                                href={`/app/student-profile/${student.type}/${student.originalData.id}`}
                                                className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                                            >
                                                View <ExternalLink size={12} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                {filteredStudents.length > 0 && (
                    <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Showing {filteredStudents.length} of {allStudents.length} students
                        </p>
                        {selectedStudents.length > 0 && (
                            <p className="text-xs text-teal-600 font-medium">
                                {selectedStudents.length} selected
                            </p>
                        )}
                    </div>
                )}
            </Card>

            {/* Transfer Dialog */}
            <Dialog.Root open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[420px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl z-50 border border-slate-200 overflow-hidden outline-none">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-teal-100 rounded-lg text-teal-600">
                                    <ArrowRightLeft size={16} />
                                </div>
                                <div>
                                    <Dialog.Title className="text-sm font-bold text-slate-900">Transfer Students</Dialog.Title>
                                    <p className="text-[11px] text-slate-500">Hand over to another team member</p>
                                </div>
                            </div>
                            <Dialog.Close asChild>
                                <button className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                    <X size={16} />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Selected Students Summary */}
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-xs font-medium text-slate-700 mb-2">
                                    Transferring {selectedStudents.length} student(s):
                                </p>
                                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                                    {allStudents
                                        .filter(s => selectedStudents.includes(s.id))
                                        .map(student => (
                                            <span
                                                key={student.id}
                                                className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                                    student.type === 'enquiry'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                )}
                                            >
                                                {student.name}
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Transfer To */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Transfer To</Label>
                                <Select value={transferTo} onValueChange={setTransferTo}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select team member..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companyUsers.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-slate-500">
                                                No team members available
                                            </div>
                                        ) : (
                                            companyUsers.map((u: any) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                            {(u.first_name || u.username).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">{u.first_name || u.username}</span>
                                                            {u.role && (
                                                                <span className="text-slate-400 text-xs ml-1">({u.role})</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Note */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Note (Optional)</Label>
                                <Input
                                    placeholder="Add a note for the transfer..."
                                    value={transferNote}
                                    onChange={(e) => setTransferNote(e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            {/* Warning */}
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800">
                                    Once transferred, these students will appear under the selected team member's account. You will no longer see them in your list.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsTransferOpen(false)}
                                className="h-8 px-4 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleTransfer}
                                className="h-8 px-4 text-xs bg-teal-600 hover:bg-teal-700"
                                disabled={!transferTo || transferMutation.isPending}
                            >
                                {transferMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                        Transferring...
                                    </>
                                ) : (
                                    <>
                                        <ArrowRightLeft className="w-3 h-3 mr-1" />
                                        Transfer Students
                                    </>
                                )}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
