export type TemplateCategory = "contract" | "ops" | "deck" | "other";

export interface TemplateDef {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  defaultPrompt: string;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "nda_mutual",
    name: "Mutual NDA",
    category: "contract",
    description: "Protect confidential info between two parties.",
    defaultPrompt: "Draft a mutual non-disclosure agreement between two parties...",
  },
  {
    id: "msa_basic",
    name: "Master Services Agreement",
    category: "contract",
    description: "Baseline terms for recurring B2B services.",
    defaultPrompt: "Draft an MSA covering scope, payment terms, IP and confidentiality...",
  },
  {
    id: "employment_offer",
    name: "Employment Offer Letter",
    category: "ops",
    description: "Formal offer of employment including role, salary, and start date.",
    defaultPrompt:
      "Draft an employment offer letter including role, salary, benefits and start date...",
  },
  {
    id: "invoice_basic",
    name: "Basic Invoice",
    category: "ops",
    description: "Simple invoice for services or products.",
    defaultPrompt:
      "Draft a simple invoice with line items, totals, due date and payment terms...",
  },
  {
    id: "investor_update",
    name: "Investor Update Email",
    category: "deck",
    description: "Short monthly update for investors.",
    defaultPrompt:
      "Draft a concise monthly investor update covering metrics, wins, challenges and asks...",
  },
  {
    id: "seed_pitch_deck",
    name: "Seed Pitch Deck Outline",
    category: "deck",
    description: "10-slide outline for a seed pitch deck.",
    defaultPrompt:
      "Outline a 10-slide seed pitch deck for a SaaS startup, including problem, solution, market, traction and ask...",
  },
];
