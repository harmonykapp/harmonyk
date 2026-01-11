export type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl border border-border/60 bg-muted/50",
        className ?? "",
      ].join(" ")}
    />
  );
}

