'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search, Eye, Filter, UserCircle, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';

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
}

export default function StudentsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

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
                    program: e.courseInterested
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
                    status: r.paymentStatus === 'Paid' ? 'Registered' : 'Pending Payment', // Simplify status or use paymentStatus
                    program: r.preferences?.[0]?.courseName || 'N/A'
                });
            });
        }

        if (enrollments) {
            enrollments.forEach(en => {
                // Find matching registration to get contact info
                // Assuming en.studentId corresponds to registration.id
                // If IDs are numbers vs strings, ensure lenient comparison or conversion
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
                    program: en.programName
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

            const matchesType = typeFilter === 'all' || student.type.toLowerCase() === typeFilter.toLowerCase();

            return matchesSearch && matchesType;
        });
    }, [allStudents, searchTerm, typeFilter]);

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-heading">Students Directory</h1>
                    <p className="text-sm text-slate-500">View and manage all students across every stage</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase">Total Students</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </Card>
                <Card className="p-4 bg-blue-50 border-blue-100">
                    <p className="text-xs font-medium text-blue-600 uppercase">Enquiries</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.enquiries}</p>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-100">
                    <p className="text-xs font-medium text-purple-600 uppercase">Registered</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.registrations}</p>
                </Card>
                <Card className="p-4 bg-green-50 border-green-100">
                    <p className="text-xs font-medium text-green-600 uppercase">Enrolled</p>
                    <p className="text-2xl font-bold text-green-700">{stats.enrollments}</p>
                </Card>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name, email, or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 border-slate-300"
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-11 bg-white">
                        <Filter size={16} className="mr-2 text-slate-400" />
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="enquiry">Enquiry</SelectItem>
                        <SelectItem value="registration">Registration</SelectItem>
                        <SelectItem value="enrollment">Enrollment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Main Table */}
            <Card className="border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Student Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Stage</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 hidden md:table-cell">Contact</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 hidden lg:table-cell">Program/Interest</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 hidden xl:table-cell">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.uniqueId} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-lg
                                ${student.type === 'Enquiry' ? 'bg-blue-100 text-blue-600' :
                                                        student.type === 'Registration' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}
                                                >
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{student.name}</div>
                                                    <div className="text-xs text-slate-500 md:hidden">{student.program}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                              ${student.type === 'Enquiry' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    student.type === 'Registration' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-green-50 text-green-700 border-green-100'}`}
                                            >
                                                {student.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="space-y-1">
                                                {student.mobile ? (
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Phone size={12} className="text-slate-400" /> {student.mobile}
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs italic">No mobile</span>}
                                                {student.email ? (
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Mail size={12} className="text-slate-400" /> {student.email}
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs italic md:hidden lg:inline-block">No email</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-slate-600">
                                            {student.program || '-'}
                                        </td>
                                        <td className="px-6 py-4 hidden xl:table-cell text-slate-600">
                                            {student.date ? format(new Date(student.date), 'dd MMM yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                                                onClick={() => router.push(`/app/student-profile/${student.type.toLowerCase()}/${student.id}`)}
                                            >
                                                <Eye size={16} className="mr-2" /> View Profile
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <UserCircle size={48} className="mx-auto mb-4 text-slate-200" />
                                        <p className="font-medium">No students found matching your criteria</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs text-slate-500 flex justify-between">
                    <span>Showing {filteredStudents.length} of {stats.total} records</span>
                </div>
            </Card>
        </div>
    );
}
