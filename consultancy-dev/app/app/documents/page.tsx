'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentList } from './components/DocumentList';
import { DocumentTransfer } from './components/DocumentTransfer';
import { DocumentTracking } from './components/DocumentTracking';
import { PhysicalDocumentList } from './components/PhysicalDocumentList';
import { PhysicalDocumentTransfer } from './components/PhysicalDocumentTransfer';
import { FileText, FolderOpen, ArrowRightLeft, Send, Clock } from 'lucide-react';

export default function DocumentsPage() {
    return (
        <div className="space-y-2">

            <Tabs defaultValue="digital" className="w-full">
                <div className="border-b border-slate-200 mb-3">
                    <TabsList className="bg-transparent h-auto p-0 gap-1">
                        <TabsTrigger
                            value="digital"
                            className="relative h-9 bg-transparent px-3 pb-2.5 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:shadow-none font-medium text-sm transition-all flex items-center gap-1.5"
                        >
                            <FileText size={14} />
                            Digital Docs
                        </TabsTrigger>
                        <TabsTrigger
                            value="digital-transfer"
                            className="relative h-9 bg-transparent px-3 pb-2.5 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:shadow-none font-medium text-sm transition-all flex items-center gap-1.5"
                        >
                            <Send size={14} />
                            Digital Transfer
                        </TabsTrigger>
                        <TabsTrigger
                            value="physical"
                            className="relative h-9 bg-transparent px-3 pb-2.5 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:shadow-none font-medium text-sm transition-all flex items-center gap-1.5"
                        >
                            <FolderOpen size={14} />
                            Physical Docs
                        </TabsTrigger>
                        <TabsTrigger
                            value="physical-transfer"
                            className="relative h-9 bg-transparent px-3 pb-2.5 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:shadow-none font-medium text-sm transition-all flex items-center gap-1.5"
                        >
                            <ArrowRightLeft size={14} />
                            Physical Transfer
                        </TabsTrigger>
                        <TabsTrigger
                            value="tracking"
                            className="relative h-9 bg-transparent px-3 pb-2.5 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:shadow-none font-medium text-sm transition-all flex items-center gap-1.5"
                        >
                            <Clock size={14} />
                            Tracking
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="digital" className="outline-none mt-0">
                    <DocumentList />
                </TabsContent>

                <TabsContent value="digital-transfer" className="outline-none mt-0">
                    <DocumentTransfer />
                </TabsContent>

                <TabsContent value="physical" className="outline-none mt-0">
                    <PhysicalDocumentList />
                </TabsContent>

                <TabsContent value="physical-transfer" className="outline-none mt-0">
                    <PhysicalDocumentTransfer />
                </TabsContent>

                <TabsContent value="tracking" className="outline-none mt-0">
                    <DocumentTracking />
                </TabsContent>
            </Tabs>
        </div>
    );
}


