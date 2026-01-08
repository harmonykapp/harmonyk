'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { tokens } from '@/lib/ui/tokens';
import type { UserProgressNarration } from '@/lib/user-progress';
import Link from 'next/link';

interface ProgressState {
  hasConnectedGoogleDrive: boolean;
  hasDraftedContract: boolean;
  hasDraftedDeck: boolean;
  hasVaultDoc: boolean;
  hasRunAccountsPack: boolean;
}

interface DashboardHeroProps {
  narration: UserProgressNarration;
  progressState?: ProgressState;
}

export function DashboardHero({ narration, progressState }: DashboardHeroProps) {
  const completedCount = progressState ? Object.values(progressState).filter(Boolean).length : 0;
  const totalCount = progressState ? Object.values(progressState).length : 0;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (progressState && completedCount === totalCount) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent style={{ padding: `${tokens.spacing[3]} ${tokens.spacing[4]}` }}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2
              className="font-semibold text-foreground"
              style={{
                fontSize: tokens.fontSize.base,
                lineHeight: tokens.lineHeight.base,
                marginBottom: "2px",
              }}
            >
              {narration.title}
            </h2>
            <p
              className="text-muted-foreground"
              style={{
                fontSize: tokens.fontSize.sm,
                lineHeight: tokens.lineHeight.sm,
              }}
            >
              {narration.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={narration.primaryCta.href}>
              <Button size="sm">{narration.primaryCta.label}</Button>
            </Link>
            {narration.secondaryCta ? (
              <Link href={narration.secondaryCta.href}>
                <Button size="sm" variant="outline">
                  {narration.secondaryCta.label}
                </Button>
              </Link>
            ) : null}
          </div>

          {progressState ? (
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold text-primary"
                  style={{ fontSize: tokens.fontSize.xs }}
                >
                  {completedCount}/{totalCount}
                </span>
                <div className="w-16 h-1.5 rounded-full bg-primary/20 overflow-hidden">
                  <div
                    style={{ width: `${progressPercentage}%` }}
                    className="h-full bg-primary transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
