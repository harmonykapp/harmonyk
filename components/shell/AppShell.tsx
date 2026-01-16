'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MonoAssistant } from '@/components/mono/MonoAssistant';
import { cn } from '@/lib/utils';
import type { MonoContext } from '@/components/mono/mono-pane';
import { useSidebar } from '@/lib/ui/sidebar-state';
import { flag } from '@/lib/ui/flags';

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

  useEffect(() => {
    const collapsible = flag('nav.sidebar.collapsible');
    if (!collapsible) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable === true;

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [toggle]);

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
