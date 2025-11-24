'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegistrationList } from './components/RegistrationList';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export default function RegistrationsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Registrations</h1>
          <p className="text-sm text-slate-600 mt-1">Track all registered students</p>
        </div>
        <Button onClick={() => router.push('/app/registrations/new')} className="h-9 bg-teal-600 hover:bg-teal-700">
          <UserPlus className="mr-2 h-4 w-4" /> New Registration
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-1 h-11">
          <TabsTrigger value="list" className="text-sm font-medium">Registered Students</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6">
          <RegistrationList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
