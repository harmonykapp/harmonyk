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
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import { tokens } from '@/lib/ui/tokens';
import { Moon, Search, Sparkles, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TopbarProps {
  onMonoToggle: () => void;
  monoOpen: boolean;
}

export function Topbar({ onMonoToggle, monoOpen }: TopbarProps) {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <div
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 gap-4 sticky top-0 z-30"
      style={{ height: tokens.layout.topbarHeight }}
      suppressHydrationWarning
    >
      <div className="flex-1 max-w-md" suppressHydrationWarning>
        <div className="relative" suppressHydrationWarning>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ width: tokens.iconSize.sm, height: tokens.iconSize.sm }} />
          <Input
            type="search"
            placeholder="Search docs, tasks, or threads..."
            className="pl-9 w-full"
            suppressHydrationWarning
          />
        </div>
      </div>

      <div className="flex items-center" style={{ gap: tokens.spacing[2] }} suppressHydrationWarning>
        <div suppressHydrationWarning>
          <Button
            variant={monoOpen ? 'default' : 'outline'}
            size="sm"
            onClick={onMonoToggle}
            className="gap-2"
          >
            <Sparkles style={{ width: tokens.iconSize.sm, height: tokens.iconSize.sm }} />
            <span className="hidden sm:inline">Ask Maestro</span>
          </Button>
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
  );
}
