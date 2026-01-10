'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, MoreHorizontal, FileText, Eye } from 'lucide-react';
import { PaymentModal } from '@/components/common/PaymentModal';
import { RefundModal } from '@/components/common/RefundModal';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { PaymentDetailsModal } from '@/components/common/PaymentDetailsModal';

interface PaymentHistoryProps {
    studentName: string;
}

export function PaymentHistory({ studentName }: PaymentHistoryProps) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: payments, isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: apiClient.payments.list,
    });

    const studentPayments = (payments?.filter(p =>
        p.studentName?.toLowerCase() === studentName.toLowerCase()
    ) || []).sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const totalPaid = studentPayments
        .filter(p => p.status === 'Success')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalRefunded = studentPayments
        .reduce((sum, p) => {
            const approvedRefunds = p.refunds?.filter((r: any) => r.status === 'Approved') || [];
            return sum + approvedRefunds.reduce((rSum: number, r: any) => rSum + Number(r.amount), 0);
        }, 0);

    const pendingRefundsCount = studentPayments
        .reduce((count, p) => {
            const pending = p.refunds?.filter((r: any) => r.status === 'Pending') || [];
            return count + pending.length;
        }, 0);

    const netPaid = totalPaid - totalRefunded;

    // Export Functions
    const exportToExcel = () => {
        try {
            const headers = ['Date', 'Type', 'Method', 'Amount', 'Status', 'Refunds'];
            const rows = studentPayments.map(pay => [
                format(new Date(pay.date), 'dd/MM/yyyy'),
                pay.type,
                pay.method,
                `₹${Number(pay.amount).toLocaleString()}`,
                pay.status,
                pay.refunds?.length ? `${pay.refunds.length} refund(s)` : 'None'
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${studentName}_payments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: 'Export Successful', description: `Exported ${studentPayments.length} transactions to Excel.` });
        } catch (error) {
            toast({ type: 'error', title: 'Export Failed', description: 'Could not export data.' });
        }
    };

    const exportToPDF = () => {
        try {
            const printContent = `
                <html>
                  <head>
                    <title>Payment History - ${studentName}</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 20px; }
                      h1 { color: #0f766e; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #0f766e; color: white; }
                      .header { margin-bottom: 20px; }
                      .summary { background: #f0fdfa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h1>Payment History - ${studentName}</h1>
                      <p>Generated: ${format(new Date(), 'PPP')}</p>
                    </div>
                    <div class="summary">
                      <p><strong>Total Paid:</strong> ₹${totalPaid.toLocaleString()}</p>
                      <p><strong>Total Refunded:</strong> ₹${totalRefunded.toLocaleString()}</p>
                      <p><strong>Net Paid:</strong> ₹${netPaid.toLocaleString()}</p>
                      <p><strong>Total Transactions:</strong> ${studentPayments.length}</p>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${studentPayments.map(pay => {
                const refundInfo = pay.refunds && pay.refunds.length > 0
                    ? pay.refunds.map((r: any) => `Refund: ${r.status} (₹${Number(r.amount).toLocaleString()})`).join(', ')
                    : '';
                return `
                          <tr>
                            <td>${format(new Date(pay.date), 'dd/MM/yyyy')}</td>
                            <td>${pay.type}</td>
                            <td>${pay.method}</td>
                            <td>₹${Number(pay.amount).toLocaleString()}</td>
                            <td>
                              Payment: ${pay.status}${refundInfo ? '<br/>' + refundInfo : ''}
                            </td>
                          </tr>
                        `;
            }).join('')}
                      </tbody>
                    </table>
                  </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.print();
                toast({ title: 'PDF Ready', description: 'Opening print dialog...' });
            }
        } catch (error) {
            toast({ type: 'error', title: 'Export Failed', description: 'Could not generate PDF.' });
        }
    };

    const columns = [
        {
            header: 'Date',
            accessorKey: 'date' as keyof typeof studentPayments[0],
            cell: (item: any) => format(new Date(item.date), 'dd MMM yyyy'),
        },
        {
            header: 'Amount',
            accessorKey: 'amount' as keyof typeof studentPayments[0],
            cell: (item: any) => <span className="font-semibold">₹{Number(item.amount).toLocaleString()}</span>,
        },
        {
            header: 'Type',
            accessorKey: 'type' as keyof typeof studentPayments[0],
        },
        {
            header: 'Method',
            accessorKey: 'method' as keyof typeof studentPayments[0],
        },
        {
            header: 'Status',
            accessorKey: 'status' as keyof typeof studentPayments[0],
            cell: (item: any) => (
                <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${item.status === 'Success' ? 'bg-green-100 text-green-700' :
                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        Payment: {item.status}
                    </span>
                    {item.refunds && item.refunds.map((refund: any) => (
                        <span key={refund.id} className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${refund.status === 'Approved' ? 'bg-orange-100 text-orange-700' :
                            refund.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            Refund: {refund.status}
                        </span>
                    ))}
                </div>
            ),
        },
        {
            header: 'Actions',
            cell: (item: any) => {
                const hasPendingOrApprovedRefund = item.refunds && item.refunds.some((r: any) => r.status === 'Pending' || r.status === 'Approved');

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50 shadow-lg border-slate-200 dark:border-slate-800">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(item.id);
                                toast({ title: "Copied!", description: "Payment ID copied to clipboard." });
                            }} className="hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                Copy Payment ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                            <DropdownMenuItem onClick={() => {
                                setSelectedPayment(item);
                                setShowDetailsModal(true);
                            }} className="hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setSelectedPayment(item);
                                setShowDetailsModal(true);
                                // Auto-print could be handled by passing a prop, but for now user can click Print in modal
                                toast({ title: "Invoice", description: "Use the Print Receipt button in the details view." });
                            }} className="hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                Download Invoice
                            </DropdownMenuItem>
                            {!hasPendingOrApprovedRefund && (
                                <>
                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                    <DropdownMenuItem onClick={() => {
                                        setSelectedPayment(item);
                                        setShowRefundModal(true);
                                    }} className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer">
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Request Refund
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ];

    if (isLoading) return <div className="text-sm text-slate-500">Loading payments...</div>;

    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-green-600 uppercase">Total Paid</p>
                            <p className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-orange-600 uppercase">Total Refunded</p>
                            <p className="text-2xl font-bold text-orange-700">₹{totalRefunded.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-blue-600 uppercase">Net Paid</p>
                            <p className="text-2xl font-bold text-blue-700">₹{netPaid.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-yellow-600 uppercase">Pending Refunds</p>
                            <p className="text-2xl font-bold text-yellow-700">{pendingRefundsCount}</p>
                        </CardContent>
                    </Card>
                </div>

                <DataTable
                    columns={columns}
                    data={studentPayments}
                    searchKey="type"
                    title="Transaction History"
                    action={
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px] bg-white border-slate-200">
                                    <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => exportToExcel()} className="cursor-pointer">
                                        Export to Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportToPDF()} className="cursor-pointer">
                                        Export to PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={() => setShowPaymentModal(true)} size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Payment
                            </Button>
                        </div>
                    }
                />
            </div>

            <PaymentModal
                open={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSubmit={async (data) => {
                    try {
                        await apiClient.payments.create(data);
                        queryClient.invalidateQueries({ queryKey: ['payments'] });
                        toast({
                            title: 'Payment Added',
                            description: `Payment of ₹${data.amount} has been recorded successfully`,
                        });
                        setShowPaymentModal(false);
                    } catch (error) {
                        toast({
                            type: 'error',
                            title: 'Error',
                            description: 'Failed to add payment. Please try again.',
                        });
                    }
                }}
                studentName={studentName}
            />

            {selectedPayment && (
                <>
                    <RefundModal
                        open={showRefundModal}
                        onClose={() => {
                            setShowRefundModal(false);
                            setSelectedPayment(null);
                        }}
                        onSubmit={async (data) => {
                            try {
                                await apiClient.refunds.create(data);
                                queryClient.invalidateQueries({ queryKey: ['payments'] });
                                toast({
                                    title: 'Refund Requested',
                                    description: `Refund of ₹${data.amount} has been requested successfully`,
                                });
                                setShowRefundModal(false);
                                setSelectedPayment(null);
                            } catch (error: any) {
                                console.error("Refund Error:", error);
                                const errorMessage = error?.response?.data?.[0] || error?.response?.data?.detail || error?.response?.data?.non_field_errors?.[0] || "Failed to request refund. Please try again.";
                                toast({
                                    type: 'error',
                                    title: 'Error',
                                    description: errorMessage,
                                });
                            }
                        }}
                        payment={selectedPayment}
                    />

                    <PaymentDetailsModal
                        open={showDetailsModal}
                        onClose={() => {
                            setShowDetailsModal(false);
                            setSelectedPayment(null);
                        }}
                        payment={selectedPayment}
                        studentName={studentName}
                    />
                </>
            )}
        </>
    );
}
