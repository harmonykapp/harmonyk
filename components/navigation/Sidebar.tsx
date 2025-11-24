'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Layers,
  Hammer,
  Vault,
  Play,
  Share2,
  FileSignature,
  Settings,
  Activity,
  Plug,
  BarChart3,
  Calendar,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type NavigationSubitem = {
  name: string;
  href: string;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  hasSubmenu?: boolean;
  submenu?: NavigationSubitem[];
};

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workbench', href: '/workbench', icon: Layers },
  { name: 'Builder', href: '/builder', icon: Hammer },
  { name: 'Playbooks', href: '/playbooks', icon: Play },
  { name: 'Vault', href: '/vault', icon: Vault },
  { name: 'Share', href: '/share', icon: Share2 },
  { name: 'Signatures', href: '/signatures', icon: FileSignature },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Settings']);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <div className="w-64 bg-sidebar border-r flex flex-col h-full" suppressHydrationWarning>
      <div className="px-6 py-5 border-b" suppressHydrationWarning>
        <Link href="/dashboard" className="flex items-center group" suppressHydrationWarning>
          <Image
            src="/Monologo_horizontal-transp copy.png"
            alt="Monolyth"
            width={160}
            height={40}
            className="h-10 w-auto dark:hidden"
            priority
            suppressHydrationWarning
          />
          <Image
            src="/Monologo_horizontal-dark-transp.png"
            alt="Monolyth"
            width={160}
            height={40}
            className="h-10 w-auto hidden dark:block"
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

