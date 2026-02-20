import { BuilderClient } from "@/components/builder/builder-client";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AccountsBuilderPage() {
  const supabase = createServerSupabaseClient();

  const { data: templatesData } = await supabase
    .from("contract_templates")
    .select("id, name, category, canonical_type, tags, risk, jurisdiction")
    .eq("is_canonical", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const { data: clausesData } = await supabase
    .from("contract_clauses")
    .select("id, name, category, body")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const { data: deckTemplatesData } = await supabase
    .from("deck_templates")
    .select("id, name, deck_type, is_canonical, description, tags, default_outline")
    .eq("is_canonical", true)
    .order("deck_type", { ascending: true })
    .order("name", { ascending: true });

  const templates = templatesData ?? [];
  const clauses = clausesData ?? [];
  const deckTemplates: Array<{
    id: string;
    name: string;
    deck_type: "fundraising" | "investor_update";
    is_canonical: boolean;
    description: string | null;
    tags: string[];
    default_outline: unknown;
  }> = (deckTemplatesData ?? []).map((dt) => ({
    id: dt.id,
    name: dt.name,
    deck_type: dt.deck_type as "fundraising" | "investor_update",
    is_canonical: dt.is_canonical,
    description: dt.description,
    tags: dt.tags ?? [],
    default_outline: dt.default_outline,
  }));

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <BuilderClient
          templates={templates}
          clauses={clauses}
          deckTemplates={deckTemplates}
          initialTab="accounts"
          mode="accounts"
        />
      </div>
    </div>
  );
}

