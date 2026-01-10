import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Download, Trash2, Plus } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { compressFile, formatFileSize } from '@/lib/compression';
import { format } from 'date-fns';

interface Document {
    id?: string;
    file_name?: string;
    fileName?: string;
    description: string;
    file?: File | string;
    uploaded_at?: string;
    uploadedAt?: string;
    type?: string;
}

// ... imports

interface DocumentUploadProps {
    registrationId?: string;
    studentName?: string;
    initialDocuments?: Document[];
    onDocumentsChange?: (documents: Document[]) => void;
    readOnly?: boolean;
    onUploadSuccess?: () => void;
    variant?: 'card' | 'minimal';
}

export function DocumentUpload({
    registrationId,
    studentName,
    initialDocuments = [],
    onDocumentsChange,
    readOnly = false,
    onUploadSuccess,
    variant = 'card'
}: DocumentUploadProps) {
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [isUploading, setIsUploading] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState<{ [key: number]: number }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // ... useEffect, handlers same as before ... 

    // REDEFINED handlers for brevity in this replace block, reuse everything logic-wise
    React.useEffect(() => {
        if (initialDocuments && initialDocuments.length > 0) {
            setDocuments(initialDocuments);
        }
    }, [initialDocuments]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            // Show compression toast for large files
            const largeFiles = selectedFiles.filter(f => f.size > 1024 * 1024);
            if (largeFiles.length > 0) {
                toast({
                    title: "Compressing files...",
                    description: `Optimizing ${largeFiles.length} file(s) for upload. This may take a moment.`,
                });
            }

            // Compress files
            const compressedDocs = await Promise.all(
                selectedFiles.map(async (file, idx) => {
                    const result = await compressFile(file, (progress) => {
                        setCompressionProgress(prev => ({ ...prev, [idx]: progress }));
                    });

                    // Show compression stats for significantly compressed files
                    if (result.compressionRatio < 0.7) {
                        console.log(
                            `Compressed ${file.name}: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${Math.round((1 - result.compressionRatio) * 100)}% reduction)`
                        );
                    }

                    return {
                        file_name: result.compressedFile.name,
                        description: '',
                        file: result.compressedFile,
                        type: 'General',
                        _originalSize: result.originalSize,
                        _compressedSize: result.compressedSize,
                    };
                })
            );

            // Clear compression progress
            setCompressionProgress({});

            // Show success toast if compression was significant
            const totalOriginal = compressedDocs.reduce((sum, d) => sum + (d._originalSize || 0), 0);
            const totalCompressed = compressedDocs.reduce((sum, d) => sum + (d._compressedSize || 0), 0);

            if (totalOriginal > 0 && totalCompressed / totalOriginal < 0.8) {
                toast({
                    title: "✓ Files optimized",
                    description: `Reduced size by ${Math.round((1 - totalCompressed / totalOriginal) * 100)}% (${formatFileSize(totalOriginal)} → ${formatFileSize(totalCompressed)})`,
                });
            }

            const updatedDocs = [...documents, ...compressedDocs];
            setDocuments(updatedDocs);
            onDocumentsChange?.(updatedDocs);
        }
    };

    const handleRemove = (index: number) => {
        const updatedDocs = documents.filter((_, i) => i !== index);
        setDocuments(updatedDocs);
        onDocumentsChange?.(updatedDocs);
    };

    const handleDescriptionChange = (index: number, value: string) => {
        const updatedDocs = [...documents];
        updatedDocs[index].description = value;
        setDocuments(updatedDocs);
        onDocumentsChange?.(updatedDocs);
    };

    const handleUpload = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();

        if (!registrationId && !studentName) {
            toast({
                title: "Error",
                description: "Registration ID or Student Name is required to upload.",
            });
            return;
        }

        setIsUploading(true);
        try {
            const docsToUpload = documents.filter(doc => doc.file instanceof File);
            const updatedDocuments = [...documents];

            for (const doc of docsToUpload) {
                const formData = new FormData();
                formData.append('file', doc.file as File);
                formData.append('file_name', doc.file_name || (doc as any).fileName);
                formData.append('description', doc.description);
                if (registrationId) formData.append('registration', registrationId);
                if (studentName) formData.append('student_name', studentName);
                formData.append('type', doc.type || 'General');

                const uploadedDoc = await apiClient.documents.create(formData);

                const index = updatedDocuments.findIndex(d => d === doc);
                if (index !== -1) {
                    updatedDocuments[index] = {
                        id: uploadedDoc.id,
                        file_name: uploadedDoc.fileName,
                        description: doc.description,
                        file: uploadedDoc.file,
                        uploaded_at: uploadedDoc.uploadedAt,
                        type: uploadedDoc.type
                    };
                }
            }

            setDocuments(updatedDocuments);
            onDocumentsChange?.(updatedDocuments);

            toast({
                title: "Success",
                description: "Documents uploaded successfully",
            });

            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error('Upload failed:', error);
            toast({
                title: "Error",
                description: "Failed to upload documents",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const hasPendingUploads = documents.some(doc => doc.file instanceof File);

    const Controls = () => (
        <div className="flex flex-col gap-3">
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
            />
            <Button
                type="button"
                variant="outline"
                className="w-full border-teal-600/20 bg-teal-50/30 text-teal-700 hover:bg-teal-50 hover:text-teal-800 border-dashed border-2 py-6 h-auto flex-col gap-2 rounded-xl transition-all"
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="h-10 w-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                    <Plus size={20} />
                </div>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-sm">Add Documents</span>
                    <span className="text-[11px] opacity-70">PNG, JPG, PDF up to 10MB</span>
                </div>
            </Button>

            {hasPendingUploads && (registrationId || studentName) && (
                <Button
                    type="button"
                    onClick={(e) => handleUpload(e)}
                    disabled={isUploading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 rounded-xl shadow-sm shadow-teal-200"
                >
                    {isUploading ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Uploading...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Upload size={18} />
                            <span>Confirm Upload ({documents.filter(d => !d.id).length})</span>
                        </div>
                    )}
                </Button>
            )}
        </div>
    );

    const DocsList = () => (
        <div className="space-y-2">
            {documents.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <div className="h-12 w-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <FileText size={24} />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">No documents attached</p>
                </div>
            ) : (
                documents.map((doc, index) => (
                    <div key={index} className="group relative flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-teal-100 hover:shadow-sm transition-all">
                        <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                            <FileText size={20} />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-slate-800 text-xs truncate capitalize" title={doc.file_name || (doc as any).fileName}>
                                    {doc.file_name || (doc as any).fileName}
                                </span>
                                {doc.uploaded_at && (
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        {format(new Date(doc.uploaded_at), 'dd MMM')}
                                    </span>
                                )}
                            </div>

                            {!readOnly && !doc.id ? (
                                <Input
                                    placeholder="Add a label..."
                                    value={doc.description}
                                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                    className="h-7 text-[11px] bg-transparent border-slate-100 focus:border-teal-200 focus:ring-teal-100 px-2"
                                />
                            ) : (
                                <p className="text-[11px] text-slate-500 font-medium truncate">{doc.description || 'No label provided'}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            {doc.file && typeof doc.file === 'string' && (
                                <a href={doc.file} target="_blank" rel="noopener noreferrer" className="h-7 w-7 flex items-center justify-center text-slate-400 hover:bg-teal-50 hover:text-teal-600 rounded-md transition-all">
                                    <Download size={14} />
                                </a>
                            )}

                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="h-7 w-7 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    if (variant === 'minimal') {
        return (
            <div className="space-y-4">
                {!readOnly && <Controls />}
                <div className="pt-2">
                    <DocsList />
                </div>
            </div>
        );
    }

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
            <CardHeader className="bg-slate-50/50 py-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest">Document Management</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
                {!readOnly && <Controls />}
                <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Attached Files</h4>
                    <DocsList />
                </div>
            </CardContent>
        </Card>
    );
}
