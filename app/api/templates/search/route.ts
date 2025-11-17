import { NextResponse } from "next/server";
import { TEMPLATES } from "@/data/templates";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();

  const items = TEMPLATES.filter((template) => {
    if (!q) return true;
    const hay = `${template.name} ${template.description} ${template.defaultPrompt}`.toLowerCase();
    return hay.includes(q);
  }).map((template) => ({
    id: template.id,
    name: template.name,
    tags: [template.category],
    country: "USA",
  }));

  return NextResponse.json({ items });
}
