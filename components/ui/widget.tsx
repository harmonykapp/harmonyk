import { cn } from '@/lib/utils';
import { tokens } from '@/lib/ui/tokens';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface WidgetProps {
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  sidecar?: React.ReactNode;
  state?: 'default' | 'loading' | 'empty' | 'error';
  emptyMessage?: string;
  errorMessage?: string;
  className?: string;
}

export function Widget({
  title,
  description,
  headerActions,
  children,
  footerActions,
  sidecar,
  state = 'default',
  emptyMessage = 'No data available',
  errorMessage = 'Something went wrong',
  className,
}: WidgetProps) {
  const renderContent = () => {
    if (state === 'loading') {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      );
    }

    if (state === 'empty') {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-destructive">{errorMessage}</div>
        </div>
      );
    }

    return children;
  };

  const content = (
    <Card className={cn('h-full', className)}>
      {(title || description || headerActions) && (
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent style={{ paddingTop: (title || description || headerActions) ? undefined : tokens.spacing[6] }}>
        {renderContent()}
      </CardContent>
      {footerActions && (
        <CardFooter className="border-t">
          {footerActions}
        </CardFooter>
      )}
    </Card>
  );

  if (sidecar) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {content}
        <div>{sidecar}</div>
      </div>
    );
  }

  return content;
}
