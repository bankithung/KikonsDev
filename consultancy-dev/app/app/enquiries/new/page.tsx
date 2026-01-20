'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { EnquiryForm } from '../components/EnquiryForm';

export default function NewEnquiryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: apiClient.enquiries.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      router.push('/app/enquiries');
    },
  });

  return (
    <div className="py-4 px-4">
      <EnquiryForm
        onSubmit={(data) => mutation.mutate(data as any)}
        isLoading={mutation.isPending}
      />
    </div>
  );
}
