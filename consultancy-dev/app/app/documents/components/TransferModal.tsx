'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, FileText, User } from 'lucide-react';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentName: string;
    studentName: string;
    users: any[];
    onTransfer: (receiverId: string, message: string) => void;
    isPending: boolean;
}

export function TransferModal({ isOpen, onClose, documentName, studentName, users, onTransfer, isPending }: TransferModalProps) {
    const [receiverId, setReceiverId] = useState('');
    const [message, setMessage] = useState('');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setReceiverId('');
            setMessage('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!receiverId) return;
        onTransfer(receiverId, message);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send size={18} className="text-teal-600" />
                        Transfer Document
                    </DialogTitle>
                    <DialogDescription>
                        Select a recipient and optionally add a message.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Document Info */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900 text-sm truncate max-w-[280px]">{documentName}</p>
                                <p className="text-xs text-slate-500">{studentName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Recipient Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Transfer To</Label>
                        <Select value={receiverId} onValueChange={setReceiverId}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select recipient..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            <span>
                                                {u.first_name || u.username} {u.last_name || ''}
                                            </span>
                                            <span className="text-xs text-slate-400">({u.username})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Message (Optional)</Label>
                        <Textarea
                            placeholder="Add a note to this transfer..."
                            className="resize-none h-20 text-sm"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                            onClick={handleSubmit}
                            disabled={!receiverId || isPending}
                        >
                            {isPending ? 'Sending...' : 'Send Transfer'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
