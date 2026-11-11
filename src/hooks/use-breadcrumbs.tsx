'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = { title: string; link: string };

// Human-readable labels for each URL segment
const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  overview: 'Overview',
  equipment: 'Equipment',
  members: 'Members',
  loans: 'Loans',
  overdue: 'Overdue',
  reports: 'Reports',
  users: 'Users',
  settings: 'Settings'
};

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      title: labels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
      link: '/' + segments.slice(0, index + 1).join('/')
    }));
  }, [pathname]);
}
