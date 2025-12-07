'use client';

import { useState } from 'react';
import { Sidebar } from './navigation/Sidebar';
import { TopBar } from './navigation/TopBar';
import { MonoAssistant } from './mono/MonoAssistant';
import { cn } from '@/lib/utils';
import type { MonoContext } from './mono/mono-pane';
import type { LucideIcon } from 'lucide-react';

type IconType = React.ComponentType<{ className?: string }>;
type NavItem = { title: string; href: string; icon?: IconType };

interface AppShellProps {
  children: React.ReactNode;
  monoContext?: MonoContext | string;
  navOverride?: NavItem[];
}

export function AppShell({ children, monoContext, navOverride }: AppShellProps) {
  const [monoOpen, setMonoOpen] = useState(false);

  // Convert legacy string context to MonoContext if needed
  const context: MonoContext = typeof monoContext === 'string'
    ? { route: monoContext || '/dashboard' }
    : monoContext || { route: '/dashboard' };

  return (
    <div className="h-screen flex overflow-hidden" suppressHydrationWarning>
      <Sidebar navOverride={navOverride} />

      <div className="flex-1 flex flex-col min-w-0" suppressHydrationWarning>
        <TopBar onMonoToggle={() => setMonoOpen(!monoOpen)} monoOpen={monoOpen} />

        <main
          className={cn(
            'flex-1 overflow-auto transition-all duration-300',
            monoOpen && 'mr-[400px]'
          )}
          suppressHydrationWarning
        >
          {children}
        </main>
      </div>

      <MonoAssistant
        isOpen={monoOpen}
        onClose={() => setMonoOpen(false)}
        context={context}
      />
    </div>
  );
}

