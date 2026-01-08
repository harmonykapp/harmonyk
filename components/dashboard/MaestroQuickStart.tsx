'use client';

import { Button } from '@/components/ui/button';
import { Widget } from '@/components/ui/widget';
import { tokens } from '@/lib/ui/tokens';
import type { UserProgressNarration } from '@/lib/user-progress';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ProgressState {
  hasConnectedGoogleDrive: boolean;
  hasDraftedContract: boolean;
  hasDraftedDeck: boolean;
  hasVaultDoc: boolean;
  hasRunAccountsPack: boolean;
}

interface MaestroQuickStartProps {
  narration: UserProgressNarration;
  progressState?: ProgressState;
}

function getQuickStartHref(n: UserProgressNarration, index: number): string {
  const item = n.quickStarts[index];
  if (!item) return '/dashboard';
  if (item.kind === 'link') return item.href;
  // UI-only placeholder: later we'll wire this to open Maestro with an "intent".
  return `/dashboard?maestroIntent=${encodeURIComponent(item.intent)}`;
}

export function MaestroQuickStart({ narration, progressState }: MaestroQuickStartProps) {
  if (progressState) {
    const completedCount = Object.values(progressState).filter(Boolean).length;
    const totalCount = Object.values(progressState).length;
    if (completedCount === totalCount) return null;
  }

  return (
    <Widget
      title="Quick Start"
      description="Pick a next step — Maestro will guide you"
      headerActions={
        <Sparkles className="text-mono" style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }} />
      }
    >
      <div className="space-y-3">
        {narration.quickStarts.map((qs, idx) => {
          const href = getQuickStartHref(narration, idx);

          return (
            <div
              key={`${qs.kind}-${idx}`}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors bg-background hover:bg-accent/50'
              )}
            >
              <div
                className="rounded-md bg-primary/10 text-primary flex items-center justify-center"
                style={{ width: tokens.iconSize.lg, height: tokens.iconSize.lg }}
              >
                <Sparkles style={{ width: tokens.iconSize.sm, height: tokens.iconSize.sm }} />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={href}
                  className="text-sm hover:underline hover:text-primary transition-colors"
                  style={{ fontSize: tokens.fontSize.sm }}
                >
                  {qs.label}
                </Link>
              </div>
              <Link href={href}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowRight style={{ width: tokens.iconSize.sm, height: tokens.iconSize.sm }} />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
