"use server";

import { aiAnalyze } from "@/lib/ai";

export async function analyzeRowAction(row: {
  title: string; source: "Drive"|"Gmail"; kind?: string; owner?: string; modified?: string; preview?: string;
}) {
  return await aiAnalyze(row);
}
