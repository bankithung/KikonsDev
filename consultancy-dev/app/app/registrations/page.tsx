'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus, Filter } from 'lucide-react';
import { RegistrationList } from './components/RegistrationList';
import { useState } from 'react';

export default function RegistrationsPage() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Registrations</h1>
          <p className="text-xs text-slate-500">Track all registered students</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="mr-1 h-3 w-3" /> Filters
          </Button>
          <Button
            onClick={() => router.push('/app/registrations/new')}
            size="sm"
            className="h-8 text-xs bg-teal-600 hover:bg-teal-700"
          >
            <UserPlus className="mr-1 h-3 w-3" /> New Registration
          </Button>
        </div>
      </div>

      {/* Registration List with passed filter state */}
      <RegistrationList isFilterOpen={isFilterOpen} />
    </div>
  );
}
