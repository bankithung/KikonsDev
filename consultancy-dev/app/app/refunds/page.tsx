'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCcw, Eye, X, Search } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface Refund {
  id: string;
  student: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: string;
  date: string;
}

export default function RefundsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const queryClient = useQueryClient();

  const { data: refunds = [], isLoading } = useQuery<Refund[]>({
    queryKey: ['refunds'],
    queryFn: apiClient.refunds.list,
  });

  const createRefundMutation = useMutation({
    mutationFn: apiClient.refunds.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      setIsModalOpen(false);
      resetForm();
      alert('Refund Request Created');
    },
  });

  const resetForm = () => {
    setStudentName('');
    setAmount('');
    setReason('');
  };

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    createRefundMutation.mutate({
      student: studentName,
      paymentId: `PAY-${Math.floor(Math.random() * 10000)}`,
      amount: parseFloat(amount),
      reason,
      status: 'Pending',
      date: new Date().toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading refunds...</div>
      </div>
    );
  }

  const filteredRefunds = refunds.filter((r: Refund) =>
    r.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.paymentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Refunds</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Process and track refund requests</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="destructive" className="h-9 bg-red-600 hover:bg-red-700">
          <RefreshCcw className="mr-2 h-4 w-4" /> Create Refund
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by student or payment ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 border-slate-300" />
      </div>

      <Card className="border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden md:table-cell">Payment ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden lg:table-cell">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRefunds.map((r: Refund) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">{r.student}</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{r.paymentId}</code>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-red-600">-₹{r.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 hidden lg:table-cell">{r.reason}</td>
                  <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === 'Processed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600" onClick={() => setSelectedRefund(r)}>
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Refund Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-4 font-heading">Process Refund</Dialog.Title>
            <form onSubmit={handleRefund} className="space-y-4">
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input
                  placeholder="Student Name"
                  className="h-11"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Refund Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="h-11"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Reason for Refund</Label>
                <Input
                  placeholder="Enter reason..."
                  className="h-11"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11">Cancel</Button>
                <Button type="submit" variant="destructive" className="flex-1 h-11 bg-red-600 hover:bg-red-700" disabled={createRefundMutation.isPending}>
                  {createRefundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
                </Button>
              </div>
            </form>
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
