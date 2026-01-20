'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Filter, Eye, FileText, MoreHorizontal, RotateCcw, Download, Plus, Search, Calendar, RefreshCw, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { cn, getAvatarColor, getInitials } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // UI State
  const [activeTab, setActiveTab] = useState('transactions');
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
  const [searchQuery, setSearchQuery] = useState('');

  // Data Fetching
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: apiClient.payments.list,
  });

  // Flatten Refunds Data
  const allRefunds = useMemo(() => {
    return payments.reduce((acc: any[], pay: any) => {
      if (pay.refunds && pay.refunds.length > 0) {
        pay.refunds.forEach((refund: any) => {
          acc.push({
            ...refund,
            paymentId: pay.id,
            studentName: pay.studentName,
            originalAmount: pay.amount,
            originalDate: pay.date,
            paymentType: pay.type
          });
        });
      }
      return acc;
    }, []).sort((a: any, b: any) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
  }, [payments]);

  // Combined Stats
  const stats = useMemo(() => {
    return payments.reduce((acc: { totalPaid: number; totalRefunded: number; pendingAmount: number; successCount: number; pendingCount: number; refundCount: number }, pay: any) => {
      if (pay.status === 'Success') {
        acc.totalPaid += Number(pay.amount || 0);
        acc.successCount++;
      } else if (pay.status === 'Pending') {
        acc.pendingAmount += Number(pay.amount || 0);
        acc.pendingCount++;
      }

      const approvedRefunds = pay.refunds?.filter((r: any) => r.status === 'Approved') || [];
      const refundAmount = approvedRefunds.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
      acc.totalRefunded += refundAmount;
      acc.refundCount += approvedRefunds.length;

      return acc;
    }, {
      totalPaid: 0,
      totalRefunded: 0,
      pendingAmount: 0,
      successCount: 0,
      pendingCount: 0,
      refundCount: 0
    });
  }, [payments]);

  // Filtering Logic (Applies to both, but primarily Transactions for now)
  const filteredPayments = useMemo(() => {
    return payments.filter((pay: any) => {
      // Search
      const matchesSearch = searchQuery === '' ||
        pay.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pay.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || pay.status === filterStatus;
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

      return matchesSearch && matchesStatus && matchesType && matchesMethod && matchesDate;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, searchQuery, filterStatus, filterType, filterMethod, dateRange]);


  const filteredRefunds = useMemo(() => {
    // Basic search filter for refunds
    return allRefunds.filter((ref: any) => {
      const matchesSearch = searchQuery === '' || ref.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [allRefunds, searchQuery]);


  // Transaction Columns
  const transactionColumns: Column<any>[] = [
    {
      header: 'Student',
      accessorKey: 'studentName',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${getAvatarColor(item.studentName).bg} ${getAvatarColor(item.studentName).text}`}>
            {getInitials(item.studentName)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{item.studentName}</span>
            <span className="text-[10px] text-slate-500 uppercase">{item.type}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Reference',
      accessorKey: 'referenceNumber',
      className: 'hidden md:table-cell text-xs text-slate-500',
    },
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (item: any) => <span className="text-slate-500 text-xs font-medium">{format(new Date(item.date), 'dd MMM yyyy')}</span>,
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (item: any) => <span className="font-bold text-slate-900">₹{Number(item.amount).toLocaleString()}</span>,
    },
    {
      header: 'Method',
      accessorKey: 'method',
      className: 'hidden lg:table-cell text-xs font-medium text-slate-600',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (item: any) => (
        <div className="flex gap-1 flex-wrap">
          <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
            item.status === 'Success' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
              item.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                "bg-rose-50 text-rose-700 border-rose-100"
          )}>
            {item.status}
          </div>
          {item.refunds && item.refunds.length > 0 && (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-purple-50 text-purple-700 border-purple-100">
              Refunded
            </div>
          )}
        </div>
      ),
    },
    {
      header: '',
      cell: (item: any) => {
        const hasPendingOrApprovedRefund = item.refunds && item.refunds.some((r: any) => r.status === 'Pending' || r.status === 'Approved');
        const isSuccess = item.status === 'Success';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-slate-100 rounded-full">
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => {
                setSelectedPayment(item);
                setIsDetailsModalOpen(true);
              }} className="text-xs font-medium">
                <Eye className="mr-2 h-3.5 w-3.5 text-slate-400" />
                View Details
              </DropdownMenuItem>
              {isSuccess && !hasPendingOrApprovedRefund && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setSelectedPayment(item);
                    setIsRefundModalOpen(true);
                  }} className="text-xs font-medium text-orange-600 focus:text-orange-700">
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

  // Refund Columns
  const refundColumns: Column<any>[] = [
    {
      header: 'Student',
      accessorKey: 'studentName',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${getAvatarColor(item.studentName).bg} ${getAvatarColor(item.studentName).text}`}>
            {getInitials(item.studentName)}
          </div>
          <span className="font-semibold text-slate-900">{item.studentName}</span>
        </div>
      )
    },
    {
      header: 'Refund Amount',
      accessorKey: 'amount',
      cell: (item: any) => <span className="font-bold text-orange-600">₹{Number(item.amount).toLocaleString()}</span>,
    },
    {
      header: 'Original Txn',
      accessorKey: 'originalAmount',
      cell: (item: any) => <span className="text-xs text-slate-500">of ₹{Number(item.originalAmount).toLocaleString()}</span>
    },
    {
      header: 'Date',
      accessorKey: 'refundDate', // Using the new date field or fallback
      cell: (item: any) => <span className="text-slate-500 text-xs font-medium">{item.refundDate ? format(new Date(item.refundDate), 'dd MMM yyyy') : '-'}</span>,
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      className: 'hidden md:table-cell text-xs text-slate-500 max-w-[200px] truncate',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (item: any) => (
        <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-fit",
          item.status === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
            item.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
              "bg-rose-50 text-rose-700 border-rose-100"
        )}>
          {item.status}
        </div>
      ),
    },
  ];

  // Export Logic - CSV Download
  const exportToCSV = () => {
    const dataToExport = activeTab === 'transactions' ? filteredPayments : filteredRefunds;

    if (dataToExport.length === 0) {
      toast({ title: 'No Data', description: 'No records to export.' });
      return;
    }

    let csvContent = '';
    let filename = '';

    if (activeTab === 'transactions') {
      // CSV Header for Transactions
      csvContent = 'Student Name,Reference Number,Date,Amount,Method,Status,Type\n';

      // CSV Rows
      dataToExport.forEach((pay: any) => {
        const row = [
          `"${pay.studentName || ''}"`,
          `"${pay.referenceNumber || ''}"`,
          pay.date ? format(new Date(pay.date), 'yyyy-MM-dd') : '',
          pay.amount || 0,
          `"${pay.method || ''}"`,
          `"${pay.status || ''}"`,
          `"${pay.type || ''}"`
        ].join(',');
        csvContent += row + '\n';
      });
      filename = `payments_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    } else {
      // CSV Header for Refunds
      csvContent = 'Student Name,Refund Amount,Original Amount,Refund Date,Reason,Status\n';

      // CSV Rows
      dataToExport.forEach((ref: any) => {
        const row = [
          `"${ref.studentName || ''}"`,
          ref.amount || 0,
          ref.originalAmount || 0,
          ref.refundDate ? format(new Date(ref.refundDate), 'yyyy-MM-dd') : '',
          `"${(ref.reason || '').replace(/"/g, '""')}"`,
          `"${ref.status || ''}"`
        ].join(',');
        csvContent += row + '\n';
      });
      filename = `refunds_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Export Successful', description: `Downloaded ${filename}` });
  };

  // Export Logic - PDF Download
  const exportToPDF = () => {
    const dataToExport = activeTab === 'transactions' ? filteredPayments : filteredRefunds;

    if (dataToExport.length === 0) {
      toast({ title: 'No Data', description: 'No records to export.' });
      return;
    }

    const doc = new jsPDF();
    const title = activeTab === 'transactions' ? 'Payments Report' : 'Refunds Report';
    const filename = activeTab === 'transactions'
      ? `payments_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
      : `refunds_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on ${format(new Date(), 'PPpp')}`, 14, 30);

    if (activeTab === 'transactions') {
      const tableData = dataToExport.map((pay: any) => [
        pay.studentName || '',
        pay.referenceNumber || '',
        pay.date ? format(new Date(pay.date), 'dd MMM yyyy') : '',
        `₹${Number(pay.amount || 0).toLocaleString()}`,
        pay.method || '',
        pay.status || ''
      ]);

      autoTable(doc, {
        head: [['Student', 'Reference', 'Date', 'Amount', 'Method', 'Status']],
        body: tableData,
        startY: 38,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 118, 110] }
      });
    } else {
      const tableData = dataToExport.map((ref: any) => [
        ref.studentName || '',
        `₹${Number(ref.amount || 0).toLocaleString()}`,
        `₹${Number(ref.originalAmount || 0).toLocaleString()}`,
        ref.refundDate ? format(new Date(ref.refundDate), 'dd MMM yyyy') : '',
        ref.status || ''
      ]);

      autoTable(doc, {
        head: [['Student', 'Refund Amount', 'Original Amount', 'Date', 'Status']],
        body: tableData,
        startY: 38,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 118, 110] }
      });
    }

    doc.save(filename);
    toast({ title: 'Export Successful', description: `Downloaded ${filename}` });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="flex flex-col items-center gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500 font-medium">Loading payments...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2">

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-200">
          <div className="h-1 w-full bg-emerald-500" />
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                <h4 className="text-2xl font-bold text-slate-900">₹{stats.totalPaid.toLocaleString()}</h4>
              </div>
            </div>
            <div className="mt-3 text-[10px] font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
              {stats.successCount} transactions
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-200">
          <div className="h-1 w-full bg-blue-500" />
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Income</p>
                <h4 className="text-2xl font-bold text-slate-900">₹{(stats.totalPaid - stats.totalRefunded).toLocaleString()}</h4>
              </div>
            </div>
            <div className="mt-3 text-[10px] font-medium text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full">
              Actual Revenue
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-200">
          <div className="h-1 w-full bg-amber-500" />
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outstanding</p>
                <h4 className="text-2xl font-bold text-slate-900">₹{stats.pendingAmount.toLocaleString()}</h4>
              </div>
            </div>
            <div className="mt-3 text-[10px] font-medium text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded-full">
              {stats.pendingCount} pending
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-200">
          <div className="h-1 w-full bg-rose-500" />
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Refunded</p>
                <h4 className="text-2xl font-bold text-slate-900">₹{stats.totalRefunded.toLocaleString()}</h4>
              </div>
            </div>
            <div className="mt-3 text-[10px] font-medium text-rose-600 bg-rose-50 w-fit px-2 py-0.5 rounded-full">
              {stats.refundCount} processed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Areas */}
      <Tabs defaultValue="transactions" className="w-full" onValueChange={setActiveTab}>
        {/* Consolidated Header Row - Fully Responsive */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          {/* Left: Tabs + Search + Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
              <TabsTrigger value="transactions" className="rounded-md text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm px-4 py-1.5 transition-all">
                All Transactions
              </TabsTrigger>
              <TabsTrigger value="refunds" className="rounded-md text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm px-4 py-1.5 transition-all">
                Refunds History
              </TabsTrigger>
            </TabsList>

            <div className="relative flex-1 min-w-[200px] max-w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full bg-white border-slate-200 text-xs focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 px-3 border-slate-200 bg-white text-slate-600 hover:text-slate-900 shrink-0", (filterStatus !== 'all' || filterMethod !== 'all' || dateRange) && "border-teal-500 bg-teal-50 text-teal-700")}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(filterStatus !== 'all' || filterMethod !== 'all' || dateRange) && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-[10px]">
                      {[filterStatus !== 'all', filterMethod !== 'all', !!dateRange].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[700px] p-0 shadow-xl border-slate-100 bg-white rounded-xl">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-t-xl">
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                    <Filter size={12} className="text-slate-500" /> Filter Payments
                  </h4>
                  {(filterStatus !== 'all' || filterMethod !== 'all' || dateRange) && (
                    <button
                      onClick={() => { setFilterStatus('all'); setFilterMethod('all'); setDateRange(undefined); setFilterType('all'); }}
                      className="text-[10px] uppercase font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Horizontal Grid Layout - Compact */}
                <div className="px-4 py-3 grid grid-cols-3 gap-4">

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transaction Status</Label>
                    <RadioGroup value={filterStatus} onValueChange={setFilterStatus} className="grid grid-cols-1 gap-1.5">
                      {['all', 'Success', 'Pending'].map((status) => (
                        <div key={status}>
                          <RadioGroupItem value={status} id={`status-${status}`} className="peer sr-only" />
                          <Label
                            htmlFor={`status-${status}`}
                            className="flex items-center justify-center rounded-md border-2 border-slate-100 bg-white px-3 py-1.5 hover:bg-slate-50 hover:text-slate-900 peer-data-[state=checked]:border-teal-500 peer-data-[state=checked]:bg-teal-50 peer-data-[state=checked]:text-teal-700 cursor-pointer transition-all"
                          >
                            <span className="text-xs font-semibold capitalize">{status}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Method Filter */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</Label>
                    <RadioGroup value={filterMethod} onValueChange={setFilterMethod} className="grid grid-cols-1 gap-1.5">
                      <div>
                        <RadioGroupItem value="all" id="method-all" className="peer sr-only" />
                        <Label
                          htmlFor="method-all"
                          className="flex items-center justify-center rounded-md border-2 border-slate-100 bg-white px-3 py-2 hover:bg-slate-50 peer-data-[state=checked]:border-teal-500 peer-data-[state=checked]:bg-teal-50 peer-data-[state=checked]:text-teal-700 cursor-pointer transition-all"
                        >
                          <span className="text-xs font-semibold">All Methods</span>
                        </Label>
                      </div>
                      {['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'].map((method) => (
                        <div key={method}>
                          <RadioGroupItem value={method} id={`method-${method}`} className="peer sr-only" />
                          <Label
                            htmlFor={`method-${method}`}
                            className="flex items-center justify-center rounded-md border-2 border-slate-100 bg-white px-3 py-2 hover:bg-slate-50 hover:text-slate-900 peer-data-[state=checked]:border-teal-500 peer-data-[state=checked]:bg-teal-50 peer-data-[state=checked]:text-teal-700 cursor-pointer transition-all text-center"
                          >
                            <span className="text-xs font-semibold">{method}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Range</Label>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">From</span>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setDateRange(prev => ({ from: e.target.value ? new Date(e.target.value) : undefined, to: prev?.to }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">To</span>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setDateRange(prev => ({ from: prev?.from, to: e.target.value ? new Date(e.target.value) : undefined }))}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-end">
                  <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white px-6 shadow-sm shadow-teal-200 text-xs" onClick={() => setIsFilterOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs font-medium border-slate-200 bg-white hover:bg-slate-50">
                  <Download className="mr-2 h-3.5 w-3.5 text-slate-500" /> Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] bg-white shadow-lg border border-slate-200">
                <DropdownMenuLabel className="text-xs font-bold text-slate-500">Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToCSV} className="text-xs font-medium cursor-pointer">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="text-xs font-medium cursor-pointer">
                  <FileText className="mr-2 h-4 w-4 text-red-600" /> Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => setIsPaymentModalOpen(true)} size="sm" className="h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-200 text-white">
              <Plus className="mr-2 h-3.5 w-3.5" /> Record Payment
            </Button>
          </div>
        </div>

        <TabsContent value="transactions" className="mt-0">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <DataTable
              columns={transactionColumns}
              data={filteredPayments}
              title=""
            />
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="mt-0">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <DataTable
              columns={refundColumns}
              data={filteredRefunds}
              searchKey="studentName"
              title=""
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Linked Modals */}
      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        studentName=""
        onSubmit={async (data) => {
          try {
            await apiClient.payments.create(data);
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast({ title: 'Success', description: 'Payment recorded successfully.' });
            setIsPaymentModalOpen(false);
          } catch (error) {
            toast({ type: 'error', title: 'Error', description: 'Failed to record payment.' });
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
                toast({ title: 'Refund Requested', description: 'Your request has been submitted.' });
                setIsRefundModalOpen(false);
                setSelectedPayment(null);
              } catch (error: any) {
                const msg = error?.response?.data?.[0] || 'Verification failed.';
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
