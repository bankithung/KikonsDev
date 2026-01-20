'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search, ExternalLink, Filter, UserCircle, Phone, Mail, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { GENDERS, COURSES, INDIAN_STATES, SCHOOL_BOARDS, PREFERRED_LOCATIONS } from '@/lib/utils';

// Normalized Student Interface for the list
interface StudentRow {
    uniqueId: string; // composite key
    id: string | number;
    type: 'Enquiry' | 'Registration' | 'Enrollment';
    name: string;
    email: string;
    mobile: string;
    date: string | Date; // Enquiry Date / Reg Date / Start Date
    status: string;
    program?: string; // For interest/program
    gender?: string;
    state?: string;
    created_by_name?: string;
}

export default function StudentsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter States
    const [filterStage, setFilterStage] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterGender, setFilterGender] = useState('all');
    const [filterState, setFilterState] = useState('all');
    const [filterCourse, setFilterCourse] = useState('all');
    const [filterProgram, setFilterProgram] = useState('all'); // Usually same as course
    const [filterLocation, setFilterLocation] = useState('all');

    // Fetch all data sources
    const { data: enquiries, isLoading: loadingEnquiries } = useQuery({
        queryKey: ['enquiries'],
        queryFn: apiClient.enquiries.list,
    });

    const { data: registrations, isLoading: loadingRegistrations } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
        queryKey: ['enrollments'],
        queryFn: apiClient.enrollments.list,
    });

    const isLoading = loadingEnquiries || loadingRegistrations || loadingEnrollments;

    // Combine and Normalize Data
    const allStudents: StudentRow[] = useMemo(() => {
        const list: StudentRow[] = [];

        if (enquiries) {
            enquiries.forEach(e => {
                list.push({
                    uniqueId: `enq-${e.id}`,
                    id: e.id,
                    type: 'Enquiry',
                    name: e.candidateName,
                    email: e.email,
                    mobile: e.mobile,
                    date: e.date,
                    status: e.status,
                    program: e.courseInterested,
                    gender: e.gender,
                    state: e.familyState,
                    created_by_name: e.created_by_name
                });
            });
        }

        if (registrations) {
            registrations.forEach(r => {
                list.push({
                    uniqueId: `reg-${r.id}`,
                    id: r.id,
                    type: 'Registration',
                    name: r.studentName,
                    email: r.email,
                    mobile: r.mobile,
                    date: r.registrationDate,
                    status: r.paymentStatus === 'Paid' ? 'Registered' : 'Pending Payment',
                    program: r.preferences?.[0]?.courseName || 'N/A',
                    gender: r.gender, // Assuming avail or undefined
                    state: r.familyState,
                    created_by_name: r.created_by_name // Assuming avail
                });
            });
        }

        if (enrollments) {
            enrollments.forEach(en => {
                const linkedReg = registrations?.find(r => String(r.id) === String(en.studentId));
                list.push({
                    uniqueId: `enr-${en.id}`,
                    id: en.id,
                    type: 'Enrollment',
                    name: en.studentName,
                    email: linkedReg?.email || '',
                    mobile: linkedReg?.mobile || '',
                    date: en.startDate,
                    status: en.status,
                    program: en.programName,
                    gender: linkedReg?.gender,
                    state: linkedReg?.familyState,
                    created_by_name: en.created_by_name // Assuming avail
                });
            });
        }

        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [enquiries, registrations, enrollments]);


    // Filtering Logic
    const filteredStudents = useMemo(() => {
        return allStudents.filter(student => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.mobile.includes(searchTerm);

            const matchesStage = filterStage === 'all' || student.type.toLowerCase() === filterStage.toLowerCase();
            const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
            const matchesGender = filterGender === 'all' || student.gender === filterGender;
            const matchesState = filterState === 'all' || student.state === filterState;
            // For course/program we check generic program field
            const matchesProgram = filterProgram === 'all' || (student.program && student.program === filterProgram);

            return matchesSearch && matchesStage && matchesStatus && matchesGender && matchesState && matchesProgram;
        });
    }, [allStudents, searchTerm, filterStage, filterStatus, filterGender, filterState, filterProgram]);

    // Statistics
    const stats = {
        total: allStudents.length,
        enquiries: allStudents.filter(s => s.type === 'Enquiry').length,
        registrations: allStudents.filter(s => s.type === 'Registration').length,
        enrollments: allStudents.filter(s => s.type === 'Enrollment').length,
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className="text-slate-500 text-sm">Loading complete student directory...</p>
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
                    placeholder="Search by name, email, or mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                />
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white border border-slate-200 rounded p-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-medium text-slate-500 uppercase">Total Students</span>
                    <span className="text-lg font-bold text-slate-900">{stats.total}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded p-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-medium text-blue-600 uppercase">Enquiries</span>
                    <span className="text-lg font-bold text-blue-700">{stats.enquiries}</span>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded p-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-medium text-purple-600 uppercase">Registered</span>
                    <span className="text-lg font-bold text-purple-700">{stats.registrations}</span>
                </div>
                <div className="bg-green-50 border border-green-100 rounded p-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-medium text-green-600 uppercase">Enrolled</span>
                    <span className="text-lg font-bold text-green-700">{stats.enrollments}</span>
                </div>
            </div>

            {/* Filters Panel */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    <Select value={filterStage} onValueChange={setFilterStage}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue placeholder="Stage" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stages</SelectItem>
                            <SelectItem value="Enquiry">Enquiry</SelectItem>
                            <SelectItem value="Registration">Registration</SelectItem>
                            <SelectItem value="Enrollment">Enrollment</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Converted">Converted</SelectItem>
                            <SelectItem value="Registered">Registered</SelectItem>
                            <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterGender} onValueChange={setFilterGender}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Genders</SelectItem>
                            {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterState} onValueChange={setFilterState}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            <SelectItem value="all">All States</SelectItem>
                            {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue placeholder="Program" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            <SelectItem value="all">All Programs</SelectItem>
                            {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Button
                        size="sm"
                        className="h-9 text-xs bg-slate-600 hover:bg-slate-700 text-white"
                        onClick={() => {
                            setFilterStage('all');
                            setFilterStatus('all');
                            setFilterGender('all');
                            setFilterState('all');
                            setFilterProgram('all');
                        }}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Main Table */}
            <Card className="border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider">Student Name</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider">Stage</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Contact</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden lg:table-cell">Program</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden xl:table-cell">Date</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden xl:table-cell">Created By</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.uniqueId} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs
                                ${student.type === 'Enquiry' ? 'bg-blue-100 text-blue-600' :
                                                        student.type === 'Registration' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}
                                                >
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-slate-900">{student.name}</div>
                                                    <div className="text-xs text-slate-500 md:hidden">{student.program}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border
                              ${student.type === 'Enquiry' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    student.type === 'Registration' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-green-50 text-green-700 border-green-100'}`}
                                            >
                                                {student.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 hidden md:table-cell">
                                            <div className="space-y-0.5">
                                                {student.mobile ? (
                                                    <div className="flex items-center gap-1 text-slate-600 text-xs">
                                                        <Phone size={11} className="text-slate-400" /> {student.mobile}
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs italic">No mobile</span>}
                                                {student.email ? (
                                                    <div className="flex items-center gap-1 text-slate-600 text-xs">
                                                        <Mail size={11} className="text-slate-400" /> {student.email}
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs italic md:hidden lg:inline-block">No email</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 hidden lg:table-cell text-slate-600 text-xs font-medium">
                                            {student.program || '-'}
                                        </td>
                                        <td className="px-4 py-2 hidden xl:table-cell text-slate-600 text-xs">
                                            {student.date ? format(new Date(student.date), 'dd MMM yyyy') : '-'}
                                        </td>
                                        <td className="px-4 py-2 hidden xl:table-cell text-slate-600 text-xs">
                                            <div className="flex items-center gap-1">
                                                <UserCircle size={12} className="text-slate-400" />
                                                {student.created_by_name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button
                                                onClick={() => router.push(`/app/student-profile/${student.type.toLowerCase()}/${student.id}`)}
                                                className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                                            >
                                                View <ExternalLink size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <UserCircle size={48} className="mx-auto mb-4 text-slate-200" />
                                        <p className="font-medium">No students found matching your criteria</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 flex justify-between">
                    <span>Showing {filteredStudents.length} of {stats.total} records</span>
                </div>
            </Card>
        </div >
    );
}
