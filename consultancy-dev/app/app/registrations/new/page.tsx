'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { RegistrationForm } from '../components/RegistrationForm';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText } from 'lucide-react';
import { RegistrationReceipt } from '@/components/receipts/RegistrationReceipt';

export default function NewRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const enquiryId = searchParams.get('enquiryId');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Separate documents from registration data
      const { documents, ...registrationDetails } = data;

      // 2. Create the registration
      const payload = { ...registrationDetails };
      if (enquiryId) {
        payload.enquiry = enquiryId;
      }
      const newReg = await apiClient.registrations.create(payload);

      // 3. Upload documents if any exist and have files
      if (documents && documents.length > 0) {
        const uploadPromises = documents.map((doc: any) => {
          if (doc.file instanceof File) {
            // New file upload
            const formData = new FormData();
            formData.append('file', doc.file);
            formData.append('file_name', doc.file_name || doc.file.name);
            formData.append('description', doc.description || '');
            formData.append('registration', newReg.id); // Associate with new registration
            formData.append('type', doc.type || 'General');

            return apiClient.documents.create(formData);
          } else if (doc.id) {
            // Existing document - Link to this registration
            return apiClient.documents.update(doc.id, { registration: newReg.id });
          }
          return Promise.resolve();
        });

        await Promise.all(uploadPromises);
      }

      return newReg;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setRegistrationData(data);
      setShowSuccessModal(true);
    },
  });

  const handleClose = () => {
    setShowSuccessModal(false);
    setShowReceipt(false);
    router.push('/app/registrations');
  };

  const handlePrintReceipt = () => {
    setShowSuccessModal(false);
    setShowReceipt(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <RegistrationForm
        onSubmit={(data) => mutation.mutate(data as any)}
        isLoading={mutation.isPending}
        enquiryId={enquiryId}
      />

      {/* Success Modal */}
      <Dialog.Root open={showSuccessModal} onOpenChange={handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none z-50 border border-slate-200">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-2">
              Registration Successful
            </Dialog.Title>
            <Dialog.Description className="text-sm text-slate-600 mb-6">
              Registration has been created successfully with ID: <span className="font-mono font-bold text-slate-900">{registrationData?.registrationNo}</span>.
            </Dialog.Description>

            <div className="flex flex-col gap-3">
              <Button className="w-full h-11 bg-teal-600 hover:bg-teal-700" onClick={handlePrintReceipt}>
                <FileText className="mr-2 h-4 w-4" /> Print Receipt
              </Button>
              <Button variant="outline" className="w-full h-11" onClick={handleClose}>
                Close & Go to List
              </Button>
            </div>

            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Receipt Modal */}
      {showReceipt && registrationData && (
        <RegistrationReceipt
          data={registrationData}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
