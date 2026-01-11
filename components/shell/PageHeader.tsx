'use client';

import { tokens } from '@/lib/ui/tokens';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4', className)}
      style={{ marginBottom: tokens.spacing[6] }}
    >
      <div className="space-y-1">
        <h1
          className="font-bold text-foreground"
          style={{
            fontSize: tokens.fontSize['3xl'],
            lineHeight: tokens.lineHeight['3xl'],
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-muted-foreground"
            style={{
              fontSize: tokens.fontSize.base,
              lineHeight: tokens.lineHeight.base,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
