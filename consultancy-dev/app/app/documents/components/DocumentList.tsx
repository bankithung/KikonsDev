'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Search, CheckCircle, ArrowRightLeft, Printer, Filter } from 'lucide-react';
import { Document } from '@/lib/types';
import { format } from 'date-fns';

export function DocumentList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('General');
    const [studentName, setStudentName] = useState('');

    const { data: documents, isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: apiClient.documents.list,
    });

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile) return;
            return apiClient.documents.uploadMock({ name: selectedFile.name }, docType, studentName);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            setSelectedFile(null);
            setStudentName('');
            alert('Document Uploaded Successfully');
        },
    });

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
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">All Documents</h2>
                    <p className="text-sm text-slate-600 mt-1">Upload and manage student documents</p>
                </div>
                <Button variant="outline" size="sm" className="h-9 hidden sm:inline-flex">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Document List (Takes 2 cols on desktop) */}
                <div className="lg:col-span-2 flex flex-col space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search documents or students..."
                            className="pl-10 h-11 border-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Card className="border-slate-200 flex-1">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">All Documents</CardTitle>
                                <span className="text-sm text-slate-500">{filteredDocs?.length || 0} files</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-8 text-center text-slate-500">Loading...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">File</th>
                                                <th className="px-4 py-3 hidden md:table-cell">Student</th>
                                                <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 hidden lg:table-cell">Date</th>
                                                <th className="px-4 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredDocs?.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={16} className="text-teal-500 shrink-0" />
                                                            <span className="font-medium text-slate-900 truncate">{doc.fileName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{doc.studentName || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{doc.type}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${doc.status === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {doc.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                                                        {format(new Date(doc.uploadedAt), 'dd MMM')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => {
                                                                const newStatus = doc.status === 'IN' ? 'OUT' : 'IN';
                                                                toggleStatusMutation.mutate({ id: doc.id, status: newStatus });
                                                            }}
                                                            title="Toggle Status"
                                                        >
                                                            <ArrowRightLeft size={14} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredDocs?.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-slate-500">No documents found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Uploader (Sticky on desktop) */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Upload Document</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Student Name</Label>
                                <Input
                                    placeholder="Search student..."
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Document Type</Label>
                                <select
                                    className="w-full h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                >
                                    <option value="General">General</option>
                                    <option value="Marksheet">Marksheet</option>
                                    <option value="ID Proof">ID Proof</option>
                                    <option value="Certificate">Certificate</option>
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-teal-300 transition-all cursor-pointer relative group">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                />
                                <Upload className="mx-auto h-10 w-10 text-slate-400 group-hover:text-teal-500 transition-colors mb-2" />
                                <p className="text-sm font-medium text-slate-600">
                                    {selectedFile ? selectedFile.name : "Drop file or click to upload"}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">PDF, DOC, JPG up to 10MB</p>
                            </div>

                            <Button
                                className="w-full h-11 bg-teal-600 hover:bg-teal-700 font-semibold"
                                disabled={!selectedFile || uploadMutation.isPending}
                                onClick={() => uploadMutation.mutate()}
                            >
                                {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
