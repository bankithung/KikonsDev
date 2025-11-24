'use client';

import { EnrollmentList } from './components/EnrollmentList';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

export default function EnrollmentsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Enrollments</h1>
          <p className="text-sm text-slate-600 mt-1">Manage course enrollments and fee structures</p>
        </div>
        <Button onClick={() => router.push('/app/enrollments/new')} className="h-9 bg-teal-600 hover:bg-teal-700">
           <GraduationCap className="mr-2 h-4 w-4" /> New Enrollment
        </Button>
      </div>

      <EnrollmentList />
    </div>
  );
}
