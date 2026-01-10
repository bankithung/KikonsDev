'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompleteFollowUpModalProps {
    followUp: {
        id: string;
        studentName: string;
        type: string;
    } | null;
    open: boolean;
    onClose: () => void;
    onComplete: (comment: string) => void;
    isLoading?: boolean;
}

export function CompleteFollowUpModal({
    followUp,
    open,
    onClose,
    onComplete,
    isLoading
}: CompleteFollowUpModalProps) {
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!comment.trim()) {
            toast.error('Please enter a completion comment');
            return;
        }

        onComplete(comment);
        setComment('');
    };

    return (
        <Dialog.Root open={open} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50 animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-[50%] top-[50%] w-[95vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-8 shadow-xl z-50 border border-slate-100 animate-in zoom-in-95 duration-300">
                    <div className="space-y-1 mb-8">
                        <Dialog.Title className="text-xl font-semibold text-slate-900 tracking-tight">Complete Follow-up</Dialog.Title>
                        <p className="text-[13px] text-slate-400 font-medium">Record the outcome of your interaction</p>
                    </div>

                    {followUp && (
                        <div className="mb-8 flex items-center gap-6 py-4 border-y border-slate-50">
                            <div>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Student</p>
                                <p className="text-sm font-semibold text-slate-700">{followUp.studentName}</p>
                            </div>
                            <div className="h-6 w-[1px] bg-slate-100" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Interaction</p>
                                <p className="text-sm font-semibold text-slate-700">{followUp.type}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                                Completion Notes <span className="text-red-400">*</span>
                            </label>
                            <Textarea
                                placeholder="Describe the outcome (e.g., Contacted student, explained program details...)"
                                value={comment}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                                className="w-full min-h-[120px] resize-none border-slate-100 bg-white rounded-xl focus:ring-slate-900/5 px-4 py-3 text-sm font-medium font-body placeholder:text-slate-300 shadow-none transition-all"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 h-11 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-all shadow-sm"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : 'Mark as Complete'}
                            </Button>
                        </div>
                    </form>

                    <Dialog.Close asChild>
                        <button
                            className="absolute top-6 right-6 p-2 rounded-lg hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-colors"
                            disabled={isLoading}
                        >
                            <X size={18} />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
