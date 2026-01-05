'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentListProps {
    studentName: string;
}

export function DocumentList({ studentName }: DocumentListProps) {
    const { data: documents, isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: apiClient.documents.list,
    });

    const studentDocs = documents?.filter(d =>
        d.studentName?.toLowerCase() === studentName.toLowerCase()
    ) || [];

    if (isLoading) return <div className="text-sm text-slate-500">Loading documents...</div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Button size="sm">Upload Document</Button>
            </CardHeader>
            <CardContent>
                {studentDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentDocs.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{doc.fileName}</p>
                                        <p className="text-xs text-slate-500">Uploaded {format(new Date(doc.uploadedAt), 'dd MMM yyyy')}</p>
                                    </div>
                                </div>
                                {doc.file && (
                                    <Button variant="ghost" size="sm" onClick={() => window.open(doc.file, '_blank')}>
                                        <Download size={16} />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-slate-400" />
                            <p className="text-slate-500 font-medium">No documents found</p>
                            <p className="text-xs text-slate-400">Upload documents related to this student here</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
