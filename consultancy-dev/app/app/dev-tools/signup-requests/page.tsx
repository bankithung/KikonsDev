'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Check, X, Clock, Building, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { WithRoleGuard } from '@/components/WithRoleGuard';
import { useToast } from '@/hooks/use-toast';

interface SignupRequest {
  id: number;
  company_name: string;
  admin_name: string;
  email: string;
  phone: string;
  requested_at: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  plan: string;
  username: string;
  first_name: string;
  last_name: string;
  company_id: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

function SignupRequestsPageContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch signup requests
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['signup-requests'],
    queryFn: async () => {
      const response = await api.get<SignupRequest[]>('signup-requests/');
      return response.data;
    }
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`signup-requests/${id}/approve/`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signup-requests'] });
      toast({
        title: "Request Approved",
        description: `Company admin account created successfully for ${data.username}`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.response?.data?.error || "Failed to approve request",
        variant: "destructive",
      });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await api.post(`signup-requests/${id}/reject/`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signup-requests'] });
      toast({
        title: "Request Rejected",
        description: "Signup request has been rejected",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.response?.data?.error || "Failed to reject request",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (id: number) => {
    if (confirm('Approve this signup request? A company admin account will be created.')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Failed to load signup requests. Please try again.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Company Signup Requests</h1>
          <p className="text-sm text-slate-600 mt-1">Review and approve new company registrations</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-semibold text-yellow-900">{pendingCount} Pending</span>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No signup requests yet</p>
        </Card>
      ) : (
        <DataTable<SignupRequest>
          data={requests}
          searchKey="company_name"
          columns={[
            {
              header: 'Company',
              cell: (item) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                    <Building size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.company_name}</p>
                    <p className="text-xs text-slate-500">{item.admin_name}</p>
                  </div>
                </div>
              )
            },
            {
              header: 'Email',
              accessorKey: 'email',
              className: 'hidden md:table-cell'
            },
            {
              header: 'Phone',
              accessorKey: 'phone',
              className: 'hidden lg:table-cell'
            },
            {
              header: 'Plan',
              accessorKey: 'plan',
              cell: (item) => (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {item.plan}
                </span>
              )
            },
            {
              header: 'Requested',
              cell: (item) => <span className="text-sm text-slate-600">{format(new Date(item.requested_at), 'dd MMM yyyy')}</span>,
              className: 'hidden sm:table-cell'
            },
            {
              header: 'Status',
              cell: (item) => (
                <div className="space-y-1">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-semibold inline-block',
                    item.status === 'Pending' && 'bg-yellow-100 text-yellow-700',
                    item.status === 'Approved' && 'bg-green-100 text-green-700',
                    item.status === 'Rejected' && 'bg-red-100 text-red-700'
                  )}>
                    {item.status}
                  </span>
                  {item.status !== 'Pending' && item.approved_by_name && (
                    <p className="text-[10px] text-slate-500">by {item.approved_by_name}</p>
                  )}
                </div>
              )
            },
            {
              header: 'Actions',
              cell: (item) => item.status === 'Pending' ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                    onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }}
                    title="Approve"
                    disabled={approveMutation.isPending}
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => { e.stopPropagation(); handleReject(item.id); }}
                    title="Reject"
                    disabled={rejectMutation.isPending}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-slate-400">-</span>
              )
            }
          ]}
        />
      )}
    </div>
  );
}

export default function SignupRequestsPage() {
  return (
    <WithRoleGuard allowedRoles={['DEV_ADMIN']}>
      <SignupRequestsPageContent />
    </WithRoleGuard>
  );
}
