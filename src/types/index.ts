import { Icons } from '@/components/icons';

// A single item in the sidebar navigation
export interface NavItem {
  title: string;
  url: string;
  icon?: keyof typeof Icons;
  shortcut?: [string, string];
  isActive?: boolean;
  items?: NavItem[];
}

// A labelled group of nav items (e.g. "Main", "Admin")
export interface NavGroup {
  label: string;
  items: NavItem[];
}
