import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Equipment',
        url: '/dashboard/equipment',
        icon: 'cpu',
        shortcut: ['e', 'e'],
        isActive: false,
        items: []
      },
      {
        title: 'Members',
        url: '/dashboard/members',
        icon: 'teams',
        shortcut: ['m', 'm'],
        isActive: false,
        items: []
      },
      {
        title: 'Loans',
        url: '/dashboard/loans',
        icon: 'arrowsExchange',
        shortcut: ['l', 'l'],
        isActive: false,
        items: []
      },
      {
        title: 'Overdue',
        url: '/dashboard/overdue',
        icon: 'warning',
        shortcut: ['o', 'o'],
        isActive: false,
        items: []
      },
      {
        title: 'Reports',
        url: '/dashboard/reports',
        icon: 'chartBar',
        shortcut: ['r', 'r'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Admin',
    items: [
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'shieldLock',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      }
    ]
  }
];
