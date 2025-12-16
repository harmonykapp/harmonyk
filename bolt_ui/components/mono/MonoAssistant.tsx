'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { MonoChat } from './MonoChat';
import { MonoQuickActions } from './MonoQuickActions';

interface MonoAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
}

export function MonoAssistant({ isOpen, onClose, context = 'dashboard' }: MonoAssistantProps) {
  if (!isOpen) return null;

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

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-6">
          <MonoQuickActions context={context} />
          <MonoChat />
        </div>
      </ScrollArea>
    </div>
  );
}
