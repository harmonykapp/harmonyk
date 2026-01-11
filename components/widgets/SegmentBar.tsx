import Link from "next/link";

export type Segment = {
  id: string;
  label: string;
  value: number;
  href?: string;
};

export type SegmentBarProps = {
  title: string;
  segments: Segment[];
  className?: string;
};

export function SegmentBar({ title, segments, className }: SegmentBarProps) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const safeTotal = total > 0 ? total : 1;

  return (
    <div
      className={[
        "rounded-2xl border border-border/60 bg-background",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{total}</div>
      </div>

      <div className="px-4 pb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="flex h-2 w-full">
            {segments.map((s) => {
              const pct = (s.value / safeTotal) * 100;
              return (
                <div
                  key={s.id}
                  className="h-2 bg-foreground/70"
                  style={{ width: `${pct}%` }}
                  title={`${s.label}: ${s.value}`}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {segments.map((s) => {
            const pill = (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm hover:bg-muted">
                <span className="text-sm">{s.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {s.value}
                </span>
              </span>
            );
            return s.href ? (
              <Link key={s.id} href={s.href} className="max-w-full">
                {pill}
              </Link>
            ) : (
              <span key={s.id} className="max-w-full">
                {pill}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

