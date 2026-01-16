'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MonoAssistant } from '@/components/mono/MonoAssistant';
import { cn } from '@/lib/utils';
import type { MonoContext } from '@/components/mono/mono-pane';
import { useSidebar } from '@/lib/ui/sidebar-state';

interface AppShellProps {
  children: React.ReactNode;
  monoContext?: MonoContext | string;
}

export function AppShell({ children, monoContext }: AppShellProps) {
  const [monoOpen, setMonoOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();

  const context: MonoContext = typeof monoContext === 'string'
    ? { route: monoContext || '/dashboard' }
    : monoContext || { route: '/dashboard' };

  return (
    <div className="h-screen flex overflow-hidden" suppressHydrationWarning>
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <div className="flex-1 flex flex-col min-w-0" suppressHydrationWarning>
        <Topbar onMonoToggle={() => setMonoOpen(!monoOpen)} monoOpen={monoOpen} />

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
