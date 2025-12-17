import { type Triage } from "@/lib/ai";
import { LEGACY_VAULT_STORAGE_KEY, LEGACY_VAULT_UPDATED_EVENT } from "@/lib/legacy-keys";

// Storage keys are user-facing persistence. We migrate from legacy keys to avoid
// wiping local demo data when rebranding.
export const VAULT_STORAGE_KEY = "harmonyk-vault";
export const VAULT_UPDATED_EVENT = "harmonyk:vault-updated";

export function migrateLegacyVaultStorage() {
  if (typeof window === "undefined") return;
  try {
    const hasNew = window.localStorage.getItem(VAULT_STORAGE_KEY);
    if (hasNew != null) return;

    const legacy = window.localStorage.getItem(LEGACY_VAULT_STORAGE_KEY);
    if (legacy == null) return;

    window.localStorage.setItem(VAULT_STORAGE_KEY, legacy);
    // Keep legacy value for now (non-destructive). If you want, you can remove
    // it later once you're confident migration has happened everywhere.
  } catch {
    // ignore
  }
}

export function dispatchVaultUpdated() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(VAULT_UPDATED_EVENT));
    // Compatibility: any old listeners still listening for the legacy event.
    window.dispatchEvent(new Event(LEGACY_VAULT_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export type VaultVersion = {
  id: string;
  number: number;
  markdown: string;
  html: string;
  createdAt: string;
};

export type VaultDoc = {
  id: string;
  title: string;
  templateId: string;
  triage: Triage;
  updatedAt: string;
  versions: VaultVersion[];
};

function getSafeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

function broadcastUpdate() {
  dispatchVaultUpdated();
}

export function readVaultDocs(): VaultDoc[] {
  const w = getSafeWindow();
  if (!w) return [];
  // Migrate legacy storage on first read
  migrateLegacyVaultStorage();
  const raw = w.localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as VaultDoc[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeVaultDocs(docs: VaultDoc[]) {
  const w = getSafeWindow();
  if (!w) return;
  w.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(docs));
  broadcastUpdate();
}

export function getVaultDoc(id: string): VaultDoc | null {
  return readVaultDocs().find((doc) => doc.id === id) ?? null;
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type UpsertArgs = {
  docId?: string | null;
  title: string;
  templateId: string;
  triage: Triage;
  markdown: string;
  html: string;
};

export function upsertVaultDoc({
  docId,
  title,
  templateId,
  triage,
  markdown,
  html,
}: UpsertArgs): { doc: VaultDoc; versionNumber: number } {
  const docs = readVaultDocs();
  const now = new Date().toISOString();

  if (docId) {
    const existingIndex = docs.findIndex((doc) => doc.id === docId);
    if (existingIndex >= 0) {
      const existing = docs[existingIndex];
      const versionNumber = existing.versions.length + 1;
      const version: VaultVersion = {
        id: makeId(),
        number: versionNumber,
        markdown,
        html,
        createdAt: now,
      };
      const updatedDoc: VaultDoc = {
        ...existing,
        title,
        templateId,
        triage,
        updatedAt: now,
        versions: [version, ...existing.versions],
      };
      docs[existingIndex] = updatedDoc;
      writeVaultDocs(docs);
      return { doc: updatedDoc, versionNumber };
    }
  }

  const newDocId = docId || makeId();
  const version: VaultVersion = {
    id: makeId(),
    number: 1,
    markdown,
    html,
    createdAt: now,
  };
  const newDoc: VaultDoc = {
    id: newDocId,
    title,
    templateId,
    triage,
    updatedAt: now,
    versions: [version],
  };
  docs.unshift(newDoc);
  writeVaultDocs(docs);
  return { doc: newDoc, versionNumber: 1 };
}

