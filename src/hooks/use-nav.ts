'use client';

import { useSession } from 'next-auth/react';
import type { NavItem, NavGroup } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return items.filter((item) => {
    // Hide Users page from non-ADMIN roles
    if (item.url === '/dashboard/users' && role !== 'ADMIN') {
      return false;
    }
    return true;
  });
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // Hide Users page from non-ADMIN roles
        if (item.url === '/dashboard/users' && role !== 'ADMIN') {
          return false;
        }
        return true;
      })
    }))
    .filter((group) => group.items.length > 0);
}
