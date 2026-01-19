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
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
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

      {/* Registration List with passed filter state */}
      <RegistrationList isFilterOpen={isFilterOpen} />
    </div>
  );
}
