'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payment } from '@/lib/types';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { CreditCard, Filter, Eye, FileText, MoreHorizontal, RotateCcw, Calendar as CalendarIcon, X } from 'lucide-react';
import { PaymentModal } from '@/components/common/PaymentModal';
import { PaymentDetailsModal } from '@/components/common/PaymentDetailsModal';
import { RefundModal } from '@/components/common/RefundModal';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // UI State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Data Fetching
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: apiClient.payments.list,
  });

  // Export Functions
  const exportToExcel = () => {
    try {
      // Create CSV content
      const headers = ['Date', 'Student', 'Type', 'Method', 'Amount', 'Status', 'Refunds'];
      const rows = filteredPayments.map(pay => [
        format(new Date(pay.date), 'dd/MM/yyyy'),
        pay.studentName,
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
      link.setAttribute('download', `payments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: 'Export Successful', description: `Exported ${filteredPayments.length} transactions to Excel.` });
    } catch (error) {
      toast({ type: 'error', title: 'Export Failed', description: 'Could not export data.' });
    }
  };

  const exportToPDF = () => {
    try {
      // Create a printable view
      const printContent = `
        <html>
          <head>
            <title>Payment Transactions Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #0f766e; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #0f766e; color: white; }
              .header { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Payment Transactions Report</h1>
              <p>Generated: ${format(new Date(), 'PPP')}</p>
              <p>Total Transactions: ${filteredPayments.length}</p>
              <p>Total Amount: ₹${stats.totalPaid.toLocaleString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPayments.map(pay => {
        const refundInfo = pay.refunds && pay.refunds.length > 0
          ? pay.refunds.map((r: any) => `Refund: ${r.status} (₹${Number(r.amount).toLocaleString()})`).join(', ')
          : '';
        return `
                  <tr>
                    <td>${format(new Date(pay.date), 'dd/MM/yyyy')}</td>
                    <td>${pay.studentName}</td>
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

  // Filtering Logic
  const filteredPayments = useMemo(() => {
    return payments.filter(pay => {
      let matchesStatus = filterStatus === 'all' || pay.status === filterStatus;

      // Special check for "Refunded" filter
      if (filterStatus === 'Refunded') {
        const hasApprovedRefund = pay.refunds?.some((r: any) => r.status === 'Approved');
        matchesStatus = !!hasApprovedRefund;
      }

      const matchesType = filterType === 'all' || pay.type === filterType;
      const matchesMethod = filterMethod === 'all' || pay.method === filterMethod;

      let matchesDate = true;
      if (dateRange?.from) {
        const payDate = new Date(pay.date);
        if (dateRange.to) {
          matchesDate = isWithinInterval(payDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
        } else {
          matchesDate = payDate >= startOfDay(dateRange.from);
        }
      }

      return matchesStatus && matchesType && matchesMethod && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, filterStatus, filterType, filterMethod, dateRange]);

  // Dynamic Stats Calculation
  const stats = useMemo(() => {
    return filteredPayments.reduce((acc, pay) => {
      if (pay.status === 'Success') {
        acc.totalPaid += Number(pay.amount);
        acc.successCount++;
      } else if (pay.status === 'Pending') {
        acc.pendingAmount += Number(pay.amount);
        acc.pendingCount++;
      }

      // Calculate refunds
      const approvedRefunds = pay.refunds?.filter((r: any) => r.status === 'Approved') || [];
      const refundAmount = approvedRefunds.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      acc.totalRefunded += refundAmount;

      const pendingRefunds = pay.refunds?.filter((r: any) => r.status === 'Pending') || [];
      acc.pendingRefundsCount += pendingRefunds.length;

      return acc;
    }, {
      totalPaid: 0,
      totalRefunded: 0,
      pendingAmount: 0,
      successCount: 0,
      pendingCount: 0,
      pendingRefundsCount: 0
    });
  }, [filteredPayments]);

  // Table Columns
  const columns = [
    {
      header: 'Student',
      accessorKey: 'studentName',
      className: 'font-medium text-slate-900',
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (item: any) => <span className="font-bold text-slate-800">₹{Number(item.amount).toLocaleString()}</span>,
    },
    {
      header: 'Type',
      accessorKey: 'type',
      className: 'hidden md:table-cell',
    },
    {
      header: 'Method',
      accessorKey: 'method',
      className: 'hidden lg:table-cell',
    },
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (item: any) => <span className="text-slate-500">{format(new Date(item.date), 'dd MMM yyyy')}</span>,
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Status',
      accessorKey: 'status',
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
        const isSuccess = item.status === 'Success';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px] bg-white border-slate-200">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(item.id.toString());
                toast({ title: "Copied!", description: "Payment ID copied." });
              }} className="cursor-pointer">
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSelectedPayment(item);
                setIsDetailsModalOpen(true);
              }} className="cursor-pointer">
                <Eye className="mr-2 h-3.5 w-3.5" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedPayment(item);
                setIsDetailsModalOpen(true);
                toast({ title: "Invoice", description: "Use Print in details view." });
              }} className="cursor-pointer">
                <FileText className="mr-2 h-3.5 w-3.5" />
                Download Invoice
              </DropdownMenuItem>
              {isSuccess && !hasPendingOrApprovedRefund && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setSelectedPayment(item);
                    setIsRefundModalOpen(true);
                  }} className="text-orange-600 focus:text-orange-700 cursor-pointer">
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Request Refund
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterType('all');
    setFilterMethod('all');
    setDateRange(undefined);
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading payments data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Payments</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Manage transactions, refunds, and invoices</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn("h-9", isFilterOpen && "bg-slate-100")}
          >
            <Filter className="mr-2 h-4 w-4" />
            {isFilterOpen ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button onClick={() => setIsPaymentModalOpen(true)} className="h-9 bg-teal-600 hover:bg-teal-700">
            <CreditCard className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards - Dynamic */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-green-600 uppercase">Total Revenue</p>
            <p className="text-2xl font-bold text-green-700">₹{stats.totalPaid.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">{stats.successCount} transactions</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-orange-600 uppercase">Total Refunded</p>
            <p className="text-2xl font-bold text-orange-700">₹{stats.totalRefunded.toLocaleString()}</p>
            <p className="text-xs text-orange-600 mt-1">{stats.pendingRefundsCount} pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-blue-600 uppercase">Net Revenue</p>
            <p className="text-2xl font-bold text-blue-700">₹{(stats.totalPaid - stats.totalRefunded).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-yellow-600 uppercase">Pending Payments</p>
            <p className="text-2xl font-bold text-yellow-700">₹{stats.pendingAmount.toLocaleString()}</p>
            <p className="text-xs text-yellow-600 mt-1">{stats.pendingCount} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      {isFilterOpen && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  className="h-10 bg-white max-w-[160px]"
                  value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : undefined;
                    setDateRange(prev => ({ from: newDate, to: prev?.to }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  className="h-10 bg-white max-w-[160px]"
                  value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : undefined;
                    setDateRange(prev => ({ from: prev?.from, to: newDate }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="All Types" /></SelectTrigger>
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
                  <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Refunded">Refunded (Has Refunds)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="All Methods" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-6 flex justify-end">
                <Button variant="ghost" onClick={resetFilters} className="text-slate-600 hover:text-slate-900">
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        searchKey="studentName"
        title={`All Transactions (${filteredPayments.length})`}
        action={
          <div className="hidden sm:block text-xs text-slate-500">
            Showing latest 10 per page
          </div>
        }
      />

      {/* Modals */}
      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        studentName="" // Manual entry mode
        onSubmit={async (data) => {
          try {
            await apiClient.payments.create(data);
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast({ title: 'Payment Added', description: 'Transaction recorded successfully.' });
            setIsPaymentModalOpen(false);
          } catch (error) {
            toast({ type: 'error', title: 'Error', description: 'Failed to add payment.' });
          }
        }}
      />

      {selectedPayment && (
        <>
          <PaymentDetailsModal
            open={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedPayment(null);
            }}
            payment={selectedPayment}
            studentName={selectedPayment.studentName}
          />
          <RefundModal
            open={isRefundModalOpen}
            onClose={() => {
              setIsRefundModalOpen(false);
              setSelectedPayment(null);
            }}
            onSubmit={async (data) => {
              try {
                await apiClient.refunds.create(data);
                queryClient.invalidateQueries({ queryKey: ['payments'] });
                toast({ title: 'Refund Requested', description: 'Refund request submitted.' });
                setIsRefundModalOpen(false);
                setSelectedPayment(null);
              } catch (error: any) {
                const msg = error?.response?.data?.[0] || 'Failed to request refund.';
                toast({ type: 'error', title: 'Error', description: msg });
              }
            }}
            payment={selectedPayment}
          />
        </>
      )}
    </div>
  );
}
