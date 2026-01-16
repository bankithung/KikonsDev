'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import { RefreshCcw, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';

interface RefundHistoryProps {
    studentName: string;
}

export function RefundHistory({ studentName }: RefundHistoryProps) {
    const { data: refunds, isLoading } = useQuery({
        queryKey: ['refunds', studentName],
        queryFn: () => apiClient.refunds.list({ student_name: studentName }),
    });

    const studentRefunds = (refunds || []).sort((a: any, b: any) => {
        const dateA = a.created_at || a.date || a.refund_date;
        const dateB = b.created_at || b.date || b.refund_date;
        return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
    });

    const totalRefunded = studentRefunds
        .filter((r: any) => r.status === 'Approved')
        .reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    const pendingRefundsCount = studentRefunds
        .filter((r: any) => r.status === 'Pending')
        .length;

    const columns = [
        {
            header: 'Date',
            accessorKey: 'created_at',
            cell: (item: any) => {
                const dateVal = item.created_at || item.date || item.refund_date;
                return dateVal ? format(new Date(dateVal), 'dd MMM yyyy') : '-';
            },
        },
        {
            header: 'Amount',
            accessorKey: 'amount',
            cell: (item: any) => <span className="font-semibold text-orange-700">₹{Number(item.amount).toLocaleString()}</span>,
        },
        {
            header: 'Method',
            accessorKey: 'refund_method',
            cell: (item: any) => <span className="capitalize">{item.refunds_method || item.refund_method || '-'}</span>,
        },
        {
            header: 'Reason',
            accessorKey: 'reason',
            cell: (item: any) => <span className="text-sm text-slate-600 max-w-[200px] truncate block" title={item.reason}>{item.reason}</span>,
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (item: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    {item.status}
                </span>
            ),
        }
    ];

    const exportToExcel = () => {
        try {
            const headers = ['Date', 'Amount', 'Method', 'Reason', 'Status'];
            const rows = studentRefunds.map((r: any) => {
                const dateVal = r.created_at || r.date || r.refund_date;
                return [
                    dateVal ? format(new Date(dateVal), 'dd/MM/yyyy') : '-',
                    `\u20B9${Number(r.amount).toLocaleString()}`,
                    r.refund_method || '-',
                    `"${r.reason || ''}"`,
                    r.status
                ];
            });
            const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${studentName}_refunds_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Refunds exported to CSV');
        } catch (e) {
            console.error(e);
            toast.error('Failed to export CSV');
        }
    };

    const exportToPDF = () => {
        const printContent = `
            <html>
                <head>
                    <title>Refund History - ${studentName}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        h1 { color: #c2410c; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #fff7ed; color: #c2410c; }
                    </style>
                </head>
                <body>
                    <h1>Refund History - ${studentName}</h1>
                    <p>Generated on ${format(new Date(), 'dd MMM yyyy')}</p>
                    <p><strong>Total Refunded:</strong> ₹${totalRefunded.toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Amount</th><th>Method</th><th>Reason</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${studentRefunds.map((r: any) => {
            const dateVal = r.created_at || r.date || r.refund_date;
            return `
                                <tr>
                                    <td>${dateVal ? format(new Date(dateVal), 'dd/MM/yyyy') : '-'}</td>
                                    <td>₹${Number(r.amount).toLocaleString()}</td>
                                    <td>${r.refund_method || '-'}</td>
                                    <td>${r.reason || '-'}</td>
                                    <td>${r.status}</td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(printContent);
            win.document.close();
            win.print();
        }
    };

    if (isLoading) return <div className="text-sm text-slate-500">Loading refunds...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-orange-600 uppercase">Total Refunded</p>
                            <p className="text-2xl font-bold text-orange-700">₹{totalRefunded.toLocaleString()}</p>
                        </div>
                        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <RefreshCcw size={20} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-yellow-600 uppercase">Pending Review</p>
                            <p className="text-2xl font-bold text-yellow-700">{pendingRefundsCount}</p>
                        </div>
                        <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                            <AlertCircle size={20} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DataTable
                columns={columns}
                data={studentRefunds}
                searchKey="reason"
                title="Refund History"
                action={
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto bg-white hover:bg-slate-50">
                                <FileText className="mr-2 h-4 w-4" /> Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-md">
                            <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50">Export to Excel</DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50">Export to PDF</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            />
        </div>
    );
}
