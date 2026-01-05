'use client';

import { tokens } from '@/lib/ui/tokens';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProgressState {
  hasConnectedGoogleDrive: boolean;
  hasDraftedContract: boolean;
  hasDraftedDeck: boolean;
  hasVaultDoc: boolean;
  hasRunAccountsPack: boolean;
}

interface DashboardHeroProps {
  progressState: ProgressState;
}

export function DashboardHero({ progressState }: DashboardHeroProps) {
  const completedCount = Object.values(progressState).filter(Boolean).length;
  const totalCount = Object.values(progressState).length;
  const progressPercentage = (completedCount / totalCount) * 100;

  if (completedCount === totalCount) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent style={{ padding: tokens.spacing[6] }}>
        <div className="space-y-4">
          <div>
            <h2
              className="font-semibold text-foreground"
              style={{
                fontSize: tokens.fontSize.xl,
                lineHeight: tokens.lineHeight.xl,
                marginBottom: tokens.spacing[1],
              }}
            >
              Welcome to Harmonyk
            </h2>
            <p
              className="text-muted-foreground"
              style={{
                fontSize: tokens.fontSize.sm,
                lineHeight: tokens.lineHeight.sm,
              }}
            >
              Complete these steps to get the most out of your workspace
            </p>
          </div>

          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span
                  className="text-xs font-semibold inline-block text-primary"
                  style={{ fontSize: tokens.fontSize.xs }}
                >
                  {completedCount} of {totalCount} completed
                </span>
              </div>
              <div className="text-right">
                <span
                  className="text-xs font-semibold inline-block text-primary"
                  style={{ fontSize: tokens.fontSize.xs }}
                >
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-primary/20">
              <div
                style={{ width: `${progressPercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
