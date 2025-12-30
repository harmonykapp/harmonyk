/**
 * PII registry for Harmonyk (PGW1 foundation).
 *
 * This does NOT perform any DB operations.
 * It is a structured map of which models/fields are considered PII
 * and whether they support export/erasure.
 *
 * Later PG weeks (PG-W8, PG-W19, PG-W26) will hook this into
 * actual export/erasure tooling and policy enforcement.
 */

export type PiiCategory =
  | "contact"
  | "engagement"
  | "email"
  | "task"
  | "billing"
  | "connector"
  | "other";

export interface PiiFieldDefinition {
  id: string;
  model: string;
  column: string;
  category: PiiCategory;
  description: string;
  canExport: boolean;
  canErase: boolean;
  notes?: string;
}

const PII_REGISTRY: PiiFieldDefinition[] = [
  // Contacts
  {
    id: "contacts.name",
    model: "contacts",
    column: "name",
    category: "contact",
    description: "Contact full name or display name.",
    canExport: true,
    canErase: true,
  },
  {
    id: "contacts.email",
    model: "contacts",
    column: "email",
    category: "contact",
    description: "Primary email address for a contact.",
    canExport: true,
    canErase: true,
  },
  {
    id: "contacts.company",
    model: "contacts",
    column: "company",
    category: "contact",
    description: "Company or organisation name associated with the contact.",
    canExport: true,
    canErase: true,
  },

  // Engagement / Share
  {
    id: "contact_engagement.last_viewed_at",
    model: "contact_engagement",
    column: "last_viewed_at",
    category: "engagement",
    description: "Timestamp of last view/open event for a contact.",
    canExport: true,
    canErase: true,
    notes: "Used for engagement scoring and timelines.",
  },
  {
    id: "contact_engagement.view_count",
    model: "contact_engagement",
    column: "view_count",
    category: "engagement",
    description: "Number of views/opens associated with a contact.",
    canExport: true,
    canErase: true,
  },

  // Emails / Notifications
  {
    id: "email_logs.to_address",
    model: "email_logs",
    column: "to_address",
    category: "email",
    description: "Recipient email address for transactional emails.",
    canExport: true,
    canErase: true,
    notes: "Needed for audit, must respect retention policies when erasing.",
  },

  // Tasks (lightweight)
  {
    id: "tasks.assignee_id",
    model: "tasks",
    column: "assignee_id",
    category: "task",
    description: "User ID of the assignee (indirect PII).",
    canExport: true,
    canErase: false,
    notes: "Erasure handled via user-level anonymisation instead.",
  },
];

export function listAllPiiFields(): PiiFieldDefinition[] {
  return [...PII_REGISTRY];
}

export function getPiiFieldsForModel(model: string): PiiFieldDefinition[] {
  return PII_REGISTRY.filter((field) => field.model === model);
}

export function getPiiFieldById(id: string): PiiFieldDefinition | undefined {
  return PII_REGISTRY.find((field) => field.id === id);
}

