/**
 * Example: Role-Based Delete Implementation for Enquiries
 * 
 * This demonstrates how to integrate the approval workflow into any list page.
 * Copy the relevant parts into your actual enquiries/page.tsx
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { Enquiry } from '@/lib/types';

export default function EnquiriesPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // State for dialogs
    const [showConfirm, setShowConfirm] = useState(false);
    const [showRequest, setShowRequest] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

    // Direct delete mutation (for admins)
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiClient.enquiries.delete(String(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            setShowConfirm(false);
            setSelectedEnquiry(null);
            alert('Enquiry deleted successfully');
        },
    });

    // Approval request mutation (for employees)
    const requestMutation = useMutation({
        mutationFn: async (data: { message: string }) => {
            if (!selectedEnquiry) return;
            await apiClient.approvalRequests.create({
                action: 'DELETE',
                entity_type: 'enquiry',
                entity_id: selectedEnquiry.id,
                entity_name: selectedEnquiry.candidateName,
                message: data.message,
            });
        },
        onSuccess: () => {
            setShowRequest(false);
            setSelectedEnquiry(null);
            alert('Delete request sent to admin for approval');
        },
    });

    // Direct delete handler (for admins)
    const handleDirectDelete = () => {
        if (selectedEnquiry) {
            deleteMutation.mutate(selectedEnquiry.id);
        }
    };

    // Submit request handler (for employees)
    const handleSubmitRequest = (message: string) => {
        requestMutation.mutate({ message });
    };

    // Main delete handler - checks role and shows appropriate dialog
    const handleDeleteClick = (enquiry: Enquiry) => {
        setSelectedEnquiry(enquiry);

        // Check if user is admin
        if (user?.role === 'COMPANY_ADMIN' || user?.role === 'DEV_ADMIN') {
            // Show confirmation dialog → Delete directly
            setShowConfirm(true);
        } else {
            // Show request modal → Submit to admin for approval
            setShowRequest(true);
        }
    };

    return (
        <div>
            {/* In your table, replace the delete button onClick: */}
            {/* 
      <Button
        onClick={() => handleDeleteClick(enquiry)}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
        title="Delete"
      >
        <Trash2 size={16} />
      </Button>
      */}

            {/* Confirmation Dialog for Admins */}
            <ConfirmDialog
                open={showConfirm}
                onClose={() => {
                    setShowConfirm(false);
                    setSelectedEnquiry(null);
                }}
                onConfirm={handleDirectDelete}
                title="Delete Enquiry"
                description={
                    selectedEnquiry
                        ? `Are you sure you want to delete the enquiry from ${selectedEnquiry.candidateName}? This action cannot be undone.`
                        : 'Are you sure you want to delete this enquiry?'
                }
                confirmText="Delete"
                confirmVariant="destructive"
                isLoading={deleteMutation.isPending}
            />

            {/* Request Modal for Employees/Managers */}
            <RequestActionModal
                open={showRequest}
                onClose={() => {
                    setShowRequest(false);
                    setSelectedEnquiry(null);
                }}
                onSubmit={handleSubmitRequest}
                action="DELETE"
                entityType="Enquiry"
                entityName={selectedEnquiry?.candidateName || ''}
                isLoading={requestMutation.isPending}
            />
        </div>
    );
}
