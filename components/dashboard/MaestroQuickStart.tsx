'use client';

import { tokens } from '@/lib/ui/tokens';
import { Widget } from '@/components/ui/widget';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ProgressState {
  hasConnectedGoogleDrive: boolean;
  hasDraftedContract: boolean;
  hasDraftedDeck: boolean;
  hasVaultDoc: boolean;
  hasRunAccountsPack: boolean;
}

interface MaestroQuickStartProps {
  progressState: ProgressState;
}

const steps = [
  {
    key: 'hasConnectedGoogleDrive' as keyof ProgressState,
    label: 'Connect Google Drive',
    href: '/integrations?source=onboarding',
  },
  {
    key: 'hasDraftedContract' as keyof ProgressState,
    label: 'Generate your first contract',
    href: '/builder?tab=contracts&source=onboarding',
  },
  {
    key: 'hasDraftedDeck' as keyof ProgressState,
    label: 'Generate your first deck',
    href: '/builder?tab=decks&source=onboarding',
  },
  {
    key: 'hasVaultDoc' as keyof ProgressState,
    label: 'Save a document to Vault',
    href: '/vault?source=onboarding',
  },
  {
    key: 'hasRunAccountsPack' as keyof ProgressState,
    label: '(Optional) Run an Accounts pack',
    href: '/builder?tab=accounts&source=onboarding',
  },
];

export function MaestroQuickStart({ progressState }: MaestroQuickStartProps) {
  const completedCount = Object.values(progressState).filter(Boolean).length;
  const totalCount = Object.values(progressState).length;

  if (completedCount === totalCount) {
    return null;
  }

  return (
    <Widget
      title="Quick Start"
      description="Follow these steps to set up your workspace"
    >
      <div className="space-y-3">
        {steps.map((step) => {
          const isComplete = progressState[step.key];
          const Icon = isComplete ? CheckCircle2 : Circle;

          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                isComplete ? 'bg-muted/50' : 'bg-background hover:bg-accent/50'
              )}
            >
              <Icon
                className={cn(
                  isComplete ? 'text-green-600' : 'text-muted-foreground'
                )}
                style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }}
              />
              <div className="flex-1 min-w-0">
                {isComplete ? (
                  <span
                    className="text-sm text-muted-foreground line-through"
                    style={{ fontSize: tokens.fontSize.sm }}
                  >
                    {step.label}
                  </span>
                ) : (
                  <Link
                    href={step.href}
                    className="text-sm hover:underline hover:text-primary transition-colors"
                    style={{ fontSize: tokens.fontSize.sm }}
                  >
                    {step.label}
                  </Link>
                )}
              </div>
              {!isComplete && (
                <Link href={step.href}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowRight style={{ width: tokens.iconSize.sm, height: tokens.iconSize.sm }} />
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
