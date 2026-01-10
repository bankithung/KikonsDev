import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";

interface PaymentDetailsModalProps {
    open: boolean;
    onClose: () => void;
    payment: any;
    studentName: string;
}

export function PaymentDetailsModal({ open, onClose, payment, studentName }: PaymentDetailsModalProps) {
    if (!payment) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white text-slate-900 border-slate-200">
                <DialogHeader>
                    <DialogTitle>Payment Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 print:p-8" id="printable-receipt">
                    <div className="flex justify-between items-center pb-4 border-b">
                        <div>
                            <p className="text-sm text-slate-500">Amount Paid</p>
                            <p className="text-3xl font-bold text-green-600">₹{Number(payment.amount).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payment.status === 'Success' ? 'bg-green-100 text-green-700' :
                                payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {payment.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500 mb-1">Payment ID</p>
                            <p className="font-medium font-mono text-xs">{payment.id}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 mb-1">Date</p>
                            <p className="font-medium">{format(new Date(payment.date), 'dd MMM yyyy, hh:mm a')}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 mb-1">Student</p>
                            <p className="font-medium">{studentName}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 mb-1">Payment Type</p>
                            <p className="font-medium">{payment.type}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 mb-1">Payment Method</p>
                            <p className="font-medium">{payment.method}</p>
                        </div>
                    </div>

                    {payment.refunds && payment.refunds.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-semibold mb-2">Refund History</p>
                            <div className="space-y-2">
                                {payment.refunds.map((refund: any) => (
                                    <div key={refund.id} className="bg-slate-50 p-2 rounded text-sm flex justify-between items-center">
                                        <span>Refund Request</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${refund.status === 'Approved' ? 'text-green-700 bg-green-100' :
                                            refund.status === 'Pending' ? 'text-orange-700 bg-orange-100' :
                                                'text-red-700 bg-red-100'
                                            }`}>
                                            {refund.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-4 print:hidden">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Receipt
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </div>

                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-receipt, #printable-receipt * {
                            visibility: visible;
                        }
                        #printable-receipt {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            margin: 0;
                            padding: 20px;
                            background: white;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                        @page {
                            size: auto;
                            margin: 0mm;
                        }
                        html, body {
                            height: 100%;
                            overflow: hidden;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
