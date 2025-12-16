'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { MonoPane, type MonoContext } from './mono-pane';
import { MonoQuickActions } from './MonoQuickActions';

interface MonoAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: MonoContext | string;
}

export function MonoAssistant({ isOpen, onClose, context }: MonoAssistantProps) {
  if (!isOpen) return null;

  // Convert legacy string context to MonoContext if needed
  const monoContext: MonoContext = typeof context === 'string'
    ? { route: context || 'dashboard' }
    : context || { route: 'dashboard' };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[400px] border-l bg-card flex flex-col shadow-xl z-40">
      <div className="border-b px-6 py-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Maestro</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your AI assistant for docs and tasks</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 -mt-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 py-4 border-b">
          <MonoQuickActions context={monoContext.route} />
        </div>
        <div className="flex-1 min-h-0">
          <MonoPane context={monoContext} />
        </div>
      </div>
    </div>
  );
}

