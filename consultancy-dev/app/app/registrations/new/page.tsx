'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { RegistrationForm } from '../components/RegistrationForm';
import { BackButton } from '@/components/ui/back-button';
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
    mutationFn: apiClient.registrations.create,
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
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <BackButton />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">New Registration</h1>
        <p className="text-sm text-slate-600 mt-1">Register a new student into the system</p>
      </div>

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
