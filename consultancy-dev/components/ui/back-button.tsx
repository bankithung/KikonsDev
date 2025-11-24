'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({ label = 'Back', className }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className={`text-slate-600 hover:text-slate-900 hover:bg-slate-100 ${className}`}
    >
      <ArrowLeft size={16} className="mr-2" />
      {label}
    </Button>
  );
}

