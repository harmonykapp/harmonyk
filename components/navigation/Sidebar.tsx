'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CheckSquare,
  ChevronDown,
  Hammer,
  Layers,
  LayoutDashboard,
  Play,
  Plug,
  Settings,
  Share2,
  Vault
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type NavigationSubitem = {
  name: string;
  href: string;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
  submenu?: NavigationSubitem[];
};

type NavItemOverride = {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const navigationDefault: NavigationItem[] = [
  // Core GA top-level routes (NORTH_STAR order)
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workbench', href: '/workbench', icon: Layers },
  { name: 'Builder', href: '/builder', icon: Hammer },
  { name: 'Vault', href: '/vault', icon: Vault },
  { name: 'Playbooks', href: '/playbooks', icon: Play },
  { name: 'Share Hub', href: '/share', icon: Share2 },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ navOverride }: { navOverride?: NavItemOverride[] }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Settings']);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  // Convert navOverride to NavigationItem format
  const navigation: NavigationItem[] = navOverride
    ? navOverride.map((item) => ({
      name: item.title,
      href: item.href,
      icon: (item.icon || LayoutDashboard) as LucideIcon,
    }))
    : navigationDefault;

  return (
    <div className="w-64 bg-sidebar border-r flex flex-col h-full" suppressHydrationWarning>
      <div className="px-6 py-5 border-b" suppressHydrationWarning>
        <Link href="/dashboard" className="flex items-center group" suppressHydrationWarning>
          <Image
            src="/brand/harmonyk-logo-horizontal.png"
            alt="Harmonyk"
            width={160}
            height={32}
            className="block h-8 w-auto dark:hidden"
            priority
            suppressHydrationWarning
          />
          <Image
            src="/brand/harmonyk-logo-horizontal-dark.png"
            alt="Harmonyk"
            width={160}
            height={32}
            className="hidden h-8 w-auto dark:block"
            priority
            suppressHydrationWarning
          />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" suppressHydrationWarning>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const isExpanded = expandedItems.includes(item.name);
          const Icon = item.icon;

          if (item.hasSubmenu && item.submenu) {
            const hasActiveSubmenu = item.submenu.some(
              (subitem) => pathname === subitem.href || pathname?.startsWith(subitem.href + '/')
            );

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive || hasActiveSubmenu
                      ? 'bg-sidebar-active text-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-active/50 hover:text-sidebar-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isExpanded ? 'transform rotate-180' : ''
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map((subitem) => {
                      const isSubitemActive =
                        pathname === subitem.href || pathname?.startsWith(subitem.href + '/');
                      return (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isSubitemActive
                              ? 'bg-sidebar-active text-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-active/50 hover:text-sidebar-foreground'
                          )}
                          suppressHydrationWarning
                        >
                          {subitem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-active/50 hover:text-sidebar-foreground'
              )}
              suppressHydrationWarning
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

