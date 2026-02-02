import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DocumentTakeover } from '@/components/common/DocumentTakeover';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface PhysicalDocumentModalProps {
    open: boolean;
    onClose: () => void;
    registrationId: string;
    onSuccess: () => void;
}

interface FormData {
    student_documents: {
        name: string;
        document_number?: string;
        remarks?: string;
    }[];
    documentTakeoverEnabled: boolean;
}

export function PhysicalDocumentModal({ open, onClose, registrationId, onSuccess }: PhysicalDocumentModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        control,
        register,
        handleSubmit,
        setValue,
        reset
    } = useForm<FormData>({
        defaultValues: {
            student_documents: [{ name: '', document_number: '', remarks: '' }],
            documentTakeoverEnabled: true
        }
    });

    const handleFormSubmit = async (data: FormData) => {
        if (!data.student_documents || data.student_documents.length === 0) {
            toast.error('Please add at least one document');
            return;
        }

        // Filter out empty entries
        const validDocs = data.student_documents.filter(d => d.name.trim() !== '');

        if (validDocs.length === 0) {
            toast.error('Please specify document names');
            return;
        }

        setIsLoading(true);
        try {
            // Create documents sequentially or in parallel
            await Promise.all(validDocs.map(doc =>
                apiClient.studentDocuments.create({
                    ...doc,
                    registration: registrationId,
                    status: 'Held' // Explicitly set status as these are physical takeovers
                })
            ));

            toast.success(`Successfully added ${validDocs.length} document(s)`);
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add documents:', error);
            toast.error('Failed to add documents. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !isLoading && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Physical Documents</DialogTitle>
                    <DialogDescription>
                        Record physical documents being submitted to the office.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <DocumentTakeover
                        control={control}
                        register={register}
                        setValue={setValue}
                        name="student_documents"
                        checkboxName="documentTakeoverEnabled"
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Documents
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
