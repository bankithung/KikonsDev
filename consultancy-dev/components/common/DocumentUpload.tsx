import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Download, Trash2, Plus } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { compressFile, formatFileSize } from '@/lib/compression';

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
        <div className="flex gap-2">
            {hasPendingUploads && (registrationId || studentName) && (
                <Button
                    type="button"
                    size="sm"
                    onClick={(e) => handleUpload(e)}
                    disabled={isUploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isUploading ? (
                        <>Uploading...</>
                    ) : (
                        <><Upload className="mr-2 h-4 w-4" /> Upload Pending</>
                    )}
                </Button>
            )}
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
            />
            <Button
                type="button"
                variant={variant === 'minimal' ? "default" : "outline"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className={variant === 'minimal' ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
            >
                <Plus className="mr-2 h-4 w-4" /> Add Documents
            </Button>
        </div>
    );

    const DocsList = () => (
        <div className="space-y-3">
            {documents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed rounded-lg">
                    <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No documents added yet</p>
                </div>
            ) : (
                documents.map((doc, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
                        <div className="mt-1 bg-white p-2 rounded border border-slate-200">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium text-sm truncate max-w-[200px]" title={doc.file_name || (doc as any).fileName}>
                                    {doc.file_name || (doc as any).fileName}
                                </span>
                                {doc.uploaded_at && (
                                    <span className="text-xs text-slate-500">
                                        {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {!readOnly && !doc.id ? (
                                <Input
                                    placeholder="Document description (e.g. 10th Marksheet)"
                                    value={doc.description}
                                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                    // prevented Enter key
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    className="h-8 text-sm"
                                />
                            ) : (
                                <p className="text-sm text-slate-600">{doc.description || 'No description'}</p>
                            )}
                        </div>

                        <div className="flex gap-1">
                            {doc.file && typeof doc.file === 'string' && (
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                    <a href={doc.file} target="_blank" rel="noopener noreferrer">
                                        <Download size={16} />
                                    </a>
                                </Button>
                            )}

                            {!readOnly && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemove(index)}
                                    className="h-8 w-8 text-slate-500 hover:text-red-600"
                                >
                                    <Trash2 size={16} />
                                </Button>
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
                <div className="flex justify-end">
                    {!readOnly && <Controls />}
                </div>
                <DocsList />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Documents</CardTitle>
                {!readOnly && <Controls />}
            </CardHeader>
            <CardContent className="space-y-4">
                <DocsList />
            </CardContent>
        </Card>
    );
}
