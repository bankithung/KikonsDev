'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Search, CheckCircle, ArrowRightLeft, Printer, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document } from '@/lib/types';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentUpload } from '@/components/common/DocumentUpload';

export function DocumentList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegistrationId, setSelectedRegistrationId] = useState<string>('');
    const [studentSearch, setStudentSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    const { data: documents, isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: apiClient.documents.list,
    });

    const { data: registrations } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    const filteredRegistrations = registrations?.filter(reg =>
        reg.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        reg.registrationNo.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: 'IN' | 'OUT' }) => {
            return apiClient.documents.toggleStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    const filteredDocs = documents?.filter(doc =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const totalDocs = filteredDocs.length;
    const paginatedDocs = filteredDocs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const hasNext = (currentPage + 1) * PAGE_SIZE < totalDocs;
    const hasPrev = currentPage > 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content: Document List (Takes 3 cols on desktop) */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search documents or student names..."
                                className="pl-10 h-10 border-none bg-transparent focus-visible:ring-0 shadow-none text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                            <span className="text-xs text-slate-400 font-medium mr-2 whitespace-nowrap">
                                {totalDocs} total files
                            </span>
                            <div className="flex items-center gap-1 border-l border-slate-100 pl-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-slate-100 rounded-lg"
                                    disabled={!hasPrev}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    <ChevronLeft size={16} className="text-slate-600" />
                                </Button>
                                <span className="text-[12px] font-bold text-slate-700 min-w-[16px] text-center">
                                    {currentPage + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-slate-100 rounded-lg"
                                    disabled={!hasNext}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    <ChevronRight size={16} className="text-slate-600" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="space-y-3">
                                    <div className="h-6 w-32 bg-slate-100 animate-pulse mx-auto rounded"></div>
                                    <div className="h-4 w-48 bg-slate-50 animate-pulse mx-auto rounded"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">File Name</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Student</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Uploaded At</th>
                                            <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedDocs.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50/80 transition-all group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-slate-900 truncate max-w-[200px]">{doc.fileName}</span>
                                                            <span className="text-[11px] text-slate-400 capitalize md:hidden">{doc.studentName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className="text-slate-600 font-medium">{doc.studentName || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${doc.status === 'IN'
                                                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                            : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                                                        }`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full ${doc.status === 'IN' ? 'bg-green-600' : 'bg-amber-600'}`} />
                                                        {doc.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    <span className="text-slate-500 text-[12px]">{format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors"
                                                        onClick={() => {
                                                            const newStatus = doc.status === 'IN' ? 'OUT' : 'IN';
                                                            toggleStatusMutation.mutate({ id: doc.id, status: newStatus });
                                                        }}
                                                    >
                                                        <ArrowRightLeft size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedDocs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-16 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Search className="h-8 w-8 text-slate-200" />
                                                        <p className="text-slate-400 font-medium">No documents found matching your search</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Uploader (Sticky on desktop) */}
                <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Upload Document</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Select Student</Label>
                                <Select value={selectedRegistrationId} onValueChange={setSelectedRegistrationId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a student..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <div className="p-2">
                                            <Input
                                                placeholder="Search students..."
                                                className="h-8"
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                onKeyDown={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        {filteredRegistrations?.length === 0 ? (
                                            <div className="p-2 text-sm text-slate-500 text-center">No students found</div>
                                        ) : (
                                            filteredRegistrations?.map((reg) => (
                                                <SelectItem key={reg.id} value={reg.id}>
                                                    {reg.studentName} ({reg.registrationNo})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedRegistrationId && (
                                <div className="pt-2">
                                    <Label className="text-slate-700 font-medium mb-2 block">Documents</Label>
                                    <DocumentUpload
                                        registrationId={selectedRegistrationId}
                                        initialDocuments={[]}
                                        onDocumentsChange={() => {
                                            queryClient.invalidateQueries({ queryKey: ['documents'] });
                                        }}
                                        onUploadSuccess={() => {
                                            setSelectedRegistrationId('');
                                            queryClient.invalidateQueries({ queryKey: ['documents'] });
                                        }}
                                    />
                                </div>
                            )}

                            {!selectedRegistrationId && (
                                <div className="text-sm text-slate-500 text-center py-4 border-2 border-dashed rounded-lg">
                                    Select a student to start uploading documents
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
