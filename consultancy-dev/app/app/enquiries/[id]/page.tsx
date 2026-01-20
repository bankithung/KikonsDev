'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { EnquiryForm } from '../components/EnquiryForm';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

export default function EnquiryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: enquiry, isLoading } = useQuery({
    queryKey: ['enquiry', id],
    queryFn: () => apiClient.enquiries.get(id),
  });

  // Mutation for creating approval request (employees)
  const approvalMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!enquiry) return;
      await apiClient.approvalRequests.create({
        action: 'UPDATE',
        entity_type: 'enquiry',
        entity_id: Number(id),
        entity_name: enquiry.candidateName,
        message: 'Request to update enquiry details',
        pending_changes: data,
      });
    },
    onSuccess: () => {
      toast.success('Update request sent to admin for approval');
      router.push('/app/enquiries');
    },
    onError: (error) => {
      console.error('Failed to create approval request', error);
      toast.error('Failed to send update request');
    },
  });

  // Mutation for direct update (admins)
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.enquiries.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      toast.success('Enquiry updated successfully');
      router.push('/app/enquiries');
    },
    onError: (error) => {
      console.error('Failed to update enquiry', error);
      toast.error('Failed to update enquiry');
    },
  });

  const handleSubmit = (data: any) => {
    // Check user role and route appropriately
    if (user?.role === 'EMPLOYEE') {
      approvalMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-slate-500">Loading...</div></div>;
  if (!enquiry) return <div className="p-8 text-center text-slate-500">Enquiry not found</div>;

  return (
    <div className="py-4 px-4">
      <div className="max-w-3xl mx-auto mb-4 flex justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700 h-9 text-sm font-semibold"
          onClick={() => router.push(`/app/registrations/new?enquiryId=${id}`)}
        >
          Convert to Registration <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <EnquiryForm
        initialData={enquiry}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending || approvalMutation.isPending}
      />
    </div>
  );
}
