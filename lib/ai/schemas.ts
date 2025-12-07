import { z } from "zod";

export const AnalyzeEntitySchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const AnalyzeResultSchema = z.object({
  // Be tolerant of partial / sloppy model output and provide GA-safe defaults.
  summary: z.string().default("No summary available."),
  entities: z.array(AnalyzeEntitySchema).default([]),
  dates: z.array(z.string()).default([]),
  nextAction: z.string().nullable().default(null),
});

export type AnalyzeEntity = z.infer<typeof AnalyzeEntitySchema>;
export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;

