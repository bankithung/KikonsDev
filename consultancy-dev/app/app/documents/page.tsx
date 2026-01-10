'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentList } from './components/DocumentList';
import { DocumentExpiry } from './components/DocumentExpiry';
import { DocumentTransfer } from './components/DocumentTransfer';
import { DocumentTracking } from './components/DocumentTracking';

export default function DocumentsPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Documents Management</h1>
                    <p className="text-slate-500 font-body">Manage, track, and transfer student documents with ease</p>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="border-b border-slate-200 mb-6">
                    <TabsList className="bg-transparent h-auto p-0 gap-8">
                        <TabsTrigger
                            value="all"
                            className="relative h-10 bg-transparent px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:shadow-none font-semibold transition-all"
                        >
                            All Documents
                        </TabsTrigger>
                        <TabsTrigger
                            value="transfer"
                            className="relative h-10 bg-transparent px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:shadow-none font-semibold transition-all"
                        >
                            Transfer
                        </TabsTrigger>
                        <TabsTrigger
                            value="tracking"
                            className="relative h-10 bg-transparent px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:shadow-none font-semibold transition-all"
                        >
                            Tracking
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="outline-none">
                    <DocumentList />
                </TabsContent>

                {/* <TabsContent value="expiry" className="outline-none">
                    <DocumentExpiry />
                </TabsContent> */}

                <TabsContent value="transfer" className="outline-none">
                    <DocumentTransfer />
                </TabsContent>

                <TabsContent value="tracking" className="outline-none">
                    <DocumentTracking />
                </TabsContent>
            </Tabs>
        </div>
    );
}
