"use client";

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
import { trackEvent } from '@/lib/telemetry';
import { getSidebarNavigation, isNavItemActive, type NavItem } from '@/lib/ui/navigation';
import { tokens } from '@/lib/ui/tokens';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileOpenerRef = useRef<HTMLButtonElement | null>(null);

  const handleMobileOpenChange = (open: boolean) => {
    setMobileOpen(open);
    if (!open) {
      // Return focus to the opener for keyboard/a11y friendliness.
      requestAnimationFrame(() => {
        mobileOpenerRef.current?.focus();
      });
    }
  };

  const handleMobileOpenClick = () => {
    setMobileOpen(true);
  };
  const isCollapsed = collapsed;
  const handleToggle = onToggle;
  const navigation = getSidebarNavigation().filter((item) => item.enabled !== false);

  useEffect(() => {
    // Fire once when sidebar mounts, but only when in desktop breakpoint.
    try {
      if (typeof window === 'undefined') return;
      const isDesktop = window.matchMedia?.('(min-width: 1024px)')?.matches ?? false;
      if (!isDesktop) return;
      trackEvent('nav_opened', { device: 'desktop' });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    trackEvent('nav_opened', { device: 'mobile' });
  }, [mobileOpen]);

  const handleToggleClick = () => {
    if (!handleToggle) return;
    const nextCollapsed = !isCollapsed;
    trackEvent('ui_sidebar_toggled', { collapsed: nextCollapsed });
    handleToggle();
  };

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const isActive = isNavItemActive(item, pathname);
    const Icon = item.icon;

    const linkContent = (
      <Link
        key={item.name}
        href={item.href}
        onClick={isMobile ? () => setMobileOpen(false) : undefined}
        className={cn(
          'flex items-center rounded-lg text-sm transition-all relative',
          isCollapsed && !isMobile ? 'justify-center px-3 py-2.5' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'bg-sidebar-active text-primary font-semibold'
            : 'text-sidebar-foreground hover:bg-sidebar-active/50 hover:text-sidebar-foreground font-medium'
        )}
        suppressHydrationWarning
      >
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r-full"
            style={{ height: '60%' }}
          />
        )}
        <Icon
          style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }}
          className="flex-shrink-0"
        />
        {(!isCollapsed || isMobile) && <span>{item.name}</span>}
      </Link>
    );

    if (isCollapsed && !isMobile) {
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
        className="lg:hidden fixed top-3 left-4 z-50"
        onClick={handleMobileOpenClick}
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav-drawer"
        ref={mobileOpenerRef}
      >
        <Menu style={{ width: tokens.iconSize.lg, height: tokens.iconSize.lg }} />
      </Button>

      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar border-r transition-[width] duration-200 ease-in-out'
        )}
        style={{
          height: '100vh',
          width: isCollapsed ? tokens.layout.sidebarWidthCollapsed : tokens.layout.sidebarWidthExpanded,
        }}
        suppressHydrationWarning
      >
        <div
          className={cn(
            'border-b flex items-center transition-all duration-200',
            isCollapsed ? 'justify-center' : ''
          )}
          style={{
            height: tokens.layout.topbarHeight,
            padding: isCollapsed ? tokens.spacing[3] : `${tokens.spacing[4]} ${tokens.spacing[3]}`,
          }}
          suppressHydrationWarning
        >
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center group pl-1 relative -top-px" suppressHydrationWarning>
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
          {isCollapsed && (
            <Link href="/dashboard" className="flex items-center justify-center w-full relative -top-px" suppressHydrationWarning>
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
              {navigation.map((item) => renderNavItem(item, false))}
            </div>
          </nav>

          {typeof handleToggle === 'function' && (
            <div className="border-t" style={{ padding: tokens.spacing[3] }}>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleClick}
                    className={cn(
                      'w-full transition-all duration-200',
                      isCollapsed ? 'justify-center px-3 py-2.5' : 'justify-start px-3 py-2.5'
                    )}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-pressed={isCollapsed}
                  >
                    {isCollapsed ? (
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
                  <p>{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </TooltipProvider>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={handleMobileOpenChange}>
        <SheetContent
          id="mobile-nav-drawer"
          side="left"
          className="w-64 p-0 flex flex-col"
          aria-label="Navigation drawer"
        >
          <SheetHeader className="border-b px-3 pt-10 pb-4">
            <SheetTitle>
              <span className="sr-only">Navigation</span>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-start"
                style={{
                  // Nudge the logo to align with nav icon column in the hamburger menu.
                  // (+8px right, -12px up)
                  transform: 'translate(8px, -12px)',
                }}
              >
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
            className="flex-1 overflow-y-auto"
            style={{
              padding: tokens.spacing[3],
            }}
          >
            <div className="space-y-1">
              {navigation.map((item) => renderNavItem(item, true))}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
