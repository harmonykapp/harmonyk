// Manual test:
// 1) Visit /builder: page should load without freezing.
// 2) Select a contract template, add clauses, instructions, generate Version 1, then click "Save to Vault":
//    - On success: toast "Saved to Vault" and doc appears in Vault/Workbench.
//    - On failure: toast error and console.error("[builder] Save to Vault error", ...), but no page crash.
// 3) Confirm templates and clauses come from:
//    - public.contract_templates (is_canonical = true)
//    - public.contract_clauses
// 4) Confirm deck templates load from:
//    - public.deck_templates (is_canonical = true)

import { BuilderClient } from "@/components/builder/builder-client";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type DeckType = "fundraising" | "investor_update";

export interface DeckTemplate {
  id: string;
  name: string;
  deck_type: DeckType;
  is_canonical: boolean;
  description: string | null;
  tags: string[];
  default_outline: unknown; // JSONB, will be array of section keys
}

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ docId?: string }>;
}) {
  const params = await searchParams;
  const docId = params?.docId;

  const supabase = createServerSupabaseClient();

  const { data: templatesData, error: templatesError } = await supabase
    .from("contract_templates")
    .select(
      "id, name, category, canonical_type, tags, risk, jurisdiction",
    )
    .eq("is_canonical", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (templatesError) {
    console.error("Failed to load contract_templates for Builder", templatesError);
  }

  const { data: clausesData, error: clausesError } = await supabase
    .from("contract_clauses")
    .select("id, name, category, body")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (clausesError) {
    console.error("Failed to load contract_clauses for Builder", clausesError);
  }

  const { data: deckTemplatesData, error: deckTemplatesError } = await supabase
    .from("deck_templates")
    .select("id, name, deck_type, is_canonical, description, tags, default_outline")
    .eq("is_canonical", true)
    .order("deck_type", { ascending: true })
    .order("name", { ascending: true });

  if (deckTemplatesError) {
    console.error("Failed to load deck_templates for Builder", deckTemplatesError);
  }

  const templates = templatesData ?? [];
  const clauses = clausesData ?? [];
  const deckTemplates: DeckTemplate[] = (deckTemplatesData ?? []).map((dt) => ({
    id: dt.id,
    name: dt.name,
    deck_type: dt.deck_type as DeckType,
    is_canonical: dt.is_canonical,
    description: dt.description,
    tags: dt.tags ?? [],
    default_outline: dt.default_outline,
  }));

  return (
    <div className="h-full flex flex-col">
      <BuilderClient templates={templates} clauses={clauses} deckTemplates={deckTemplates} initialDocId={docId} />
    </div>
  );
}
