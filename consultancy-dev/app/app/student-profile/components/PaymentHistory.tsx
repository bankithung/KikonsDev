'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface PaymentHistoryProps {
    studentName: string;
}

export function PaymentHistory({ studentName }: PaymentHistoryProps) {
    const { data: payments, isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: apiClient.payments.list,
    });

    const studentPayments = payments?.filter(p =>
        p.studentName?.toLowerCase() === studentName.toLowerCase()
    ) || [];

    const totalPaid = studentPayments
        .filter(p => p.status === 'Success')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    if (isLoading) return <div className="text-sm text-slate-500">Loading payments...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-green-600 uppercase">Total Paid</p>
                        <p className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase">Transactions</p>
                        <p className="text-2xl font-bold text-slate-700">{studentPayments.length}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    {studentPayments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {studentPayments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">{format(new Date(payment.date), 'dd MMM yyyy')}</td>
                                            <td className="px-4 py-3 font-semibold">₹{Number(payment.amount).toLocaleString()}</td>
                                            <td className="px-4 py-3">{payment.type}</td>
                                            <td className="px-4 py-3">{payment.method}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payment.status === 'Success' ? 'bg-green-100 text-green-700' :
                                                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            No payment history found for this student.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
