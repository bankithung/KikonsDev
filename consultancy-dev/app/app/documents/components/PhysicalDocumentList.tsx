'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FolderOpen, Search, ChevronLeft, ChevronRight, RotateCcw, User, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { TransferModal } from './TransferModal';
import { StudentDocument } from '@/lib/types';

export function PhysicalDocumentList() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 15;

    // Transfer State
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<StudentDocument | any | null>(null);

    const { data: documents, isLoading } = useQuery({
        queryKey: ['student-documents-all'],
        queryFn: () => apiClient.studentDocuments.list(),
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

    // Create a map of registration ID to student name
    const regMap = registrations?.reduce((acc: Record<number, string>, reg) => {
        acc[parseInt(reg.id)] = reg.studentName;
        return acc;
    }, {}) || {};

    const returnDocsMutation = useMutation({
        mutationFn: (docIds: string[]) => apiClient.studentDocuments.returnDocs(docIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-documents-all'] });
            toast.success('Document marked as returned');
        },
        onError: () => {
            toast.error('Failed to return document');
        }
    });

    const createTransferMutation = useMutation({
        mutationFn: (data: { receiver: string; documents: string[]; message: string }) =>
            apiClient.physicalTransfers.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-documents-all'] });
            toast.success('Transfer initiated successfully');
            setTransferModalOpen(false);
            setSelectedDoc(null);
        },
        onError: () => {
            toast.error('Failed to initiate transfer');
        }
    });

    const filteredDocs = documents?.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        regMap[doc.registration]?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const totalDocs = filteredDocs.length;
    const paginatedDocs = filteredDocs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const hasNext = (currentPage + 1) * PAGE_SIZE < totalDocs;
    const hasPrev = currentPage > 0;
    const totalPages = Math.ceil(totalDocs / PAGE_SIZE) || 1;

    return (
        <div className="space-y-3">
            {/* Search & Pagination Bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by document name or student..."
                        className="pl-10 h-9 bg-white border-slate-200 focus-visible:ring-teal-500/20 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                    <span className="text-xs text-slate-500 font-medium px-2">
                        {totalDocs} docs
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
                        <div className="animate-pulse text-slate-500 text-sm">Loading physical documents...</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Document Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Doc Number</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">Received</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {paginatedDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 bg-orange-50 text-orange-600 rounded flex items-center justify-center shrink-0">
                                                    <FolderOpen size={14} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-slate-900 truncate max-w-[160px] text-sm">{doc.name}</span>
                                                    {doc.remarks && (
                                                        <span className="text-xs text-slate-400 truncate max-w-[160px]">{doc.remarks}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-1.5">
                                                <User size={12} className="text-slate-400" />
                                                <span className="text-slate-600 text-sm">{regMap[doc.registration] || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 hidden md:table-cell">
                                            <span className="text-slate-500 text-xs font-mono">{doc.documentNumber || '-'}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${doc.status === 'Held'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                <div className={`h-1.5 w-1.5 rounded-full ${doc.status === 'Held' ? 'bg-blue-600' : 'bg-green-600'}`} />
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 hidden lg:table-cell">
                                            <span className="text-slate-500 text-xs">
                                                {doc.receivedAt ? format(new Date(doc.receivedAt), 'dd MMM yyyy') : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {doc.status === 'Held' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 hover:bg-green-50 hover:text-green-600 rounded text-xs gap-1"
                                                    onClick={() => returnDocsMutation.mutate([doc.id])}
                                                    disabled={returnDocsMutation.isPending}
                                                >
                                                    <RotateCcw size={12} />
                                                    Return
                                                </Button>
                                            )}
                                            {doc.status === 'Returned' && (
                                                <span className="text-xs text-slate-400">
                                                    {doc.returnedAt ? format(new Date(doc.returnedAt), 'dd MMM') : 'Returned'}
                                                </span>
                                            )}

                                            {doc.status === 'Held' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 hover:bg-teal-50 hover:text-teal-600 rounded text-xs gap-1 ml-1"
                                                    onClick={() => {
                                                        setSelectedDoc(doc);
                                                        setTransferModalOpen(true);
                                                    }}
                                                >
                                                    <Send size={12} />
                                                    Transfer
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {paginatedDocs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                            <FolderOpen className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm font-medium">No physical documents found</p>
                                            <p className="text-xs text-slate-400 mt-1">Physical documents are added from student profiles</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>


            {selectedDoc && (
                <TransferModal
                    isOpen={transferModalOpen}
                    onClose={() => {
                        setTransferModalOpen(false);
                        setSelectedDoc(null);
                    }}
                    documentName={selectedDoc.name}
                    studentName={regMap[selectedDoc.registration] || 'Unknown'}
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

        </div >
    );
}
