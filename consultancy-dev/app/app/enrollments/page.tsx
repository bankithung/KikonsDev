'use client';

import { useState } from 'react';
import { EnrollmentList } from './components/EnrollmentList';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Search } from 'lucide-react';

export default function EnrollmentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-2">
      {/* Search & New Enrollment Button - Same Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or enrollment number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
          />
        </div>
        <Button onClick={() => router.push('/app/enrollments/new')} size="sm" className="h-9 text-xs bg-teal-600 hover:bg-teal-700 shrink-0">
          <GraduationCap className="mr-1 h-3 w-3" /> New Enrollment
        </Button>
      </div>

      <EnrollmentList searchTerm={searchTerm} />
    </div>
  );
}
