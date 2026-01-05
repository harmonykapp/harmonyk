'use client';

import { cn } from '@/lib/utils';
import { tokens } from '@/lib/ui/tokens';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Hammer,
  Layers,
  LayoutDashboard,
  Menu,
  Play,
  Plug,
  Settings,
  Share2,
  Vault,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const navigationDefault: NavigationItem[] = [
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

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setMobileOpen(true)}
      >
        <Menu style={{ width: tokens.iconSize.lg, height: tokens.iconSize.lg }} />
      </Button>

      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar border-r transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
        style={{ height: '100vh' }}
        suppressHydrationWarning
      >
        <div
          className={cn('border-b flex items-center', collapsed ? 'justify-center px-2' : 'px-6')}
          style={{ height: tokens.layout.topbarHeight }}
          suppressHydrationWarning
        >
          {!collapsed && (
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
          )}
          {collapsed && (
            <Link href="/dashboard" suppressHydrationWarning>
              <Image
                src="/brand/harmonyk-mark.png"
                alt="Harmonyk"
                width={32}
                height={32}
                className="h-8 w-8"
                priority
                suppressHydrationWarning
              />
            </Link>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto" style={{ padding: tokens.spacing[3] }} suppressHydrationWarning>
          <div className="space-y-1">
            {navigationDefault.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                    collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-sidebar-active text-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-active/50 hover:text-sidebar-foreground'
                  )}
                  title={collapsed ? item.name : undefined}
                  suppressHydrationWarning
                >
                  <Icon style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {onToggle && (
          <div className="border-t" style={{ padding: tokens.spacing[3] }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn('w-full', collapsed && 'px-2')}
            >
              {collapsed ? (
                <ChevronRight style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }} />
              ) : (
                <>
                  <ChevronLeft style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }} />
                  <span className="ml-2">Collapse</span>
                </>
              )}
            </Button>
          </div>
        )}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-6" style={{ height: tokens.layout.topbarHeight, display: 'flex', alignItems: 'center' }}>
            <SheetTitle>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Image
                  src="/brand/harmonyk-logo-horizontal.png"
                  alt="Harmonyk"
                  width={160}
                  height={32}
                  className="block h-8 w-auto dark:hidden"
                  priority
                />
                <Image
                  src="/brand/harmonyk-logo-horizontal-dark.png"
                  alt="Harmonyk"
                  width={160}
                  height={32}
                  className="hidden h-8 w-auto dark:block"
                  priority
                />
              </Link>
            </SheetTitle>
          </SheetHeader>
          <nav className="overflow-y-auto" style={{ padding: tokens.spacing[3], height: `calc(100vh - ${tokens.layout.topbarHeight})` }}>
            <div className="space-y-1">
              {navigationDefault.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-active text-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-active/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
