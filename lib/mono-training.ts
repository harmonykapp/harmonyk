export type MonoTrainingDocSource = "internal" | "org_vault";

export type MonoTrainingDocKind =
  | "contract"
  | "deck"
  | "account"
  | "playbook"
  | "other";

export interface MonoTrainingDoc {
  id: string;
  orgId: string;
  title: string;
  kind: MonoTrainingDocKind;
  source: MonoTrainingDocSource;
  tags: string[];
  summary?: string;
}

export interface MonoContextRequest {
  orgId: string;
  query?: string;
  maxItems?: number;
}

export interface MonoContextResult {
  orgId: string;
  query?: string;
  docs: MonoTrainingDoc[];
}

/**
 * Temporary stub implementation for Week 19 RAG plumbing.
 *
 * This will later be backed by a real training library table plus
 * embeddings / vector store. For now, it returns a small, deterministic
 * in-memory set of "internal" docs scoped to the orgId.
 */
export async function getMonoContext(
  request: MonoContextRequest,
): Promise<MonoContextResult> {
  const { orgId, query } = request;

  const maxItems =
    typeof request.maxItems === "number" && request.maxItems > 0
      ? request.maxItems
      : 5;

  const baseDocs: MonoTrainingDoc[] = [
    {
      id: "internal-contract-playbook",
      orgId,
      title: "Standard SaaS customer contract playbook",
      kind: "contract",
      source: "internal",
      tags: ["saas", "contract", "playbook"],
      summary:
        "Internal Monolyth guidance for typical SaaS subscription contracts and negotiation patterns.",
    },
    {
      id: "internal-fundraising-deck",
      orgId,
      title: "Seed fundraising deck checklist",
      kind: "deck",
      source: "internal",
      tags: ["fundraising", "deck", "seed"],
      summary:
        "Key slides and narrative beats for early-stage seed fundraising decks.",
    },
    {
      id: "internal-financial-pack",
      orgId,
      title: "Investor-ready financial pack outline",
      kind: "account",
      source: "internal",
      tags: ["finance", "reporting", "investors"],
      summary:
        "Structure for monthly investor financial updates and KPI reporting.",
    },
  ];

  const docs = baseDocs
    .filter((doc) => {
      if (!query) return true;
      const lowerQuery = query.toLowerCase();
      const haystack = [
        doc.title,
        doc.summary ?? "",
        doc.tags.join(" "),
        doc.kind,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(lowerQuery);
    })
    .slice(0, maxItems);

  return {
    orgId,
    query,
    docs,
  };
}

