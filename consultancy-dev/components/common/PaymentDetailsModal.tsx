import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Wallet, CreditCard, Banknote, QrCode, Landmark, Download, FileText, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useRef, useCallback } from "react";

interface PaymentDetailsModalProps {
    open: boolean;
    onClose: () => void;
    payment: any;
    studentName: string;
}

export function PaymentDetailsModal({ open, onClose, payment, studentName }: PaymentDetailsModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!payment) return null;

    // Robust iframe-based print function
    const handlePrint = useCallback(() => {
        if (!printRef.current) return;

        // Get the HTML content to print
        const printContent = printRef.current.innerHTML;

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        // Write content to iframe
        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) {
            document.body.removeChild(iframe);
            return;
        }

        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        padding: 40px;
                        background: white;
                        color: #1e293b;
                        line-height: 1.5;
                    }
                    .receipt-header {
                        text-align: center;
                        padding-bottom: 24px;
                        border-bottom: 2px dashed #e2e8f0;
                        margin-bottom: 24px;
                    }
                    .receipt-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-bottom: 4px;
                    }
                    .receipt-subtitle {
                        font-size: 12px;
                        color: #64748b;
                    }
                    .amount-block {
                        text-align: center;
                        padding: 24px 0;
                        border-bottom: 1px dashed #e2e8f0;
                        margin-bottom: 24px;
                    }
                    .amount-label {
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #94a3b8;
                        margin-bottom: 4px;
                    }
                    .amount-value {
                        font-size: 36px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 4px 12px;
                        border-radius: 9999px;
                        font-size: 11px;
                        font-weight: 600;
                        margin-top: 8px;
                    }
                    .status-success {
                        background: #dcfce7;
                        color: #166534;
                    }
                    .status-pending {
                        background: #fef9c3;
                        color: #854d0e;
                    }
                    .status-failed {
                        background: #fee2e2;
                        color: #991b1b;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px 32px;
                        margin-bottom: 24px;
                    }
                    .detail-item {
                        margin-bottom: 8px;
                    }
                    .detail-label {
                        font-size: 10px;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 2px;
                    }
                    .detail-value {
                        font-size: 14px;
                        font-weight: 500;
                        color: #0f172a;
                    }
                    .col-span-2 {
                        grid-column: span 2;
                    }
                    .method-details {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 12px;
                        margin-top: 16px;
                    }
                    .method-title {
                        font-size: 11px;
                        font-weight: 600;
                        color: #4f46e5;
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 8px;
                        margin-bottom: 12px;
                    }
                    .refund-section {
                        margin-top: 24px;
                        padding-top: 16px;
                        border-top: 1px solid #e2e8f0;
                    }
                    .refund-title {
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #64748b;
                        margin-bottom: 12px;
                    }
                    .refund-item {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        padding: 10px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }
                    .footer {
                        margin-top: 32px;
                        padding-top: 16px;
                        border-top: 1px solid #e2e8f0;
                        text-align: center;
                        font-size: 10px;
                        color: #94a3b8;
                    }
                    @page {
                        size: auto;
                        margin: 10mm;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <div class="receipt-title">Payment Receipt</div>
                    <div class="receipt-subtitle">Transaction ID: ${String(payment.id)}</div>
                </div>
                
                <div class="amount-block">
                    <div class="amount-label">Total Paid</div>
                    <div class="amount-value">₹${Number(payment.amount).toLocaleString()}</div>
                    <span class="status-badge ${payment.status === 'Success' ? 'status-success' : payment.status === 'Pending' ? 'status-pending' : 'status-failed'}">
                        ${payment.status}
                    </span>
                </div>

                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Date & Time</div>
                        <div class="detail-value">${format(new Date(payment.date), 'dd MMM yyyy')}</div>
                        <div style="font-size: 11px; color: #64748b;">${format(new Date(payment.date), 'hh:mm a')}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Method</div>
                        <div class="detail-value">${payment.method}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Student Name</div>
                        <div class="detail-value">${studentName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Type</div>
                        <div class="detail-value">${payment.type}</div>
                    </div>
                    ${payment.referenceNumber ? `
                    <div class="detail-item col-span-2">
                        <div class="detail-label">Reference Number</div>
                        <div class="detail-value" style="font-family: monospace;">${payment.referenceNumber}</div>
                    </div>
                    ` : ''}
                </div>

                ${getMethodDetailsHTML(payment)}

                ${payment.refunds && payment.refunds.length > 0 ? `
                <div class="refund-section">
                    <div class="refund-title">Refund History</div>
                    ${payment.refunds.map((refund: any) => `
                        <div class="refund-item">
                            <div>
                                <div style="font-size: 12px; font-weight: 500;">Refund Request</div>
                                <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">ID: ${String(refund.id).substring(0, 8)}</div>
                            </div>
                            <div style="text-align: right;">
                                <span class="status-badge ${refund.status === 'Approved' ? 'status-success' : refund.status === 'Pending' ? 'status-pending' : 'status-failed'}" style="font-size: 9px; padding: 2px 8px;">
                                    ${refund.status}
                                </span>
                                <div style="font-size: 12px; font-weight: 600; margin-top: 4px;">₹${Number(refund.amount).toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div class="footer">
                    This is a computer-generated receipt. Thank you for your payment.
                </div>
            </body>
            </html>
        `);
        iframeDoc.close();

        // Wait for content to load, then print
        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();

                // Clean up after print dialog closes
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 250);
        };
    }, [payment, studentName]);

    // Helper function to generate method-specific HTML for print
    function getMethodDetailsHTML(payment: any): string {
        const meta = payment.metadata || {};
        let metadata = meta;
        if (typeof meta === 'string') {
            try {
                metadata = JSON.parse(meta);
            } catch (e) {
                // keep as is
            }
        }

        switch (payment.method) {
            case 'Card':
                return `
                <div class="method-details">
                    <div class="method-title">💳 Card Details</div>
                    <div class="details-grid" style="margin-bottom: 0;">
                        <div class="detail-item">
                            <div class="detail-label">Network</div>
                            <div class="detail-value">${metadata.cardNetwork || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Last 4 Digits</div>
                            <div class="detail-value">•••• ${metadata.cardLast4 || 'N/A'}</div>
                        </div>
                        ${metadata.transactionId ? `
                        <div class="detail-item col-span-2">
                            <div class="detail-label">Transaction ID</div>
                            <div class="detail-value" style="font-family: monospace;">${metadata.transactionId}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>`;
            case 'Cheque':
                return `
                <div class="method-details">
                    <div class="method-title">🧾 Cheque Details</div>
                    <div class="details-grid" style="margin-bottom: 0;">
                        <div class="detail-item">
                            <div class="detail-label">Cheque No</div>
                            <div class="detail-value" style="font-family: monospace;">${metadata.chequeNo || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Cheque Date</div>
                            <div class="detail-value">${metadata.chequeDate ? format(new Date(metadata.chequeDate), 'dd MMM yyyy') : 'N/A'}</div>
                        </div>
                        <div class="detail-item col-span-2">
                            <div class="detail-label">Bank Name</div>
                            <div class="detail-value">${metadata.bankName || 'N/A'}</div>
                        </div>
                    </div>
                </div>`;
            case 'Bank Transfer':
                return `
                <div class="method-details">
                    <div class="method-title">🏦 Bank Transfer Details</div>
                    <div class="details-grid" style="margin-bottom: 0;">
                        <div class="detail-item col-span-2">
                            <div class="detail-label">Bank Name</div>
                            <div class="detail-value">${metadata.bankName || 'N/A'}</div>
                        </div>
                        <div class="detail-item col-span-2">
                            <div class="detail-label">Transaction ID / Ref</div>
                            <div class="detail-value" style="font-family: monospace;">${metadata.transactionId || 'N/A'}</div>
                        </div>
                    </div>
                </div>`;
            case 'UPI':
                return `
                <div class="method-details">
                    <div class="method-title">📱 UPI Details</div>
                    <div class="details-grid" style="margin-bottom: 0;">
                        <div class="detail-item col-span-2">
                            <div class="detail-label">UPI ID</div>
                            <div class="detail-value">${metadata.upiId || 'N/A'}</div>
                        </div>
                        <div class="detail-item col-span-2">
                            <div class="detail-label">Transaction ID</div>
                            <div class="detail-value" style="font-family: monospace;">${metadata.transactionId || 'N/A'}</div>
                        </div>
                    </div>
                </div>`;
            default:
                return '';
        }
    }

    // Helper to render method-specific details for modal view
    const renderMethodDetails = () => {
        const meta = payment.metadata || {};
        let metadata = meta;
        if (typeof meta === 'string') {
            try {
                metadata = JSON.parse(meta);
            } catch (e) {
                // keep as is if parse fails
            }
        }

        switch (payment.method) {
            case 'Card':
                return (
                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 mt-2">
                        <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-xs border-b border-indigo-100 pb-1">
                            <CreditCard size={12} /> Card Details
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-slate-500 block">Network</span>
                                <span className="font-medium text-slate-700">{metadata.cardNetwork || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Last 4 Digits</span>
                                <span className="font-medium text-slate-700">•••• {metadata.cardLast4 || 'N/A'}</span>
                            </div>
                            {metadata.transactionId && (
                                <div className="col-span-2">
                                    <span className="text-slate-500 block">Transaction ID</span>
                                    <span className="font-medium text-slate-700 font-mono">{metadata.transactionId}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'Cheque':
                return (
                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 mt-2">
                        <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-xs border-b border-indigo-100 pb-1">
                            <Banknote size={12} /> Cheque Details
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-slate-500 block">Cheque No</span>
                                <span className="font-medium text-slate-700 font-mono">{metadata.chequeNo || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Date</span>
                                <span className="font-medium text-slate-700">{metadata.chequeDate ? format(new Date(metadata.chequeDate), 'dd MMM yyyy') : 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-500 block">Bank Name</span>
                                <span className="font-medium text-slate-700">{metadata.bankName || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'Bank Transfer':
                return (
                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 mt-2">
                        <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-xs border-b border-indigo-100 pb-1">
                            <Landmark size={12} /> Transfer Details
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="col-span-2">
                                <span className="text-slate-500 block">Bank Name</span>
                                <span className="font-medium text-slate-700">{metadata.bankName || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-500 block">Transaction ID / Ref</span>
                                <span className="font-medium text-slate-700 font-mono">{metadata.transactionId || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'UPI':
                return (
                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 mt-2">
                        <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-xs border-b border-indigo-100 pb-1">
                            <QrCode size={12} /> UPI Details
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="col-span-2">
                                <span className="text-slate-500 block">UPI ID</span>
                                <span className="font-medium text-slate-700">{metadata.upiId || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-500 block">Transaction ID</span>
                                <span className="font-medium text-slate-700 font-mono">{metadata.transactionId || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="fixed left-[50%] top-[50%] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl z-50 border border-slate-200 overflow-hidden outline-none p-0 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">Payment Receipt</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 font-medium">
                                Transaction ID: <span className="font-mono text-slate-700">{String(payment.id).substring(0, 8)}...</span>
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div ref={printRef} className="p-6 overflow-y-auto max-h-[70vh]">
                    {/* Amount Block */}
                    <div className="text-center py-6 border-b border-dashed border-slate-200">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">₹{Number(payment.amount).toLocaleString()}</h1>
                        <div className="mt-2 flex justify-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${payment.status === 'Success' ? 'bg-green-50 text-green-700 border-green-100' :
                                payment.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                    'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                {payment.status}
                            </span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 py-6">
                        <div>
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Calendar size={12} /> Date & Time</p>
                            <p className="text-sm font-medium text-slate-900">{format(new Date(payment.date), 'dd MMM yyyy')}</p>
                            <p className="text-xs text-slate-500">{format(new Date(payment.date), 'hh:mm a')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Wallet size={12} /> Payment Method</p>
                            <p className="text-sm font-medium text-slate-900">{payment.method}</p>
                        </div>

                        <div className="col-span-2">
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><FileText size={12} /> Description / Type</p>
                            <p className="text-sm font-medium text-slate-900">{payment.type}</p>
                            {payment.referenceNumber && (
                                <p className="text-xs text-slate-500 mt-1">Ref: <span className="font-mono">{payment.referenceNumber}</span></p>
                            )}
                        </div>

                        {/* Method Specific Details */}
                        <div className="col-span-2">
                            {renderMethodDetails()}
                        </div>
                    </div>

                    {/* Refund Section if exists */}
                    {payment.refunds && payment.refunds.length > 0 && (
                        <div className="mt-2 pt-4 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Refund History</p>
                            <div className="space-y-2">
                                {payment.refunds.map((refund: any) => (
                                    <div key={refund.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center bg-opacity-50">
                                        <div>
                                            <p className="text-xs font-medium text-slate-700">Refund Request</p>
                                            <p className="text-[10px] text-slate-400 font-mono">ID: {String(refund.id).substring(0, 8)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${refund.status === 'Approved' ? 'text-green-700 bg-green-100' :
                                                refund.status === 'Pending' ? 'text-orange-700 bg-orange-100' :
                                                    'text-red-700 bg-red-100'
                                                }`}>
                                                {refund.status}
                                            </span>
                                            <p className="text-xs font-bold text-slate-900 mt-0.5">₹{Number(refund.amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 w-full sm:w-auto text-xs gap-2">
                        <Printer size={14} /> Print Receipt
                    </Button>
                    <Button size="sm" onClick={onClose} className="h-9 w-full sm:w-auto text-xs bg-slate-900 text-white hover:bg-slate-800">
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
