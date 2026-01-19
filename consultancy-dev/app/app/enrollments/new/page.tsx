'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { EnrollmentWizard } from '../components/EnrollmentWizard';
import { BackButton } from '@/components/ui/back-button';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Printer, CheckCircle } from 'lucide-react';

export default function NewEnrollmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newEnrollNo, setNewEnrollNo] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: apiClient.enrollments.create,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      // Backend returns snake_case usually
      setNewEnrollNo(data.enrollment_no || data.enrollmentNo || 'SUCCESS');
      setReceiptData({ ...data, ...variables }); // Combine backend response and form data
      setShowSuccessModal(true);
    },
    onError: (error) => {
      console.error("Enrollment creation failed", error);
    }
  });

  const handleClose = () => {
    setShowSuccessModal(false);
    router.push('/app/enrollments');
  };

  const handlePrint = () => {
    if (!receiptData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipt');
      return;
    }

    const total = (Number(receiptData.serviceCharge) || 0) + (Number(receiptData.schoolFees) || 0) + (Number(receiptData.hostelFees) || 0);
    const dateStr = new Date().toLocaleDateString();
    const enrollNo = newEnrollNo || 'PENDING';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${enrollNo}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #0d9488; letter-spacing: -0.5px; }
          .subtitle { font-size: 14px; color: #666; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .label { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; }
          .value { font-size: 16px; font-weight: 500; color: #000; }
          .enrollment-badge { 
             display: inline-block; background: #f0fdf4; color: #166534; 
             padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: bold;
             border: 1px solid #bbf7d0;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #eee; color: #666; font-size: 12px; text-transform: uppercase; }
          td { padding: 16px 8px; border-bottom: 1px solid #f5f5f5; }
          .amount-col { text-align: right; }
          .total-row td { border-top: 2px solid #eee; border-bottom: none; padding-top: 20px; font-weight: bold; font-size: 18px; }
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Kikons Consultancy</div>
          <div class="subtitle">Enrollment Receipt</div>
        </div>

        <div class="details-grid">
          <div>
            <div style="margin-bottom: 20px;">
              <div class="label">Student Name</div>
              <div class="value">${receiptData.studentName || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 20px;">
               <div class="label">University</div>
               <div class="value">${receiptData.university || 'N/A'}</div>
            </div>
            <div>
               <div class="label">Program Applied</div>
               <div class="value">${receiptData.programName || 'N/A'}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="margin-bottom: 20px;">
               <div class="label">Date</div>
               <div class="value">${dateStr}</div>
            </div>
            <div>
               <div class="label">Enrollment Number</div>
               <div style="margin-top: 5px;"><span class="enrollment-badge">${enrollNo}</span></div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fee Description</th>
              <th class="amount-col">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Service Charges</td>
              <td class="amount-col">₹${Number(receiptData.serviceCharge || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>School / Tuition Fees</td>
              <td class="amount-col">₹${Number(receiptData.schoolFees || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Hostel / Accommodation Fees</td>
              <td class="amount-col">₹${Number(receiptData.hostelFees || 0).toLocaleString()}</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount</td>
              <td class="amount-col">₹${total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

         <div style="margin-bottom: 40px; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <div class="label">Payment Terms</div>
            <div class="value" style="margin-top: 5px; font-size: 14px;">
               ${receiptData.paymentType === 'Installment'
        ? `Installment Plan: ${receiptData.installmentsCount} payments of ₹${Number(receiptData.installmentAmount).toLocaleString()} approx.`
        : 'Full Payment Required'}
            </div>
         </div>

        <div class="footer">
          <p>Generated by Kikons Consultancy System<br>For questions, please contact support.</p>
        </div>

        <script>
           window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Enrollment</h1>
          <p className="text-sm text-slate-500">Create a new student enrollment entry</p>
        </div>
      </div>

      <EnrollmentWizard
        onSubmit={(data) => mutation.mutate(data as any)}
        isLoading={mutation.isPending}
      />

      {/* Success Modal */}
      <Dialog.Root open={showSuccessModal} onOpenChange={handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[480px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-2xl focus:outline-none z-50 border border-slate-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <Dialog.Title className="text-xl font-bold text-slate-900">
                Enrollment Successful
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-600 mt-2">
                The student has been successfully enrolled.
                <br />
                Enrollment No: <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded ml-1">{newEnrollNo}</span>
              </Dialog.Description>
            </div>

            <div className="space-y-3">
              <Button className="w-full h-11 bg-teal-600 hover:bg-teal-700 font-medium" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print Receipt
              </Button>
              <Button variant="outline" className="w-full h-11 border-slate-300 hover:bg-slate-50" onClick={handleClose}>
                Close & Go to List
              </Button>
            </div>

            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
