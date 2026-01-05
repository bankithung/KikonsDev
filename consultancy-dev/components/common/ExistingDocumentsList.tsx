import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export function ExistingDocumentsList({ studentId }: { studentId: string }) {
    const { data: documents, isLoading } = useQuery({
        queryKey: ['documents', studentId],
        queryFn: apiClient.documents.list,
        enabled: !!studentId,
    });

    if (isLoading) return <div className="text-sm text-slate-500">Loading documents...</div>;

    const studentDocs = documents?.filter((doc: any) => String(doc.registration) === String(studentId));

    if (!studentDocs?.length) return <p className="text-sm text-slate-500 italic">No existing documents found.</p>;

    return (
        <div className="space-y-2">
            {studentDocs.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.fileName || doc.file_name}</span>
                        {doc.description && <span className="text-slate-500">- {doc.description}</span>}
                    </div>
                    {doc.file && (
                        <a href={doc.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
}
