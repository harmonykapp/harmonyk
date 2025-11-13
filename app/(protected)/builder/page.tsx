import BuilderClient from "@/components/builder/BuilderClient";
import { TEMPLATES } from "@/data/templates";

// Adapt whatever your TEMPLATES shape is into the minimal fields BuilderClient needs.
const normalize = (t: any) => ({
  id: String(t.id ?? t.slug ?? t.name ?? t.title ?? Math.random().toString(36).slice(2)),
  name: String(t.name ?? t.title ?? "Untitled"),
  tags: (t.tags ?? t.keywords ?? t.labels ?? []).map(String),
  country: t.country ?? t.region ?? t.locale ?? "USA",
});

export default function Page() {
  const templates = Array.isArray(TEMPLATES) ? TEMPLATES.map(normalize) : [];
  return (
    <div className="p-6">
      <h1 className="mb-4 text-3xl font-semibold">Builder</h1>
      <BuilderClient templates={templates} />
    </div>
  );
}
