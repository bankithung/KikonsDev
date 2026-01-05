'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentList } from './components/DocumentList';
import { DocumentExpiry } from './components/DocumentExpiry';
import { DocumentTransfer } from './components/DocumentTransfer';
import { DocumentTracking } from './components/DocumentTracking';

export default function DocumentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900">Documents Management</h1>
                <p className="text-slate-600">Manage, track, and transfer student documents</p>
            </div>

            <Tabs defaultValue="all" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger
                        value="all"
                        className="rounded-md data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                    >
                        All Documents
                    </TabsTrigger>
                    {/* <TabsTrigger
                        value="expiry"
                        className="rounded-md data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                    >
                        Expiry
                    </TabsTrigger> */}
                    <TabsTrigger
                        value="transfer"
                        className="rounded-md data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                    >
                        Transfer
                    </TabsTrigger>
                    <TabsTrigger
                        value="tracking"
                        className="rounded-md data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                    >
                        Tracking
                    </TabsTrigger>
                </TabsList>

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
