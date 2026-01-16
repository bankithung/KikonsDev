'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface CompleteFollowUpModalProps {
    followUp: {
        id: string;
        studentName: string;
        student_email?: string;
        student_phone?: string;
        type: string;
    } | null;
    open: boolean;
    onClose: () => void;
    onComplete: (data: { comment: string, outcomeStatus: string, admissionPossibility: number }) => void;
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
    const [outcomeStatus, setOutcomeStatus] = useState('Neutral');
    const [admissionPossibility, setAdmissionPossibility] = useState([50]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!comment.trim()) {
            toast.error('Please enter a completion comment');
            return;
        }

        onComplete({
            comment,
            outcomeStatus,
            admissionPossibility: admissionPossibility[0]
        });
        setComment('');
        setOutcomeStatus('Neutral');
        setAdmissionPossibility([50]);
    };

    return (
        <Dialog.Root open={open} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-[50%] top-[50%] w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-8 shadow-2xl z-50 border border-slate-100 animate-in zoom-in-95 duration-300">
                    <div className="space-y-1 mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-900 tracking-tight">Complete Follow-up</Dialog.Title>
                        <Dialog.Description className="text-xs text-slate-500 font-medium">Record the outcome and student interest level.</Dialog.Description>
                    </div>

                    {followUp && (
                        <div className="mb-6 flex items-center gap-6 py-3 border-y border-slate-100 bg-slate-50/50 -mx-8 px-8">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Student</p>
                                <p className="text-sm font-bold text-slate-800">{followUp.studentName}</p>
                                {followUp.student_email && <p className="text-xs text-slate-500 font-medium">{followUp.student_email}</p>}
                                {followUp.student_phone && <p className="text-xs text-slate-500 font-medium">{followUp.student_phone}</p>}
                            </div>
                            <div className="h-8 w-[1px] bg-slate-200" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Interaction</p>
                                <p className="text-sm font-bold text-slate-800">{followUp.type}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Outcome Status */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Outcome Status</Label>
                            <RadioGroup value={outcomeStatus} onValueChange={setOutcomeStatus} className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'Positive', label: 'Positive (Admission Taken)', color: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
                                    { value: 'High Interest', label: 'High Interest', color: 'border-blue-200 bg-blue-50 text-blue-900' },
                                    { value: 'Neutral', label: 'Neutral (Undecided)', color: 'border-slate-200 bg-white text-slate-700' },
                                    { value: 'Low Interest', label: 'Low Interest', color: 'border-slate-200 bg-white text-slate-600' },
                                    { value: 'Negative', label: 'Negative (Not Interested)', color: 'border-rose-200 bg-rose-50 text-rose-900' },
                                    { value: 'Follow Up Later', label: 'Follow Up Later', color: 'border-amber-200 bg-amber-50 text-amber-900' },
                                ].map((option) => (
                                    <div key={option.value}>
                                        <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                                        <Label
                                            htmlFor={option.value}
                                            className={`flex items-center justify-between px-3 py-2.5 border-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 peer-data-[state=checked]:border-slate-900 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-slate-900 ${option.color}`}
                                        >
                                            <span className="text-xs font-semibold">{option.label}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Admission Possibility */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Admission Possibility</Label>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${admissionPossibility[0] >= 75 ? 'bg-emerald-100 text-emerald-700' : admissionPossibility[0] >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {admissionPossibility[0]}%
                                </span>
                            </div>
                            <Slider
                                value={admissionPossibility}
                                onValueChange={setAdmissionPossibility}
                                max={100}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                                <span>Unlikely</span>
                                <span>Possible</span>
                                <span>Likely</span>
                                <span>Certain</span>
                            </div>
                        </div>

                        {/* Completion Notes */}
                        <div className="space-y-2 pt-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Completion Notes <span className="text-rose-500">*</span>
                            </label>
                            <Textarea
                                placeholder="Describe the detailed outcome..."
                                value={comment}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                                className="w-full min-h-[100px] resize-none border-slate-200 bg-white rounded-xl focus:ring-slate-900 px-4 py-3 text-sm font-medium placeholder:text-slate-300"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
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
                                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-all shadow-lg shadow-slate-900/20"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : 'Mark as Complete'}
                            </Button>
                        </div>
                    </form>

                    <Dialog.Close asChild>
                        <button
                            className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
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
