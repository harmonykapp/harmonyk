// PGW4: Single source of truth for sidebar navigation (desktop + mobile).
// Keep ordering workflow-first and gate feature routes behind UI flags.

import { flag } from '@/lib/ui/flags';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CheckSquare,
  Database,
  Gauge,
  Hammer,
  LayoutGrid,
  Layers,
  Play,
  Plug,
  Settings,
  Share2,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  /**
   * Optional gate for items that should be hidden unless explicitly enabled.
   * Note: In client code this only sees NEXT_PUBLIC_* env values.
   */
  enabled?: boolean;
  /**
   * Optional custom active matcher (e.g. Share Hub should include /signatures).
   */
  isActive?: (pathname: string | null) => boolean;
};

export function getSidebarNavigation(): NavItem[] {
  const roomsEnabled = flag('rooms.enabled');

  return [
    { name: 'Dashboard', href: '/dashboard', icon: Gauge },
    { name: 'Builder', href: '/builder', icon: Hammer },
    { name: 'Vault', href: '/vault', icon: Database },
    { name: 'Rooms', href: '/rooms', icon: LayoutGrid, enabled: roomsEnabled },
    { name: 'Workbench', href: '/workbench', icon: Layers },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    {
      name: 'Share Hub',
      href: '/share',
      icon: Share2,
      isActive: (pathname) => {
        if (!pathname) return false;
        return (
          pathname === '/share' ||
          pathname.startsWith('/share/') ||
          pathname === '/signatures' ||
          pathname.startsWith('/signatures/')
        );
      },
    },
    { name: 'Playbooks', href: '/playbooks', icon: Play },
    { name: 'Insights', href: '/insights', icon: BarChart3 },
    { name: 'Integrations', href: '/integrations', icon: Plug },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
}

export function isNavItemActive(item: NavItem, pathname: string | null): boolean {
  if (item.isActive) return item.isActive(pathname);
  if (!pathname) return false;
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
