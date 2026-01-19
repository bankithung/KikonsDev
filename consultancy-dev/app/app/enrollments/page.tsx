'use client';

import { useState } from 'react';
import { EnrollmentList } from './components/EnrollmentList';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap, Filter } from 'lucide-react';

export default function EnrollmentsPage() {
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
        <Button onClick={() => router.push('/app/enrollments/new')} size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700">
          <GraduationCap className="mr-1 h-3 w-3" /> New Enrollment
        </Button>
      </div>

      <EnrollmentList isFilterOpen={isFilterOpen} />
    </div>
  );
}
