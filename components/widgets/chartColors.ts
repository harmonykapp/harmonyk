// Do not use violet/indigo/etc in charts. Use primary scale only.
export const chartPrimaryScale = {
  "10": { bg: "bg-primary/15", text: "text-primary/30" },
  "15": { bg: "bg-primary/25", text: "text-primary/40" },
  "20": { bg: "bg-primary/40", text: "text-primary/60" },
  "30": { bg: "bg-primary/60", text: "text-primary/70" },
  "40": { bg: "bg-primary/80", text: "text-primary/90" },
  "50": { bg: "bg-primary", text: "text-primary" },
} as const;

export type ChartPrimaryScaleKey = keyof typeof chartPrimaryScale;
