import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { MessageSquare, User, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StudentRemarkListProps {
    registrationId: string;
}

export function StudentRemarkList({ registrationId }: StudentRemarkListProps) {
    const queryClient = useQueryClient();
    const [newRemark, setNewRemark] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const { data: remarks, isLoading } = useQuery({
        queryKey: ['student-remarks', registrationId],
        queryFn: () => apiClient.studentRemarks.list(registrationId),
        enabled: !!registrationId
    });

    const createMutation = useMutation({
        mutationFn: (remark: string) => apiClient.studentRemarks.create({ registration: registrationId, remark }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-remarks', registrationId] });
            setNewRemark('');
            setIsAdding(false);
            toast.success('Remark added');
        },
        onError: () => toast.error('Failed to add remark'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRemark.trim()) return;
        createMutation.mutate(newRemark);
    };

    if (isLoading) return <div className="text-center py-4 text-slate-400">Loading remarks...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} />
                    Student Remarks
                </h3>
                <Button size="sm" onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "ghost" : "default"}>
                    {isAdding ? 'Cancel' : <><Plus size={14} className="mr-1" /> Add Remark</>}
                </Button>
            </div>

            {isAdding && (
                <Card className="border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <CardContent className="p-4">
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <Textarea
                                placeholder="Enter remark..."
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={createMutation.isPending} size="sm">
                                    {createMutation.isPending ? 'Saving...' : 'Save Remark'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {remarks && remarks.length > 0 ? (
                    remarks.map((remark: any) => (
                        <Card key={remark.id} className="border border-slate-100 shadow-sm bg-white">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                            <User size={10} />
                                            <span className="font-medium">{remark.userName || remark.user_name || 'Unknown'}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{format(new Date(remark.createdAt || remark.created_at), 'dd MMM yyyy, h:mm a')}</span>
                                    </div>
                                </div>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{remark.remark}</p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No remarks yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
