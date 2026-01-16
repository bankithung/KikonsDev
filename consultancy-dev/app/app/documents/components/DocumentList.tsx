'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, Search, ChevronLeft, ChevronRight, Send, Printer } from 'lucide-react';
import { Document } from '@/lib/types';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { TransferModal } from './TransferModal';


export function DocumentList() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegistrationId, setSelectedRegistrationId] = useState<string>('');
    const [studentSearch, setStudentSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 12;

    // Transfer Modal State
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);


    const { data: documents, isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: apiClient.documents.list,
    });

    const { data: registrations } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: apiClient.users.list,
    });

    const filteredUsers = users?.filter((u: any) => u.id !== currentUser?.id) || [];

    const filteredRegistrations = registrations?.filter(reg =>
        reg.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        reg.registrationNo.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const createTransferMutation = useMutation({
        mutationFn: (data: { receiver: string; documents: string[]; message: string }) =>
            apiClient.documentTransfers.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['document-transfers'] });
            toast.success('Transfer initiated successfully');
            setTransferModalOpen(false);
            setSelectedDoc(null);
        },
        onError: () => {
            toast.error('Failed to initiate transfer');
        }
    });



    const handlePrint = (doc: Document) => {
        if (doc.file) {
            const printWindow = window.open(doc.file, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } else {
            toast.error('No file available to print');
        }
    };

    const filteredDocs = documents?.filter(doc =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const totalDocs = filteredDocs.length;
    const paginatedDocs = filteredDocs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const hasNext = (currentPage + 1) * PAGE_SIZE < totalDocs;
    const hasPrev = currentPage > 0;
    const totalPages = Math.ceil(totalDocs / PAGE_SIZE) || 1;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Main Content: Document List */}
                <div className="lg:col-span-3 space-y-3">
                    {/* Search & Pagination Bar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search documents or student names..."
                                className="pl-10 h-9 bg-white border-slate-200 focus-visible:ring-teal-500/20 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                            <span className="text-xs text-slate-500 font-medium px-2">
                                {totalDocs} files
                            </span>
                            <div className="flex items-center gap-0.5 border-l border-slate-100 pl-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-slate-100 rounded"
                                    disabled={!hasPrev}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    <ChevronLeft size={14} className="text-slate-600" />
                                </Button>
                                <span className="text-xs font-medium text-slate-600 min-w-[40px] text-center">
                                    {currentPage + 1}/{totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-slate-100 rounded"
                                    disabled={!hasNext}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    <ChevronRight size={14} className="text-slate-600" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <Card className="border-slate-200">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="animate-pulse text-slate-500 text-sm">Loading documents...</div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">File Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Student</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">Holder</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {paginatedDocs.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-7 w-7 bg-teal-50 text-teal-600 rounded flex items-center justify-center shrink-0">
                                                            <FileText size={14} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium text-slate-900 truncate max-w-[160px] text-sm">{doc.fileName}</span>
                                                            <span className="text-xs text-slate-400 md:hidden">{doc.studentName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 hidden md:table-cell">
                                                    <span className="text-slate-600 text-sm">{doc.studentName || '-'}</span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${doc.status === 'IN'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full ${doc.status === 'IN' ? 'bg-green-600' : 'bg-amber-600'}`} />
                                                        {doc.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 hidden lg:table-cell">
                                                    <span className="text-slate-500 text-xs">{doc.currentHolderName || doc.uploadedByName || '-'}</span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 hover:bg-slate-100 hover:text-slate-600 rounded"
                                                            onClick={() => handlePrint(doc)}
                                                            title="Print"
                                                        >
                                                            <Printer size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 hover:bg-teal-50 hover:text-teal-600 rounded"
                                                            onClick={() => {
                                                                setSelectedDoc(doc);
                                                                setTransferModalOpen(true);
                                                            }}
                                                            title="Transfer"
                                                            disabled={doc.status === 'OUT'}
                                                        >
                                                            <Send size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedDocs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                                                    <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                                    <p className="text-sm font-medium">No documents found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right: Uploader (Sticky on desktop) */}
                <div className="lg:sticky lg:top-20 lg:self-start">
                    <Card className="border-slate-200">
                        <CardHeader className="py-3 px-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold">Upload Document</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Select Student</Label>
                                <Select value={selectedRegistrationId} onValueChange={setSelectedRegistrationId}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Select a student..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[250px]">
                                        <div className="p-2">
                                            <Input
                                                placeholder="Search students..."
                                                className="h-8 text-sm"
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
                                                    <span className="text-sm">{reg.studentName}</span>
                                                    <span className="text-xs text-slate-400 ml-1">({reg.registrationNo})</span>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedRegistrationId && (
                                <div className="pt-1">
                                    <Label className="text-xs font-medium text-slate-600 mb-2 block">Documents</Label>
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
                                <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">
                                    Select a student to upload documents
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Transfer Modal */}
            {selectedDoc && (
                <TransferModal
                    isOpen={transferModalOpen}
                    onClose={() => {
                        setTransferModalOpen(false);
                        setSelectedDoc(null);
                    }}
                    documentName={selectedDoc.fileName}
                    studentName={selectedDoc.studentName || ''}
                    users={filteredUsers}
                    isPending={createTransferMutation.isPending}
                    onTransfer={(receiverId, message) => {
                        createTransferMutation.mutate({
                            receiver: receiverId,
                            documents: [selectedDoc.id],
                            message
                        });
                    }}
                />
            )}
        </div>
    );
}


