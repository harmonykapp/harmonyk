'use client';

import { useTheme } from '@/components/theme-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import { getPageTitle } from '@/lib/ui/page-titles';
import { tokens } from '@/lib/ui/tokens';
import { Moon, Search, Sparkles, Sun, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export interface TopbarProps {
  onMonoToggle: () => void;
  monoOpen: boolean;
}

export function Topbar({ onMonoToggle, monoOpen }: TopbarProps) {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the global search box in sync with /vault?q=... without relying on useSearchParams().
  // This avoids Next.js CSR bailout warnings that can appear when search params are read at build time.
  useEffect(() => {
    if (!mounted) return;
    if (typeof window === 'undefined') return;

    const syncFromUrl = () => {
      try {
        const isVault = window.location.pathname === '/vault';
        if (!isVault) {
          setSearchValue('');
          return;
        }
        const params = new URLSearchParams(window.location.search);
        const q = (params.get('q') ?? '').trim();
        setSearchValue(q);
      } catch {
        // Ignore malformed URL edge cases
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, [mounted, pathname]);

  // Global keyboard shortcuts:
  // - "/" focuses search (unless typing in an input/textarea/contenteditable).
  // - "Escape" blurs search if focused.
  // - "?" toggles Maestro (unless typing in an input/textarea/contenteditable).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable === true;

      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (isEditable) return;
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        if (isEditable) return;
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (e.key === 'Escape') {
        const active = document.activeElement;
        if (active && active === searchRef.current) {
          (active as HTMLElement).blur();
        }
      }

      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isEditable) return;
        e.preventDefault();
        onMonoToggle();
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [onMonoToggle]);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const email = data.user.email || '';
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0] || 'User';
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'U';
        setUser({ name, email, initials });
      } else {
        setUser({ name: 'Guest User', email: 'guest@harmonyk.ai', initials: 'GU' });
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const onSubmitSearch = () => {
    const q = searchValue.trim();
    if (q.length === 0) {
      router.push('/vault');
      return;
    }
    router.push(`/vault?q=${encodeURIComponent(q)}`);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 gap-4 sticky top-0 z-30"
        style={{ height: tokens.layout.topbarHeight }}
        suppressHydrationWarning
      >
        <div className="flex items-center gap-4 w-full">
          <div className="min-w-[140px] max-w-[220px]">
            <div className="text-xl font-semibold tracking-tight truncate">{pageTitle}</div>
          </div>

          <div className="flex-1 max-w-md" suppressHydrationWarning>
            <div className="relative" suppressHydrationWarning>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ width: tokens.iconSize.sm, height: tokens.iconSize.sm }} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Input
                      ref={searchRef}
                      type="search"
                      placeholder="Search docs, tasks, or threads..."
                      className="pl-9 pr-9 w-full"
                      aria-label="Search"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onSubmitSearch();
                        }
                        if (e.key === 'Escape') {
                          (e.currentTarget as HTMLInputElement).blur();
                        }
                      }}
                      suppressHydrationWarning
                    />
                    {searchValue.trim().length > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => {
                          setSearchValue('');
                          router.push('/vault');
                          // keep focus for rapid re-search
                          requestAnimationFrame(() => searchRef.current?.focus());
                        }}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    ) : null}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs">
                      Shortcut: <span className="font-mono">/</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Press <span className="font-mono">Enter</span> to search Vault
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Press <span className="font-mono">Esc</span> to blur
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center" style={{ gap: tokens.spacing[2] }} suppressHydrationWarning>
            <div suppressHydrationWarning>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={monoOpen ? 'default' : 'outline'}
                    size="sm"
                    onClick={onMonoToggle}
                    className="gap-2"
                  >
                    <Sparkles style={{ width: tokens.iconSize.sm, height: tokens.iconSize.sm }} />
                    <span className="hidden sm:inline">Ask Maestro</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                  <div className="text-xs">
                    Shortcut: <span className="font-mono">?</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <div suppressHydrationWarning>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>

            {mounted ? (
              <div suppressHydrationWarning>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user?.initials || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email || 'user@harmonyk.ai'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')}>Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/billing')}>Billing</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>Team</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div suppressHydrationWarning>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" disabled>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
                  </Avatar>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
