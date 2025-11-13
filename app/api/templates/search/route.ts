import { TEMPLATES } from "@/data/templates";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const country = searchParams.get("country") || "USA";

  const out = TEMPLATES.filter((t: any) => {
    const inCountry = (t.country || t.region || "USA") === country;
    if (!q) return inCountry;
    const hay =
      `${t.name ?? t.title ?? ""} ${(t.tags ?? []).join(" ")} ${(t.keywords ?? []).join(" ")}`.toLowerCase();
    return inCountry && hay.includes(q);
  }).map((t: any) => ({
    id: String(t.id ?? t.slug ?? t.name ?? Math.random().toString(36).slice(2)),
    name: String(t.name ?? t.title ?? "Untitled"),
    tags: (t.tags ?? t.keywords ?? []).map(String),
    country: t.country ?? t.region ?? "USA",
  }));

  return NextResponse.json({ items: out });
}
