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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

  const renderNavItem = (item: NavigationItem, isMobile = false) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const Icon = item.icon;

    const linkContent = (
      <Link
        key={item.name}
        href={item.href}
        onClick={isMobile ? () => setMobileOpen(false) : undefined}
        className={cn(
          'flex items-center rounded-lg text-sm transition-all relative',
          collapsed && !isMobile ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'bg-sidebar-active text-primary font-semibold'
            : 'text-sidebar-foreground hover:bg-sidebar-active/50 hover:text-sidebar-foreground font-medium'
        )}
        suppressHydrationWarning
      >
        {isActive && !isMobile && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r-full"
            style={{ height: '60%' }}
          />
        )}
        {isActive && isMobile && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r-full"
            style={{ height: '60%' }}
          />
        )}
        <Icon
          style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }}
          className="flex-shrink-0"
        />
        {(!collapsed || isMobile) && <span>{item.name}</span>}
      </Link>
    );

    if (collapsed && !isMobile) {
      return (
        <Tooltip key={item.name} delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p>{item.name}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

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
          'hidden lg:flex flex-col bg-sidebar border-r transition-[width] duration-200 ease-in-out'
        )}
        style={{
          height: '100vh',
          width: collapsed ? '64px' : '256px',
        }}
        suppressHydrationWarning
      >
        <div
          className={cn(
            'border-b flex items-center transition-all duration-200',
            collapsed ? 'justify-center' : ''
          )}
          style={{
            height: tokens.layout.topbarHeight,
            padding: collapsed ? tokens.spacing[3] : `${tokens.spacing[4]} ${tokens.spacing[3]}`,
          }}
          suppressHydrationWarning
        >
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center group pl-1" suppressHydrationWarning>
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
            <Link href="/dashboard" className="flex items-center justify-center w-full" suppressHydrationWarning>
              <Image
                src="/brand/harmonyk-logo-horizontal_icononly.png"
                alt="Harmonyk"
                width={32}
                height={32}
                className="block h-8 w-8 dark:hidden"
                priority
                suppressHydrationWarning
              />
              <Image
                src="/brand/harmonyk-logo-horizontal-dark-icononly.png"
                alt="Harmonyk"
                width={32}
                height={32}
                className="hidden h-8 w-8 dark:block"
                priority
                suppressHydrationWarning
              />
            </Link>
          )}
        </div>

        <TooltipProvider>
          <nav
            className="flex-1 overflow-y-auto"
            style={{ padding: tokens.spacing[3] }}
            suppressHydrationWarning
          >
            <div className="space-y-1">
              {navigationDefault.map((item) => renderNavItem(item, false))}
            </div>
          </nav>

          {onToggle && (
            <div className="border-t" style={{ padding: tokens.spacing[3] }}>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className={cn(
                      'w-full transition-all duration-200',
                      collapsed ? 'justify-center p-3' : 'justify-start px-3 py-2.5'
                    )}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </TooltipProvider>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader
            className="border-b px-6"
            style={{
              height: tokens.layout.topbarHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
          <nav
            className="overflow-y-auto"
            style={{
              padding: tokens.spacing[3],
              height: `calc(100vh - ${tokens.layout.topbarHeight})`,
            }}
          >
            <div className="space-y-1">
              {navigationDefault.map((item) => renderNavItem(item, true))}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
