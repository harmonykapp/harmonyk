import Link from "next/link";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-background px-4 py-4",
        className ?? "",
      ].join(" ")}
    >
      <div className="text-sm font-medium">{title}</div>
      {description ? (
        <div className="text-sm text-muted-foreground">{description}</div>
      ) : null}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-1 inline-flex items-center rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

