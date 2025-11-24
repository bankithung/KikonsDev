'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payment } from '@/lib/types';
import { format } from 'date-fns';
import { CreditCard, Filter, Search, Eye, X, Receipt } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [studentName, setStudentName] = useState('');
  const [method, setMethod] = useState('Cash');
  const [paymentType, setPaymentType] = useState('Registration');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: apiClient.payments.list,
  });

  const createPaymentMutation = useMutation({
    mutationFn: apiClient.payments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsModalOpen(false);
      setAmount('');
      setStudentName('');
      alert('Payment Successful');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createPaymentMutation.mutate({
          amount: Number(amount),
          studentName,
          method: method as any,
          type: paymentType as any,
          date: new Date().toISOString(),
      });
  };

  const filteredPayments = payments?.filter(pay => {
    const matchesSearch = pay.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pay.status === filterStatus;
    const matchesType = filterType === 'all' || pay.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Payments</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Track and manage all payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 bg-teal-600 hover:bg-teal-700">
            <CreditCard className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Enquiry">Enquiry</SelectItem>
                    <SelectItem value="Registration">Registration</SelectItem>
                    <SelectItem value="Enrollment">Enrollment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full h-10" onClick={() => { setFilterType('all'); setFilterStatus('all'); }}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by student name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 border-slate-300" />
      </div>

      <Card className="border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden lg:table-cell">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPayments && filteredPayments.length > 0 ? (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{pay.studentName}</p>
                      <p className="text-xs text-slate-500 md:hidden">{pay.type}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-700">{pay.type}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-900">₹{pay.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 hidden lg:table-cell">{pay.method}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">
                      {format(new Date(pay.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        pay.status === 'Success' ? 'bg-green-100 text-green-700' :
                        pay.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600" onClick={() => setSelectedPayment(pay)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-600">
                          <Receipt size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <CreditCard size={40} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">No payments found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none z-50 border border-slate-200">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 font-heading">Record Payment</Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label className="font-body">Student Name</Label>
                    <Input required value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Search student..." className="h-11" />
                </div>
                <div className="space-y-2">
                    <Label className="font-body">Payment Type</Label>
                     <Select onValueChange={setPaymentType} defaultValue="Registration">
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Enquiry">Enquiry Fee</SelectItem>
                            <SelectItem value="Registration">Registration Fee</SelectItem>
                            <SelectItem value="Enrollment">Enrollment Fee</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="font-body">Amount (₹)</Label>
                    <Input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="h-11" />
                </div>
                <div className="space-y-2">
                    <Label className="font-body">Payment Method</Label>
                    <Select onValueChange={setMethod} defaultValue="Cash">
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11">Cancel</Button>
                    <Button type="submit" disabled={createPaymentMutation.isPending} className="flex-1 h-11 bg-teal-600 hover:bg-teal-700">
                        {createPaymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
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

      {/* View Payment Modal */}
      <Dialog.Root open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border">
            {selectedPayment && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4 font-heading">Payment Receipt</Dialog.Title>
                <div className="space-y-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-lg font-bold text-slate-900">{selectedPayment.studentName}</p>
                    <p className="text-sm text-slate-600">{selectedPayment.type} Payment</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-slate-500">Amount</p><p className="text-lg font-bold text-teal-600">₹{selectedPayment.amount.toLocaleString()}</p></div>
                    <div><p className="text-xs text-slate-500">Method</p><p className="text-sm font-medium">{selectedPayment.method}</p></div>
                    <div><p className="text-xs text-slate-500">Date</p><p className="text-sm">{format(new Date(selectedPayment.date), 'dd MMM yyyy')}</p></div>
                    <div><p className="text-xs text-slate-500">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${selectedPayment.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {selectedPayment.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setSelectedPayment(null)}>Close</Button>
                  <Button className="flex-1 h-11 bg-teal-600 hover:bg-teal-700"><Receipt size={16} className="mr-2" /> Print</Button>
                </div>
                <Dialog.Close asChild>
                  <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
