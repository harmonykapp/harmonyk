"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TEMPLATES } from "@/data/templates";
import { useToast } from "@/hooks/use-toast";
import { isFeatureEnabled, isRagEnabled } from "@/lib/feature-flags";
import { handleApiError } from "@/lib/handle-api-error";
import { phCapture } from "@/lib/posthog-client";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { logBuilderEvent } from "@/lib/telemetry/builder";
import type { Version } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Archive,
  Brain,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Pin,
  Plug,
  Plus,
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

// sha256 helper for passcode hashing
async function sha256Hex(text: string) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

type VersionSummary = Pick<Version, "document_id" | "number" | "content" | "created_at">;

const VAULT_UPLOAD_ALLOWED_EXTENSIONS = ["md", "txt", "csv", "pdf", "docx"] as const;
const VAULT_UPLOAD_ALLOWED_LABEL = VAULT_UPLOAD_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(", ");

type UploadItemStatus = "ready" | "uploading" | "uploaded" | "unsupported" | "duplicate" | "error";

type UploadItem = {
  file: File;
  title: string;
  status: UploadItemStatus;
  message?: string;
};

type Row = {
  id: string;
  title: string;
  kind?: string | null;
  status?: string | null;
  templateId?: string | null;
  org_id?: string | null;
  created_at: string;
  updated_at: string;
  versionCount: number;
  latestVersion?: VersionSummary;
};

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

type EventMeta = Record<string, string | number | boolean | null>;

type MonoTrainingStatus = "not_trained" | "training" | "trained" | "failed";

type DocTrainingState = {
  status: MonoTrainingStatus;
  lastUpdated?: string | null;
  error?: string | null;
};

type TrainResponseJob = {
  id: string;
  org_id: string;
  training_set_id?: string | null;
  vault_document_id?: string | null;
  status?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TrainResponse = {
  ok?: boolean;
  job?: TrainResponseJob;
  error?: string;
};

const viewKeys = [
  "all",
  "recent",
  "starred",
  "shared",
  "drafts",
  "signed",
  "archived",
] as const;

type ViewKey = (typeof viewKeys)[number];

const viewLabels: Record<ViewKey, string> = {
  all: "All files",
  recent: "Recent",
  starred: "Starred",
  shared: "Shared with me",
  drafts: "Drafts",
  signed: "Signed",
  archived: "Archived",
};

const viewDefs: Array<{
  id: ViewKey;
  icon: typeof Star;
  label: string;
  color: string;
}> = [
    { id: "all", icon: FileText, label: "All files", color: "text-muted-foreground" },
    { id: "recent", icon: Clock, label: "Recent", color: "text-blue-600" },
    { id: "starred", icon: Star, label: "Starred", color: "text-yellow-600" },
    { id: "shared", icon: Users, label: "Shared with me", color: "text-green-600" },
    { id: "drafts", icon: FileText, label: "Drafts", color: "text-indigo-600" },
    { id: "signed", icon: FileSignature, label: "Signed", color: "text-purple-600" },
    { id: "archived", icon: Archive, label: "Archived", color: "text-gray-600" },
  ];

function readVaultQueryFromLocation(): string {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    return (params.get("q") ?? "").trim();
  } catch {
    return "";
  }
}

function toViewKey(value: string | null): ViewKey {
  if (!value) return "all";
  const normalized = value.toLowerCase();
  return (viewKeys as readonly string[]).includes(normalized) ? (normalized as ViewKey) : "all";
}

function readVaultViewFromLocation(): ViewKey {
  if (typeof window === "undefined") return "all";
  try {
    const params = new URLSearchParams(window.location.search);
    return toViewKey(params.get("view"));
  } catch {
    return "all";
  }
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length <= 1) return "";
  return parts[parts.length - 1]?.toLowerCase() ?? "";
}

function buildVaultTitle(filename: string): string {
  const normalized = filename.trim();
  const ext = getFileExtension(normalized);
  if (!ext) return normalized || "Untitled document";
  return normalized.slice(0, Math.max(0, normalized.length - ext.length - 1)) || "Untitled document";
}

type VaultFolderRoot = "personal" | "company";

type VaultFolder = {
  id: string;
  name: string;
  parentId: string | null;
  root: VaultFolderRoot;
  createdAt: string;
};

type VaultFolderState = {
  folders: VaultFolder[];
  selectedFolderId: string | null;
};

type DocFolderMap = Record<string, string | null>;

type VaultFolderPreferences = {
  defaultRoot: VaultFolderRoot;
  defaultBuckets: string[];
};

type SelectedFolderInfo = {
  id: string;
  name: string;
  root: VaultFolderRoot;
  parentId: string | null;
  isRoot: boolean;
};

const VAULT_FOLDER_STORAGE_KEY = "harmonyk.vaultFolders.v1";
const VAULT_FILE_FOLDER_STORAGE_KEY = "harmonyk.vaultFileFolders.v1";
const VAULT_FOLDER_URL_PARAM = "folder";
const VAULT_FOLDER_NAME_MAX = 64;
const VAULT_BUCKET_OPTIONS = ["Contracts", "Decks", "Finance", "People", "Ops", "Other"] as const;
const DEFAULT_VAULT_PREFERENCES: VaultFolderPreferences = {
  defaultRoot: "personal",
  defaultBuckets: [...VAULT_BUCKET_OPTIONS],
};
const ROOT_FOLDER_IDS: Record<VaultFolderRoot, string> = {
  personal: "vault-root-personal",
  company: "vault-root-company",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isVaultFolderRoot(value: unknown): value is VaultFolderRoot {
  return value === "personal" || value === "company";
}

function isVaultFolder(value: unknown): value is VaultFolder {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.name !== "string") return false;
  if (!isVaultFolderRoot(value.root)) return false;
  if (typeof value.createdAt !== "string") return false;
  if (value.parentId !== null && typeof value.parentId !== "string") return false;
  return true;
}

function parseVaultFolderState(raw: string): VaultFolderState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const foldersRaw = parsed.folders;
    const selectedRaw = parsed.selectedFolderId;
    const folders = Array.isArray(foldersRaw)
      ? foldersRaw.filter(isVaultFolder)
      : [];
    const selectedFolderId =
      selectedRaw === null || typeof selectedRaw === "string" ? selectedRaw : null;
    return { folders, selectedFolderId };
  } catch {
    return null;
  }
}

function coerceDocFolderMap(value: unknown): DocFolderMap | null {
  if (!isRecord(value)) return null;
  const map: DocFolderMap = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!key) continue;
    if (typeof entry === "string") {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      map[key] = trimmed;
      continue;
    }
    if (entry === null) {
      map[key] = null;
    }
  }
  return map;
}

function parseVaultFileFolderMap(raw: string): DocFolderMap | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && "map" in parsed) {
      return coerceDocFolderMap((parsed as Record<string, unknown>).map);
    }
    return coerceDocFolderMap(parsed);
  } catch {
    return null;
  }
}

function parseVaultPreferences(value: unknown): VaultFolderPreferences | null {
  if (!isRecord(value)) return null;
  if (!isVaultFolderRoot(value.defaultRoot)) return null;
  const allowedTags = new Set(VAULT_BUCKET_OPTIONS.map((bucket) => normalizeFolderTag(bucket)));
  const bucketsRaw = value.defaultBuckets;
  const buckets: string[] = [];
  if (Array.isArray(bucketsRaw)) {
    for (const entry of bucketsRaw) {
      if (typeof entry !== "string") continue;
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const tag = normalizeFolderTag(trimmed);
      if (!allowedTags.has(tag)) continue;
      if (buckets.some((bucket) => normalizeFolderTag(bucket) === tag)) continue;
      const canonical =
        VAULT_BUCKET_OPTIONS.find((bucket) => normalizeFolderTag(bucket) === tag) ?? trimmed;
      buckets.push(canonical);
    }
  }
  return { defaultRoot: value.defaultRoot, defaultBuckets: buckets };
}

function readVaultFolderStateFromStorage(): VaultFolderState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VAULT_FOLDER_STORAGE_KEY);
    if (!raw) return null;
    return parseVaultFolderState(raw);
  } catch {
    return null;
  }
}

function readVaultPreferencesFromStorage(): VaultFolderPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VAULT_FOLDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    return parseVaultPreferences(parsed.prefs);
  } catch {
    return null;
  }
}

function readVaultFileFolderMapFromStorage(): DocFolderMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VAULT_FILE_FOLDER_STORAGE_KEY);
    if (!raw) return null;
    return parseVaultFileFolderMap(raw);
  } catch {
    return null;
  }
}

function readVaultFolderFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const value = (params.get(VAULT_FOLDER_URL_PARAM) ?? "").trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function normalizeFolderTag(value: string): string {
  return value.trim().toLowerCase();
}

function extractFolderTagsFromContent(content?: string | null): string[] {
  if (!content) return [];
  const metadataMatch = content.match(/<!-- MONO_[A-Z_]+:({.*?}) -->/s);
  if (!metadataMatch) return [];
  try {
    const metadata = JSON.parse(metadataMatch[1]) as Record<string, unknown>;
    const rawTags = metadata.tags ?? metadata.labels ?? metadata.label;
    if (Array.isArray(rawTags)) {
      return rawTags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    if (typeof rawTags === "string") {
      const trimmed = rawTags.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  } catch {
    return [];
  }
}

function createVaultFolderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `vault-folder-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function VaultPageInner() {
  const [quickFilter, setQuickFilter] = useState<ViewKey>("all");
  const vaultExperimental = isFeatureEnabled("FEATURE_VAULT_EXPERIMENTAL_ACTIONS");
  const ragEnabled = isRagEnabled();
  const { toast } = useToast();
  const sb = useMemo(() => getBrowserSupabaseClient(), []);
  // NOTE:
  // `next build` is using a generated Database typing where "document", "version", and "events"
  // are NOT present in the union of allowed tables (even though they exist at runtime).
  // Use an untyped handle in this file to avoid TS overload failures.
  // This does NOT change runtime behavior — it only bypasses incorrect type unions.
  const sbAny: any = sb;
  const router = useRouter();
  const lastAppliedQueryRef = useRef<string>("");
  const pendingQueryRef = useRef<string | null>(null);
  const lastAppliedViewRef = useRef<ViewKey>("all");
  const pendingViewRef = useRef<ViewKey | null>(null);
  const lastAppliedFolderRef = useRef<string | null>(null);
  const pendingFolderRef = useRef<string | null>(null);
  const foldersRef = useRef<VaultFolder[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userReady, setUserReady] = useState(false);
  const [vaultRefreshKey, setVaultRefreshKey] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [docFolderMap, setDocFolderMap] = useState<DocFolderMap>({});
  const [docFolderStateHydrated, setDocFolderStateHydrated] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(Object.values(ROOT_FOLDER_IDS)),
  );
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderRoot, setNewFolderRoot] = useState<VaultFolderRoot>("personal");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const [folderStateHydrated, setFolderStateHydrated] = useState(false);
  const [vaultPrefs, setVaultPrefs] = useState<VaultFolderPreferences>(DEFAULT_VAULT_PREFERENCES);
  const [showFolderSuggestions, setShowFolderSuggestions] = useState(true);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [renameFolderError, setRenameFolderError] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [isMoveFolderDialogOpen, setIsMoveFolderDialogOpen] = useState(false);
  const [moveFolderDocId, setMoveFolderDocId] = useState<string | null>(null);
  const [moveFolderTargetId, setMoveFolderTargetId] = useState<string | null>(null);
  const [trainingStatusByDocId, setTrainingStatusByDocId] = useState<Record<string, DocTrainingState>>({});
  const [loadingTrainingDocId, setLoadingTrainingDocId] = useState<string | null>(null);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signRecipientName, setSignRecipientName] = useState("");
  const [signRecipientEmail, setSignRecipientEmail] = useState("");
  const [isSendingForSignature, setIsSendingForSignature] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "ready" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const folderNameInputRef = useRef<HTMLInputElement | null>(null);

  const templateNameMap = useMemo(() => {
    const map = new Map<string, string>();
    TEMPLATES.forEach((template) => map.set(template.id, template.name));
    return map;
  }, []);

  const RECENT_DAYS = 14;

  const existingTitleSet = useMemo(() => {
    const titles = new Set<string>();
    (rows ?? []).forEach((row) => {
      const title = (row.title ?? "").trim().toLowerCase();
      if (title) titles.add(title);
    });
    return titles;
  }, [rows]);

  const matchesQuickFilter = (row: Row, filter: ViewKey): boolean => {
    if (filter === "all") return true;

    const status = (row.status ?? "").toLowerCase();
    const title = (row.title ?? "").toLowerCase();

    const isRecent = (() => {
      const iso = row.updated_at ?? row.created_at;
      const t = new Date(iso).getTime();
      if (!Number.isFinite(t)) return false;
      const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
      return t >= cutoff;
    })();

    switch (filter) {
      case "archived":
        return status === "archived";
      case "signed":
        return (
          status === "signed" ||
          status === "executed" ||
          status === "completed" ||
          title.includes("signed")
        );
      case "shared":
        return status === "shared" || title.includes("shared");
      case "starred":
        return status === "starred" || title.includes("⭐");
      case "drafts":
        return status === "draft";
      case "recent":
        return isRecent;
      default:
        return true;
    }
  };

  const countsByFilter = useMemo<Record<ViewKey, number>>(() => {
    const base = rows ?? [];
    const counts: Record<ViewKey, number> = {
      all: base.length,
      starred: 0,
      recent: 0,
      shared: 0,
      drafts: 0,
      signed: 0,
      archived: 0,
    };

    for (const r of base) {
      if (matchesQuickFilter(r, "starred")) counts.starred += 1;
      if (matchesQuickFilter(r, "recent")) counts.recent += 1;
      if (matchesQuickFilter(r, "shared")) counts.shared += 1;
      if (matchesQuickFilter(r, "drafts")) counts.drafts += 1;
      if (matchesQuickFilter(r, "signed")) counts.signed += 1;
      if (matchesQuickFilter(r, "archived")) counts.archived += 1;
    }

    return counts;
  }, [rows]);

  const viewItems = useMemo(() => {
    return viewDefs.map((f) => ({
      ...f,
      count: countsByFilter[f.id] ?? 0,
    }));
  }, [countsByFilter]);

  const rootFolders = useMemo(
    () => [
      { id: ROOT_FOLDER_IDS.personal, name: "Personal", root: "personal" as const },
      { id: ROOT_FOLDER_IDS.company, name: "Business", root: "company" as const },
    ],
    [],
  );

  const resolveFolderSelection = (value: string | null, available: VaultFolder[]): string | null => {
    if (!value) return null;
    if (value === ROOT_FOLDER_IDS.personal || value === ROOT_FOLDER_IDS.company) return value;
    return available.some((folder) => folder.id === value) ? value : null;
  };

  const selectedFolderInfo = useMemo<SelectedFolderInfo | null>(() => {
    if (!selectedFolderId) return null;
    if (selectedFolderId === ROOT_FOLDER_IDS.personal) {
      return { id: selectedFolderId, name: "Personal", root: "personal", parentId: null, isRoot: true };
    }
    if (selectedFolderId === ROOT_FOLDER_IDS.company) {
      return { id: selectedFolderId, name: "Business", root: "company", parentId: null, isRoot: true };
    }
    const folder = folders.find((item) => item.id === selectedFolderId);
    if (!folder) return null;
    return {
      id: folder.id,
      name: folder.name,
      root: folder.root,
      parentId: folder.parentId,
      isRoot: false,
    };
  }, [selectedFolderId, folders]);

  const primaryHeaderLabel = selectedFolderInfo ? selectedFolderInfo.name : viewLabels[quickFilter];

  const folderTree = useMemo(() => {
    const byParent = new Map<string, VaultFolder[]>();
    const roots = new Map<VaultFolderRoot, VaultFolder[]>();
    for (const folder of folders) {
      if (folder.parentId) {
        const list = byParent.get(folder.parentId) ?? [];
        list.push(folder);
        byParent.set(folder.parentId, list);
      } else {
        const list = roots.get(folder.root) ?? [];
        list.push(folder);
        roots.set(folder.root, list);
      }
    }
    const sortFn = (a: VaultFolder, b: VaultFolder) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    for (const list of roots.values()) list.sort(sortFn);
    for (const list of byParent.values()) list.sort(sortFn);
    return { byParent, roots };
  }, [folders]);

  const folderById = useMemo(() => {
    return new Map<string, VaultFolder>(folders.map((folder) => [folder.id, folder]));
  }, [folders]);

  const suggestedFolderNames = useMemo(() => {
    const baseSuggestions =
      vaultPrefs.defaultBuckets.length > 0 ? vaultPrefs.defaultBuckets : VAULT_BUCKET_OPTIONS;
    const existingTags = new Set(
      folders
        .filter(
          (folder) => folder.root === newFolderRoot && folder.parentId === newFolderParentId,
        )
        .map((folder) => normalizeFolderTag(folder.name)),
    );
    const suggestions: string[] = [];
    for (const suggestion of baseSuggestions) {
      const trimmed = suggestion.trim();
      if (!trimmed) continue;
      const tag = normalizeFolderTag(trimmed);
      if (existingTags.has(tag)) continue;
      if (suggestions.some((name) => normalizeFolderTag(name) === tag)) continue;
      suggestions.push(trimmed);
      if (suggestions.length >= 3) break;
    }
    return suggestions;
  }, [folders, newFolderParentId, newFolderRoot, vaultPrefs.defaultBuckets]);

  const missingPinnedBuckets = useMemo(() => {
    if (vaultPrefs.defaultBuckets.length === 0) return [];
    const existingTags = new Set(
      folders
        .filter((folder) => folder.root === vaultPrefs.defaultRoot && folder.parentId === null)
        .map((folder) => normalizeFolderTag(folder.name)),
    );
    const missing: string[] = [];
    for (const bucket of vaultPrefs.defaultBuckets) {
      const trimmed = bucket.trim();
      if (!trimmed) continue;
      const tag = normalizeFolderTag(trimmed);
      if (existingTags.has(tag)) continue;
      if (missing.some((name) => normalizeFolderTag(name) === tag)) continue;
      missing.push(trimmed);
    }
    return missing;
  }, [folders, vaultPrefs.defaultBuckets, vaultPrefs.defaultRoot]);

  const folderTagIndex = useMemo(() => {
    const map = new Map<string, string[]>();
    (rows ?? []).forEach((row) => {
      map.set(row.id, extractFolderTagsFromContent(row.latestVersion?.content));
    });
    return map;
  }, [rows]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readVaultFolderStateFromStorage();
    if (stored?.folders) {
      setFolders(stored.folders);
    }
    const storedPrefs = readVaultPreferencesFromStorage();
    if (storedPrefs) {
      setVaultPrefs({
        ...DEFAULT_VAULT_PREFERENCES,
        ...storedPrefs,
        defaultBuckets:
          storedPrefs.defaultBuckets.length > 0
            ? storedPrefs.defaultBuckets
            : DEFAULT_VAULT_PREFERENCES.defaultBuckets,
      });
    }
    const selected = resolveFolderSelection(
      readVaultFolderFromLocation() ?? stored?.selectedFolderId ?? null,
      stored?.folders ?? [],
    );
    pendingFolderRef.current = selected;
    lastAppliedFolderRef.current = selected;
    setSelectedFolderId(selected);
    setFolderStateHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readVaultFileFolderMapFromStorage();
    if (stored) {
      setDocFolderMap(stored);
    }
    setDocFolderStateHydrated(true);
  }, []);

  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  useEffect(() => {
    if (!docFolderStateHydrated) return;
    try {
      window.localStorage.setItem(VAULT_FILE_FOLDER_STORAGE_KEY, JSON.stringify(docFolderMap));
    } catch {
      // Ignore storage write errors.
    }
  }, [docFolderMap, docFolderStateHydrated]);

  // Keep Vault search in sync with the URL (/vault?q=...).
  // IMPORTANT: Do NOT use useSearchParams() here, because it can trigger CSR bailout warnings in Next build.
  useEffect(() => {
    const q = readVaultQueryFromLocation();
    pendingQueryRef.current = q;
    lastAppliedQueryRef.current = q;
    setSearchQuery(q);
  }, []);

  // Keep Vault view in sync with the URL (/vault?view=...).
  useEffect(() => {
    const activeFolder = readVaultFolderFromLocation();
    if (activeFolder) {
      pendingViewRef.current = "all";
      lastAppliedViewRef.current = "all";
      setQuickFilter("all");
      return;
    }
    const view = readVaultViewFromLocation();
    pendingViewRef.current = view;
    lastAppliedViewRef.current = view;
    setQuickFilter(view);
  }, []);

  // Back/forward navigation updates searchQuery (popstate).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = () => {
      const q = readVaultQueryFromLocation();
      if (q !== lastAppliedQueryRef.current) {
        lastAppliedQueryRef.current = q;
        setSearchQuery(q);
      }

      const folder = resolveFolderSelection(readVaultFolderFromLocation(), foldersRef.current);
      if (folder !== lastAppliedFolderRef.current) {
        lastAppliedFolderRef.current = folder;
        setSelectedFolderId(folder);
      }
      const view = readVaultViewFromLocation();
      const nextView = folder ? "all" : view;
      if (nextView !== lastAppliedViewRef.current) {
        lastAppliedViewRef.current = nextView;
        setQuickFilter(nextView);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // When user types in Vault search, keep the URL up to date (replaceState, no extra navigation).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const desired = searchQuery.trim();
    const pending = pendingQueryRef.current;
    if (pending !== null) {
      if (desired !== pending) return;
      pendingQueryRef.current = null;
    }
    const current = readVaultQueryFromLocation();

    // Avoid loops and unnecessary history churn.
    if (desired === current) return;

    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      if (desired) {
        params.set("q", desired);
      } else {
        params.delete("q");
      }

      const nextSearch = params.toString();
      const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
      lastAppliedQueryRef.current = desired;
    } catch {
      // If URL parsing fails, do nothing (search still works locally).
    }
  }, [searchQuery]);

  // When user switches views, keep the URL up to date (replaceState, no extra navigation).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const desired = quickFilter;
    const pending = pendingViewRef.current;
    if (pending !== null) {
      if (desired !== pending) return;
      pendingViewRef.current = null;
    }
    const current = readVaultViewFromLocation();

    if (desired === current) return;

    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      if (desired === "all") {
        params.delete("view");
      } else {
        params.set("view", desired);
      }

      const nextSearch = params.toString();
      const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
      lastAppliedViewRef.current = desired;
    } catch {
      // If URL parsing fails, do nothing (view still works locally).
    }
  }, [quickFilter]);

  // When user switches folders, keep the URL up to date (replaceState, no extra navigation).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const desired = selectedFolderId;
    const pending = pendingFolderRef.current;
    if (pending !== null) {
      if (desired !== pending) return;
      pendingFolderRef.current = null;
    }
    const current = readVaultFolderFromLocation();

    if (desired === current) return;

    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      if (desired) {
        params.set(VAULT_FOLDER_URL_PARAM, desired);
      } else {
        params.delete(VAULT_FOLDER_URL_PARAM);
      }

      const nextSearch = params.toString();
      const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
      lastAppliedFolderRef.current = desired;
    } catch {
      // If URL parsing fails, do nothing (folder selection still works locally).
    }
  }, [selectedFolderId]);

  useEffect(() => {
    if (!selectedFolderId) return;
    if (quickFilter !== "all") {
      setQuickFilter("all");
    }
  }, [selectedFolderId, quickFilter]);

  useEffect(() => {
    if (!folderStateHydrated) return;
    if (typeof window === "undefined") return;
    try {
      const payload: VaultFolderState & { prefs?: VaultFolderPreferences } = {
        folders,
        selectedFolderId,
        prefs: vaultPrefs,
      };
      window.localStorage.setItem(VAULT_FOLDER_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
  }, [folders, selectedFolderId, folderStateHydrated, vaultPrefs]);

  useEffect(() => {
    if (!selectedFolderInfo) return;
    setExpandedFolderIds((prev) => {
      const expandIds = new Set(prev);
      expandIds.add(ROOT_FOLDER_IDS[selectedFolderInfo.root]);
      let currentParent = selectedFolderInfo.parentId;
      while (currentParent) {
        expandIds.add(currentParent);
        const parent = folders.find((folder) => folder.id === currentParent);
        currentParent = parent?.parentId ?? null;
      }
      if (selectedFolderInfo.isRoot) {
        expandIds.add(selectedFolderInfo.id);
      }
      let changed = expandIds.size !== prev.size;
      if (!changed) {
        for (const id of expandIds) {
          if (!prev.has(id)) {
            changed = true;
            break;
          }
        }
      }
      return changed ? expandIds : prev;
    });
  }, [selectedFolderInfo, folders]);

  useEffect(() => {
    if (!isFolderDialogOpen) return;
    const defaultRoot = selectedFolderInfo?.root ?? vaultPrefs.defaultRoot;
    const defaultParent =
      selectedFolderInfo && !selectedFolderInfo.isRoot ? selectedFolderInfo.id : null;
    setNewFolderRoot(defaultRoot);
    setNewFolderParentId(defaultParent);
    setNewFolderName("");
    setNewFolderError(null);
    setShowFolderSuggestions(true);
  }, [isFolderDialogOpen, selectedFolderInfo, vaultPrefs.defaultRoot]);

  useEffect(() => {
    if (!isFolderDialogOpen) return;
    if (!newFolderParentId) return;
    const parent = folders.find((folder) => folder.id === newFolderParentId);
    if (!parent || parent.root !== newFolderRoot) {
      setNewFolderParentId(null);
    }
  }, [isFolderDialogOpen, newFolderParentId, newFolderRoot, folders]);

  const folderFilteredRows = useMemo(() => {
    const base = rows ?? [];
    const folderTag = selectedFolderInfo ? normalizeFolderTag(selectedFolderInfo.name) : "";

    return base.filter((row) => {
      if (!matchesQuickFilter(row, quickFilter)) return false;
      if (!selectedFolderInfo) return true;
      const hasMapping = Object.prototype.hasOwnProperty.call(docFolderMap, row.id);
      const mappedFolderId = typeof docFolderMap[row.id] === "string" ? docFolderMap[row.id] : null;
      if (hasMapping) {
        if (selectedFolderInfo.isRoot) {
          if (!mappedFolderId) return false;
          const mappedFolder = folderById.get(mappedFolderId);
          return mappedFolder?.root === selectedFolderInfo.root;
        }
        return mappedFolderId === selectedFolderInfo.id;
      }
      if (!folderTag) return false;
      const tags = folderTagIndex.get(row.id) ?? [];
      return tags.some((tag) => normalizeFolderTag(tag) === folderTag);
    });
  }, [rows, quickFilter, selectedFolderInfo, folderTagIndex, docFolderMap, folderById]);

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return folderFilteredRows.filter((row) => {
      if (!q) return true;
      return (row.title ?? "").toLowerCase().includes(q);
    });
  }, [folderFilteredRows, searchQuery]);

  useEffect(() => {
    if (!selectedDoc) return;
    const stillVisible = visibleRows.some((r) => r.id === selectedDoc);
    if (!stillVisible) setSelectedDoc(null);
  }, [visibleRows, selectedDoc]);

  // 1) Load current user ASAP
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await sb.auth.getUser();
        if (cancelled) return;
        if (error || !data.user) {
          setUserId(DEMO_OWNER_ID);
          setUserReady(true);
          return;
        }
        setUserId(data.user.id);
        setUserReady(true);
      } catch (err) {
        if (cancelled) return;
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
        if (status === 401 || status === 403) {
          handleApiError({
            status,
            errorMessage,
            toast,
            context: "vault",
          });
        } else {
          // Silently fall back to demo user for non-auth errors
          console.warn("[vault] Error loading user, using demo user", err);
        }
        setUserId(DEMO_OWNER_ID);
        setUserReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, toast]);

  // 2) Load docs + latest versions for this user
  // Save-to-Vault inserts into this document table with matching owner/org/status, so newly saved docs for the current user/org appear here.
  useEffect(() => {
    if (!userReady) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      if (!userId) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data: docs, error: docsErr } = await sbAny
        .from("document")
        .select("id, org_id, owner_id, title, kind, status, created_at, updated_at, current_version_id")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (docsErr) {
        const errorMessage = docsErr.message;
        const status = errorMessage.includes("401") || docsErr.code === "PGRST301" || docsErr.code === "42501" ? 401 : 500;
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault",
        });
        setErr(errorMessage);
        setRows([]);
        setLoading(false);
        return;
      }

      if (!docs?.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      const ids = docs.map((d: any) => d.id);
      const { data: versions, error: vErr } = await sbAny
        .from("version")
        .select("document_id, number, content, created_at")
        .in("document_id", ids)
        .order("number", { ascending: false });

      if (cancelled) return;

      if (vErr) {
        const errorMessage = vErr.message;
        const status = errorMessage.includes("401") || vErr.code === "PGRST301" || vErr.code === "42501" ? 401 : 500;
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault",
        });
        setErr(errorMessage);
        setRows([]);
        setLoading(false);
        return;
      }

      const info = new Map<
        string,
        { latest?: VersionSummary; count: number; updatedAt: string }
      >();

      versions?.forEach((v: any) => {
        const current = info.get(v.document_id) ?? { latest: undefined, count: 0, updatedAt: "" };
        current.count += 1;
        if (!current.latest || v.number > current.latest.number) {
          current.latest = v;
        }
        if (!current.updatedAt || new Date(v.created_at) > new Date(current.updatedAt)) {
          current.updatedAt = v.created_at;
        }
        info.set(v.document_id, current);
      });

      const merged: Row[] = (docs ?? []).map((d: any) => {
        const meta = info.get(d.id) ?? { latest: undefined, count: 0, updatedAt: d.created_at };
        return {
          id: d.id,
          title: d.title,
          org_id: (d as any).org_id ?? null,
          kind: d.kind ?? null,
          status: (d as any).status ?? null,
          templateId: null,
          created_at: d.created_at,
          updated_at: meta.updatedAt ?? d.created_at,
          versionCount: meta.count,
          latestVersion: meta.latest,
        };
      });

      setRows(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, userId, userReady, vaultRefreshKey, toast]);

  // events
  async function logEvent(
    docId: string,
    type: "view" | "download" | "share_created",
    meta?: EventMeta
  ) {
    if (!userId) return;
    const metaPayload: EventMeta = meta ? { from: "vault", ...meta } : { from: "vault" };
    const { error } = await sbAny.from("events").insert({
      doc_id: docId,
      event_type: type,
      actor: userId,
      meta_json: metaPayload,
    });
    if (error) console.warn("Failed to log event:", error.message);
  }

  // helper: ensure we really have a user id before inserting NOT NULL uuid
  async function ensureUserId(): Promise<string> {
    if (userId) return userId;
    const { data } = await sb.auth.getUser();
    if (data?.user?.id) {
      setUserId(data.user.id);
      return data.user.id;
    }
    setUserId(DEMO_OWNER_ID);
    return DEMO_OWNER_ID;
  }

  function resetUploadState() {
    setUploadItems([]);
    setUploadStatus("idle");
    setUploadError(null);
  }

  function handleUploadDialogChange(open: boolean) {
    if (!open && uploadStatus === "uploading") {
      return;
    }
    if (!open && uploadStatus !== "uploading") {
      if (uploadStatus !== "success") {
        toast({
          title: "Upload cancelled",
          description: "No files were uploaded. Select files to try again.",
        });
      }
      resetUploadState();
    }
    setIsUploadDialogOpen(open);
  }

  function handleUploadSelection(files: FileList | null) {
    const selected = files ? Array.from(files) : [];
    if (selected.length === 0) {
      setUploadItems([]);
      setUploadStatus("idle");
      setUploadError(null);
      toast({
        title: "No files selected",
        description: `Choose ${VAULT_UPLOAD_ALLOWED_LABEL} files to upload.`,
      });
      return;
    }

    const seenTitles = new Set<string>();
    const nextItems: UploadItem[] = selected.map((file) => {
      const ext = getFileExtension(file.name);
      const title = buildVaultTitle(file.name);
      const titleKey = title.toLowerCase();

      if (!VAULT_UPLOAD_ALLOWED_EXTENSIONS.includes(ext as (typeof VAULT_UPLOAD_ALLOWED_EXTENSIONS)[number])) {
        return {
          file,
          title,
          status: "unsupported",
          message: `Unsupported file type${ext ? ` .${ext}` : ""}`,
        };
      }

      if (existingTitleSet.has(titleKey) || seenTitles.has(titleKey)) {
        return {
          file,
          title,
          status: "duplicate",
          message: existingTitleSet.has(titleKey) ? "Already in Vault" : "Duplicate in selection",
        };
      }

      seenTitles.add(titleKey);
      return {
        file,
        title,
        status: "ready",
      };
    });

    setUploadItems(nextItems);
    setUploadStatus("ready");
    setUploadError(null);
  }

  async function startUpload(nextItems?: UploadItem[]) {
    const items = nextItems ?? uploadItems;
    const readyItems = items.filter((item) => item.status === "ready");

    if (readyItems.length === 0) {
      toast({
        title: "No files ready to upload",
        description: "Remove duplicates or unsupported files, then try again.",
      });
      return;
    }

    setUploadStatus("uploading");
    setUploadError(null);

    let successCount = 0;
    let failureCount = 0;

    for (const item of readyItems) {
      setUploadItems((prev) =>
        prev.map((current) =>
          current.file === item.file ? { ...current, status: "uploading", message: undefined } : current,
        ),
      );

      try {
        const content = await item.file.text();
        const response = await fetch("/api/documents/versions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title || item.file.name,
            content,
            kind: "file",
          }),
        });

        const text = await response.text();
        let payload: { error?: string } = {};
        try {
          payload = text ? (JSON.parse(text) as { error?: string }) : {};
        } catch {
          // Ignore parse errors; use raw text fallback below.
        }

        if (!response.ok || payload.error) {
          throw new Error(
            payload.error ||
            text ||
            `Upload failed (HTTP ${response.status})`,
          );
        }

        successCount += 1;
        setUploadItems((prev) =>
          prev.map((current) =>
            current.file === item.file ? { ...current, status: "uploaded", message: undefined } : current,
          ),
        );
      } catch (error) {
        failureCount += 1;
        const message = error instanceof Error ? error.message : "Upload failed";
        setUploadItems((prev) =>
          prev.map((current) =>
            current.file === item.file ? { ...current, status: "error", message } : current,
          ),
        );
      }
    }

    if (failureCount > 0) {
      setUploadStatus("error");
      setUploadError(
        `${failureCount} file${failureCount === 1 ? "" : "s"} failed to upload. Fix the issues and retry.`,
      );
    } else {
      setUploadStatus("success");
      toast({
        title: `Uploaded ${successCount} file${successCount === 1 ? "" : "s"}`,
        description: "Your documents are now in Vault.",
      });
      setVaultRefreshKey((key) => key + 1);
      setIsUploadDialogOpen(false);
      resetUploadState();
    }
  }

  function retryFailedUploads() {
    const retryItems = uploadItems.map<UploadItem>((item) =>
      item.status === "error" ? { ...item, status: "ready", message: undefined } : item,
    );
    setUploadItems(retryItems);
    setUploadStatus("ready");
    setUploadError(null);
    void startUpload(retryItems);
  }

  // actions
  async function onView(r: Row) {
    if (!r.latestVersion?.content) return;
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    await logEvent(r.id, "view");
    phCapture("vault_view_doc", { docId: r.id });
    router.push(`/vault/${encodeURIComponent(r.id)}`);
  }

  async function onDownload(r: Row) {
    if (!r.latestVersion?.content) return;
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    await logEvent(r.id, "download");
    phCapture("vault_download_doc", { docId: r.id });

    // For decks, use the export route
    if (r.kind === "deck") {
      const exportUrl = `/api/decks/${r.id}/export`;
      window.open(exportUrl, "_blank", "noopener,noreferrer");
      toast({
        title: "Export opened",
        description: "Use your browser's print function (Ctrl+P / Cmd+P) to save as PDF.",
      });
      return;
    }

    // For other documents, download as markdown
    const blob = new Blob([r.latestVersion.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.title || "document"}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function onCreateLink(r: Row) {
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }

    const { data: doc } = await sbAny
      .from("document")
      .select("current_version_id")
      .eq("id", r.id)
      .single();

    try {
      // Get access token from the browser session and send it to the API.
      const { data: sessionData } = await sb.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("No session access token found. Please sign in again.");
      }

      const response = await fetch("/api/shares/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documentId: r.id,
          versionId: doc?.current_version_id ?? null,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        let payload: { id?: string; url?: string; error?: string } = {};
        let errorMessage = "Failed to create share link";

        try {
          const text = await response.text();
          if (text) {
            try {
              payload = JSON.parse(text) as { id?: string; url?: string; error?: string };
              errorMessage = payload?.error || errorMessage;
            } catch {
              // If JSON parse fails, use the text as error message
              errorMessage = text || errorMessage;
            }
          }
        } catch {
          // If response.text() fails, use status text
          errorMessage = response.statusText || errorMessage;
        }

        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault",
        });
        return;
      }

      const payload = (await response.json()) as {
        id?: string;
        url?: string;
        error?: string;
      };

      if (!payload.url) {
        toast({
          title: "Something went wrong",
          description: "We couldn't complete that action. Please try again.",
          variant: "destructive",
        });
        console.error("[vault] Share link created but no URL returned", payload);
        return;
      }

      phCapture("vault_share_created", { docId: r.id, shareId: payload.id, access: "public" });
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown error";
      const isAuthError = errorMessage.includes("Authentication required") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403");

      const status = isAuthError ? 401 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "vault",
      });
    }
  }

  async function onCreatePasscodeLink(r: Row) {
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    const pass = prompt("Set a passcode for this link:");
    if (!pass) return;
    const passcodeHash = await sha256Hex(pass);

    const { data: doc } = await sbAny
      .from("document")
      .select("current_version_id")
      .eq("id", r.id)
      .single();

    try {
      // Match onCreateLink: use bearer token so the server can auth even if cookies aren't present.
      const { data: sessionData } = await sb.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("No session access token found. Please sign in again.");
      }

      const response = await fetch("/api/shares/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documentId: r.id,
          versionId: doc?.current_version_id ?? null,
          // Back-compat flag (still set), but real enforcement is passcode_hash.
          requireEmail: true,
          passcodeHash,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        let payload: { id?: string; url?: string; error?: string } = {};
        let errorMessage = "Failed to create passcode link";

        try {
          const text = await response.text();
          if (text) {
            try {
              payload = JSON.parse(text) as { id?: string; url?: string; error?: string };
              errorMessage = payload?.error || errorMessage;
            } catch {
              errorMessage = text || errorMessage;
            }
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault",
        });
        return;
      }

      const payload = (await response.json()) as {
        id?: string;
        url?: string;
        error?: string;
      };

      if (!payload.url) {
        toast({
          title: "Something went wrong",
          description: "We couldn't complete that action. Please try again.",
          variant: "destructive",
        });
        console.error("[vault] Passcode link created but no URL returned", payload);
        return;
      }

      phCapture("vault_share_created", { docId: r.id, shareId: payload.id, access: "passcode" });
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown error";
      const isAuthError = errorMessage.includes("Authentication required") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403");

      const status = isAuthError ? 401 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "vault",
      });
    }
  }

  async function onConfirmSendForSignature(doc: Row | null | undefined) {
    if (!doc) return;

    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }

    const email = signRecipientEmail.trim();
    const name = signRecipientName.trim();

    if (!email) {
      toast({
        title: "Recipient email required",
        description: "Please enter an email address to send this document for signature.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSendingForSignature(true);

      const { data: docRow, error: docErr } = await sbAny
        .from("document")
        .select("current_version_id")
        .eq("id", doc.id)
        .single();

      if (docErr) {
        const errorMessage = docErr.message;
        const status =
          errorMessage.includes("401") || docErr.code === "PGRST301" || docErr.code === "42501"
            ? 401
            : 500;

        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault-sign",
        });
        return;
      }

      const response = await fetch("/api/sign/documenso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc.id,
          versionId: docRow?.current_version_id ?? null,
          recipient: {
            email: signRecipientEmail.trim(),
            name: signRecipientName.trim(),
          },
          source: "vault",
        }),
      });

      const text = await response.text();
      let payload: { ok?: boolean; error?: string } = {};
      try {
        payload = text ? (JSON.parse(text) as { ok?: boolean; error?: string }) : {};
      } catch {
        // Ignore JSON parse errors – fall back to raw text below.
      }

      if (!response.ok || payload.error || payload.ok === false) {
        const errorMessage =
          payload.error ||
          text ||
          `Failed to send for signature (HTTP ${response.status})`;

        handleApiError({
          status: response.status || 500,
          errorMessage,
          toast,
          context: "vault-sign",
        });
        return;
      }

      toast({
        title: "Signature request sent",
        description: "Your recipient will receive an email with a secure link to sign.",
      });

      phCapture("vault_send_for_signature", {
        docId: doc.id,
        hasVersion: Boolean(docRow?.current_version_id),
      });

      setIsSignDialogOpen(false);
      setSignRecipientName("");
      setSignRecipientEmail("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error sending for signature";
      handleApiError({
        status: 500,
        errorMessage,
        toast,
        context: "vault-sign",
      });
    } finally {
      setIsSendingForSignature(false);
    }
  }

  function openDoc(docId: string) {
    phCapture("vault_open_builder", { docId });
    router.push(`/builder?docId=${encodeURIComponent(docId)}`);
  }

  async function refreshTrainingStatusForDoc(doc: Row) {
    if (!doc.org_id) return;

    try {
      const response = await fetch(`/api/mono/train/status?orgId=${encodeURIComponent(doc.org_id)}`);
      const text = await response.text();

      if (!response.ok) {
        let errorMessage = "Failed to load Maestro training status";
        try {
          const parsed = text ? (JSON.parse(text) as { error?: string }) : undefined;
          if (parsed?.error) {
            errorMessage = parsed.error;
          } else if (text) {
            errorMessage = text;
          }
        } catch {
          if (text) {
            errorMessage = text;
          }
        }

        console.warn("[vault] Training status fetch failed", {
          status: response.status,
          bodyPreview: text.slice(0, 200),
        });

        toast({
          title: "Could not load training status",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      let payload: { ok?: boolean; jobs?: any[]; error?: string } = {};
      try {
        payload = text ? (JSON.parse(text) as typeof payload) : {};
      } catch {
        console.warn("[vault] Training status response was not valid JSON", text.slice(0, 200));
      }

      if (!payload.ok || !Array.isArray(payload.jobs)) {
        console.warn("[vault] Training status payload malformed", payload);
        return;
      }

      const docJobs = payload.jobs.filter((job: any) => job.vault_document_id === doc.id);

      let status: MonoTrainingStatus = "not_trained";
      let lastUpdated: string | null = null;
      let errorMessage: string | null = null;

      if (docJobs.length > 0) {
        docJobs.sort((a: any, b: any) => {
          const aTime = new Date(a.updated_at ?? a.completed_at ?? a.created_at ?? 0).getTime();
          const bTime = new Date(b.updated_at ?? b.completed_at ?? b.created_at ?? 0).getTime();
          return bTime - aTime;
        });

        const latest = docJobs[0];
        const s = String(latest.status ?? "").toLowerCase();

        if (s === "succeeded") {
          status = "trained";
        } else if (s === "failed") {
          status = "failed";
          errorMessage = latest.error_message ?? null;
        } else if (s === "pending" || s === "running") {
          status = "training";
        }

        lastUpdated = latest.updated_at ?? latest.completed_at ?? latest.created_at ?? null;
      }

      setTrainingStatusByDocId((prev) => ({
        ...prev,
        [doc.id]: {
          status,
          lastUpdated,
          error: errorMessage ?? undefined,
        },
      }));
    } catch (error) {
      console.error("[vault] Error fetching Maestro training status", error);
      toast({
        title: "Training status unavailable",
        description: "Could not load Maestro training status for this document.",
        variant: "destructive",
      });
    }
  }

  async function onTrainWithMono(doc: Row) {
    if (!doc.org_id) {
      toast({
        title: "Training unavailable",
        description: "This document is not associated with an organisation.",
        variant: "destructive",
      });
      return;
    }

    setLoadingTrainingDocId(doc.id);

    try {
      const response = await fetch("/api/mono/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: doc.org_id,
          vaultDocumentId: doc.id,
        }),
      });

      const text = await response.text();
      let payload: TrainResponse = {};
      try {
        payload = text ? (JSON.parse(text) as TrainResponse) : {};
      } catch {
        // If the body isn't JSON, we'll fall back to raw text in error handling
      }

      // Hard error: non-2xx HTTP
      if (!response.ok) {
        const errorMessage =
          payload.error ||
          text ||
          `Failed to queue training job (HTTP ${response.status})`;

        handleApiError({
          status: response.status || 500,
          errorMessage,
          toast,
          context: "vault-mono-train",
        });
        return;
      }

      // Soft error: explicit error field in a 2xx response
      if (payload.error) {
        handleApiError({
          status: response.status,
          errorMessage: payload.error,
          toast,
          context: "vault-mono-train",
        });
        return;
      }

      toast({
        title: "Training queued",
        description: "Maestro will train on this document in the background.",
      });

      await refreshTrainingStatusForDoc(doc);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      handleApiError({
        status: 500,
        errorMessage,
        toast,
        context: "vault-mono-train",
      });
    } finally {
      setLoadingTrainingDocId(null);
    }
  }

  type MonoContextDoc = {
    id: string;
    orgId?: string;
    title: string;
    kind: string;
    source: string;
    tags: string[];
    summary?: string | null;
  };

  type MonoContextResponse = {
    ok?: boolean;
    orgId?: string;
    query?: string | null;
    docs?: MonoContextDoc[];
    error?: string;
    source?: string;
  };

  async function onPreviewMonoContext(doc: Row) {
    if (!vaultExperimental) return;

    if (!doc.org_id) {
      toast({
        title: "Context preview unavailable",
        description: "This document is not associated with an organisation.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/mono/context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId: doc.org_id,
          query: doc.title,
          maxItems: 5,
        }),
      });

      const text = await response.text();
      let payload: MonoContextResponse = {};

      try {
        payload = text ? (JSON.parse(text) as MonoContextResponse) : {};
      } catch {
        // If parsing fails, fall back to a generic error
      }

      if (!response.ok || !payload.ok) {
        const errorMessage =
          payload.error ||
          text ||
          `Failed to load Maestro context (HTTP ${response.status})`;

        toast({
          title: "Could not load Maestro context",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const docs = payload.docs ?? [];

      // Log full details to the console for now – this is a dev/experimental inspector.
      // eslint-disable-next-line no-console
      console.groupCollapsed("[mono-context] preview for vault doc", doc.id);
      // eslint-disable-next-line no-console
      console.log("request", {
        orgId: payload.orgId,
        query: payload.query,
        source: payload.source,
      });
      // eslint-disable-next-line no-console
      console.table(
        docs.map((d) => ({
          id: d.id,
          title: d.title,
          kind: d.kind,
          source: d.source,
          tags: d.tags.join(", "),
        })),
      );
      // eslint-disable-next-line no-console
      console.groupEnd();

      toast({
        title: "Maestro context preview loaded",
        description:
          docs.length > 0
            ? `Fetched ${docs.length} training docs. Open the console for details.`
            : "No training docs matched for this document. Check the console for details.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error loading context";

      toast({
        title: "Maestro context unavailable",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  const actionsDisabled = !userReady || !userId;

  const selectedDocument = selectedDoc ? visibleRows.find((doc) => doc.id === selectedDoc) : null;
  const selectedDocumentFolderName = selectedDocument ? getDocFolderName(selectedDocument.id) : null;
  const hasFolders = folders.length > 0;
  const uploadReadyCount = uploadItems.filter((item) => item.status === "ready").length;
  const uploadUnsupportedCount = uploadItems.filter((item) => item.status === "unsupported").length;
  const uploadDuplicateCount = uploadItems.filter((item) => item.status === "duplicate").length;
  const uploadErrorCount = uploadItems.filter((item) => item.status === "error").length;
  const uploadHasIssues = uploadUnsupportedCount > 0 || uploadDuplicateCount > 0;
  const uploadHasFailures = uploadErrorCount > 0;
  const uploadHasLongNames = uploadItems.some((item) => item.file.name.length > 60);
  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasActiveViewFilter = quickFilter !== "all";
  const hasActiveFolderFilter = selectedFolderInfo !== null;
  const hasActiveFilters = hasSearchQuery || hasActiveViewFilter || hasActiveFolderFilter;
  const hasAnyRows = (rows?.length ?? 0) > 0;
  const showEmptyLibrary = !loading && !err && !hasAnyRows;
  const showEmptyDrafts =
    !loading &&
    !err &&
    !showEmptyLibrary &&
    !hasSearchQuery &&
    quickFilter === "drafts" &&
    countsByFilter.drafts === 0;
  const showEmptyFolder =
    !loading &&
    !err &&
    !showEmptyLibrary &&
    !showEmptyDrafts &&
    selectedFolderInfo !== null &&
    folderFilteredRows.length === 0;
  const showNoMatches =
    !loading &&
    !err &&
    visibleRows.length === 0 &&
    !showEmptyLibrary &&
    !showEmptyDrafts &&
    !showEmptyFolder;

  function clearVaultFilters() {
    setSearchQuery("");
    setQuickFilter("all");
    setSelectedFolderId(null);
  }

  function onSelectView(view: ViewKey) {
    setQuickFilter(view);
    setSelectedFolderId(null);
  }

  const folderParentOptions = useMemo(() => {
    const candidates = folders.filter((folder) => folder.root === newFolderRoot);
    const folderById = new Map(candidates.map((folder) => [folder.id, folder]));
    const buildPath = (folder: VaultFolder): string => {
      const parts = [folder.name];
      let currentParentId = folder.parentId;
      while (currentParentId) {
        const parent = folderById.get(currentParentId);
        if (!parent) break;
        parts.unshift(parent.name);
        currentParentId = parent.parentId;
      }
      return parts.join(" / ");
    };
    return candidates
      .map((folder) => ({
        id: folder.id,
        label: buildPath(folder),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [folders, newFolderRoot]);

  function toggleFolderExpanded(folderId: string) {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  function onSelectFolder(folderId: string) {
    setSelectedFolderId(folderId);
    setQuickFilter("all");
  }

  function applyFolderSuggestion(value: string, focus: boolean) {
    setNewFolderName(value);
    if (newFolderError) setNewFolderError(null);
    if (focus) {
      requestAnimationFrame(() => folderNameInputRef.current?.focus());
    }
  }

  function onPinPreferredBuckets() {
    if (vaultPrefs.defaultBuckets.length === 0) {
      toast({
        title: "No buckets selected",
        description: "Choose default buckets in Settings to pin them here.",
      });
      return;
    }
    if (missingPinnedBuckets.length === 0) {
      toast({
        title: "Buckets already pinned",
        description: "All preferred buckets already exist at the top level.",
      });
      return;
    }
    const createdAt = new Date().toISOString();
    const newFolders = missingPinnedBuckets.map((bucket) => ({
      id: createVaultFolderId(),
      name: bucket,
      parentId: null,
      root: vaultPrefs.defaultRoot,
      createdAt,
    }));
    setFolders((prev) => [...prev, ...newFolders]);
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      next.add(ROOT_FOLDER_IDS[vaultPrefs.defaultRoot]);
      return next;
    });
  }

  function onSubmitNewFolder() {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setNewFolderError("Folder name is required.");
      return;
    }
    if (trimmed.length > VAULT_FOLDER_NAME_MAX) {
      setNewFolderError(`Folder name must be ${VAULT_FOLDER_NAME_MAX} characters or less.`);
      return;
    }
    const duplicate = folders.some(
      (folder) =>
        folder.root === newFolderRoot &&
        folder.parentId === newFolderParentId &&
        normalizeFolderTag(folder.name) === normalizeFolderTag(trimmed),
    );
    if (duplicate) {
      setNewFolderError("A folder with this name already exists here.");
      return;
    }
    const nextFolder: VaultFolder = {
      id: createVaultFolderId(),
      name: trimmed,
      parentId: newFolderParentId,
      root: newFolderRoot,
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, nextFolder]);
    setSelectedFolderId(nextFolder.id);
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      next.add(ROOT_FOLDER_IDS[newFolderRoot]);
      if (newFolderParentId) next.add(newFolderParentId);
      return next;
    });
    setIsFolderDialogOpen(false);
  }

  function onRequestRenameFolder(folderId: string) {
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) return;
    setRenameFolderId(folderId);
    setRenameFolderName(folder.name);
    setRenameFolderError(null);
  }

  function onSubmitRenameFolder() {
    if (!renameFolderId) return;
    const folder = folders.find((item) => item.id === renameFolderId);
    if (!folder) {
      setRenameFolderId(null);
      return;
    }
    const trimmed = renameFolderName.trim();
    if (!trimmed) {
      setRenameFolderError("Folder name is required.");
      return;
    }
    if (trimmed.length > VAULT_FOLDER_NAME_MAX) {
      setRenameFolderError(`Folder name must be ${VAULT_FOLDER_NAME_MAX} characters or less.`);
      return;
    }
    const duplicate = folders.some(
      (candidate) =>
        candidate.id !== renameFolderId &&
        candidate.root === folder.root &&
        candidate.parentId === folder.parentId &&
        normalizeFolderTag(candidate.name) === normalizeFolderTag(trimmed),
    );
    if (duplicate) {
      setRenameFolderError("A folder with this name already exists here.");
      return;
    }
    setFolders((prev) =>
      prev.map((item) => (item.id === renameFolderId ? { ...item, name: trimmed } : item)),
    );
    setRenameFolderId(null);
  }

  function onRequestDeleteFolder(folderId: string) {
    setDeleteFolderId(folderId);
  }

  function onConfirmDeleteFolder() {
    if (!deleteFolderId) return;
    const hasChildren = (folderTree.byParent.get(deleteFolderId) ?? []).length > 0;
    if (hasChildren) return;
    setFolders((prev) => prev.filter((folder) => folder.id !== deleteFolderId));
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteFolderId);
      return next;
    });
    if (selectedFolderId === deleteFolderId) {
      setSelectedFolderId(ROOT_FOLDER_IDS.personal);
    }
    setDeleteFolderId(null);
  }

  function getDocFolderId(docId: string): string | null {
    const value = docFolderMap[docId];
    return typeof value === "string" ? value : null;
  }

  function getDocFolderName(docId: string): string | null {
    const folderId = getDocFolderId(docId);
    if (!folderId) return null;
    return folderById.get(folderId)?.name ?? null;
  }

  function openMoveFolderDialog(docId: string) {
    if (folders.length === 0) return;
    const assignedFolderId = getDocFolderId(docId);
    const defaultFolderId =
      assignedFolderId ??
      (selectedFolderInfo && !selectedFolderInfo.isRoot ? selectedFolderInfo.id : null);
    setMoveFolderDocId(docId);
    setMoveFolderTargetId(defaultFolderId && folderById.has(defaultFolderId) ? defaultFolderId : null);
    setIsMoveFolderDialogOpen(true);
  }

  function closeMoveFolderDialog() {
    setIsMoveFolderDialogOpen(false);
    setMoveFolderDocId(null);
    setMoveFolderTargetId(null);
  }

  function onConfirmMoveFolder() {
    if (!moveFolderDocId || !moveFolderTargetId) return;
    if (!folderById.has(moveFolderTargetId)) return;
    setDocFolderMap((prev) => ({
      ...prev,
      [moveFolderDocId]: moveFolderTargetId,
    }));
    closeMoveFolderDialog();
  }

  function onRemoveDocFromFolder(docId: string) {
    setDocFolderMap((prev) => ({
      ...prev,
      [docId]: null,
    }));
  }

  useEffect(() => {
    if (!isMoveFolderDialogOpen) return;
    if (!moveFolderTargetId) return;
    if (!folderById.has(moveFolderTargetId)) {
      setMoveFolderTargetId(null);
    }
  }, [isMoveFolderDialogOpen, moveFolderTargetId, folderById]);

  const renderFolderBranch = (node: SelectedFolderInfo, depth: number) => {
    const children = node.isRoot
      ? folderTree.roots.get(node.root) ?? []
      : folderTree.byParent.get(node.id) ?? [];
    const isExpandable = children.length > 0;
    const isExpanded = expandedFolderIds.has(node.id);
    const hasChildren = (folderTree.byParent.get(node.id) ?? []).length > 0;
    return (
      <div key={node.id} className="space-y-1">
        <div className="flex items-center gap-1" style={{ paddingLeft: depth * 12 }}>
          {isExpandable ? (
            <button
              type="button"
              className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
              onClick={() => toggleFolderExpanded(node.id)}
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="h-6 w-6" />
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onSelectFolder(node.id)}
              className={cn(
                "flex-1 w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-sm min-w-0",
                "hover:bg-sidebar-active/50",
                selectedFolderId === node.id && "bg-sidebar-active/60",
              )}
            >
              <span className={cn("min-w-0 truncate", node.isRoot && "font-medium")}>{node.name}</span>
            </button>
            {!node.isRoot && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRequestRenameFolder(node.id)}>
                    <Pencil className="h-3 w-3 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onRequestDeleteFolder(node.id)}
                    className={hasChildren ? undefined : "text-destructive"}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {isExpandable && isExpanded && (
          <div className="space-y-1">
            {children.map((child) =>
              renderFolderBranch(
                {
                  id: child.id,
                  name: child.name,
                  root: child.root,
                  parentId: child.parentId,
                  isRoot: false,
                },
                depth + 1,
              ),
            )}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!vaultExperimental || !ragEnabled) return;
    if (!selectedDocument) return;
    if (trainingStatusByDocId[selectedDocument.id]) return;

    void refreshTrainingStatusForDoc(selectedDocument);
  }, [selectedDocument, vaultExperimental, ragEnabled, trainingStatusByDocId]);

  // Guard against render-time crashes
  if (rows === null && !loading && !err) {
    return (
      <div className="h-full flex flex-col overflow-x-hidden">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
          <div className="grid grid-cols-[16rem,1fr] items-start">
            <div />
            <div className="px-6 min-w-0">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 text-base font-semibold text-foreground truncate">
                  {primaryHeaderLabel}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    Loading…
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                  <Link href="/builder">
                    <Button size="sm">
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="sr-only sm:not-sr-only">New Document</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">Upload Files</span>
                  </Button>
                  <Link href="/integrations">
                    <Button variant="outline" size="sm">
                      <Plug className="h-4 w-4 sm:mr-2" />
                      <span className="sr-only sm:not-sr-only">Import Files</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading your documents…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      <div className="flex-1 flex">
        <div className="w-64 shrink-0 border-r bg-sidebar overflow-x-hidden">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Views
            </div>
            <div className="space-y-1">
              {viewItems.map((view) => {
                const Icon = view.icon;
                return (
                  <button
                    key={view.label}
                    onClick={() => onSelectView(view.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm min-w-0",
                      "hover:bg-sidebar-active/50",
                      quickFilter === view.id && "bg-sidebar-active/60"
                    )}
                  >
                    <Icon className={`h-4 w-4 ${view.color}`} />
                    <span className="flex-1 text-left min-w-0 truncate">{view.label}</span>
                    <span className="text-xs text-muted-foreground">{view.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Folders</span>
              <TooltipProvider delayDuration={150}>
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onPinPreferredBuckets}
                        disabled={missingPinnedBuckets.length === 0}
                        aria-label="Pin buckets"
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Pin buckets</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsFolderDialogOpen(true)}
                        aria-label="New folder"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">New folder</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
            <div className="space-y-1 mt-2">
              {rootFolders.map((root) =>
                renderFolderBranch(
                  {
                    id: root.id,
                    name: root.name,
                    root: root.root,
                    parentId: null,
                    isRoot: true,
                  },
                  0,
                ),
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b px-6 pb-4 pt-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 text-base font-semibold text-foreground truncate">
                {primaryHeaderLabel}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {loading ? "Loading…" : `${visibleRows.length} documents`}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                <Link href="/builder">
                  <Button size="sm">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">New Document</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">Upload Files</span>
                </Button>
                <Link href="/integrations">
                  <Button variant="outline" size="sm">
                    <Plug className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">Import Files</span>
                  </Button>
                </Link>
              </div>
            </div>

          </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Loading your documents…</p>
            </div>
          )}

          {!loading && err && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-destructive">Error: {err}</p>
            </div>
          )}

          {showEmptyLibrary && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="Your Vault is empty"
                description="Import Files or create a New Document to start building your library."
                action={
                  <>
                    <Link href="/builder">
                      <Button>New Document</Button>
                    </Link>
                    <Link href="/integrations">
                      <Button variant="outline">Import Files</Button>
                    </Link>
                  </>
                }
                className="max-w-md bg-card"
              />
            </div>
          )}

          {showEmptyDrafts && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="No drafts yet"
                description="Start a draft with a New Document."
                action={
                  <Link href="/builder">
                    <Button>New Document</Button>
                  </Link>
                }
                className="max-w-md bg-card"
              />
            </div>
          )}

          {showEmptyFolder && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="No documents in this folder yet"
                description={
                  selectedFolderInfo
                    ? `Upload files or import documents to add items to ${selectedFolderInfo.name}.`
                    : "Upload files or import documents to add items to this folder."
                }
                action={
                  <>
                    <Button onClick={() => setIsUploadDialogOpen(true)}>Upload Files</Button>
                    <Link href="/integrations">
                      <Button variant="outline">Import Files</Button>
                    </Link>
                  </>
                }
                className="max-w-md bg-card"
              />
            </div>
          )}

          {showNoMatches && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="No matches found"
                description={
                  hasActiveFilters
                    ? "Try clearing filters or search to see more documents."
                    : "Try adjusting your search to find matching documents."
                }
                action={
                  hasActiveFilters ? (
                    <Button onClick={clearVaultFilters}>Clear filters/search</Button>
                  ) : (
                    <Button onClick={() => setSearchQuery("")}>Clear search</Button>
                  )
                }
                className="max-w-md bg-card"
              />
            </div>
          )}

          {!loading && !err && visibleRows.length > 0 && (
            <div
              className={cn(
                "flex-1 flex min-w-0 flex-col",
                selectedDocument && "xl:flex-row"
              )}
            >
              <div className={cn("flex-1 p-6 min-w-0", selectedDocument && "xl:max-w-[60%]")}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0 auto-rows-fr">
                  {visibleRows.map((doc) => (
                    <Card
                      key={doc.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:shadow-md h-full",
                        selectedDoc === doc.id && 'ring-2 ring-primary'
                      )}
                      onClick={() => setSelectedDoc(doc.id)}
                    >
                      <div className="flex h-full flex-col gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                              {doc.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 min-w-0 flex-nowrap">
                              {doc.kind === "deck" && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {(() => {
                                    const deckType = doc.latestVersion?.content
                                      ? (() => {
                                        const metadataMatch = doc.latestVersion.content.match(/<!-- MONO_DECK_METADATA:({.*?}) -->/);
                                        if (metadataMatch) {
                                          try {
                                            const metadata = JSON.parse(metadataMatch[1]) as { deck_type?: string };
                                            if (metadata.deck_type === "fundraising") return "Fundraising";
                                            if (metadata.deck_type === "investor_update") return "Investor Update";
                                          } catch {
                                            // Ignore
                                          }
                                        }
                                        return "Deck";
                                      })()
                                      : "Deck";
                                    return `Deck: ${deckType}`;
                                  })()}
                                </Badge>
                              )}
                              {doc.templateId && (
                                <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">
                                  {templateNameMap.get(doc.templateId) ?? "—"}
                                </span>
                              )}
                              {!doc.kind && !doc.templateId && (
                                <span className="text-xs text-muted-foreground truncate">—</span>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={!hasFolders}
                                onClick={() => openMoveFolderDialog(doc.id)}
                                title={!hasFolders ? "Create a folder to move this file." : undefined}
                              >
                                Move to folder…
                              </DropdownMenuItem>
                              {hasFolders &&
                                (selectedFolderInfo !== null || getDocFolderId(doc.id) !== null) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onRemoveDocFromFolder(doc.id)}>
                                      Remove from folder
                                    </DropdownMenuItem>
                                  </>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t mt-auto">
                          <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                          <span>{doc.versionCount ? `v${doc.versionCount}` : "—"}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedDocument && (
                <div className="border-t xl:border-t-0 xl:border-l bg-card min-w-0 xl:w-[40%]">
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold leading-snug line-clamp-2">
                          {selectedDocument.title}
                        </h2>
                        <div className="mt-1 flex items-center gap-2 min-w-0 flex-nowrap">
                          {selectedDocument.kind === "deck" && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {(() => {
                                const deckType = selectedDocument.latestVersion?.content
                                  ? (() => {
                                    const metadataMatch =
                                      selectedDocument.latestVersion.content.match(
                                        /<!-- MONO_DECK_METADATA:({.*?}) -->/
                                      );
                                    if (metadataMatch) {
                                      try {
                                        const metadata = JSON.parse(metadataMatch[1]) as { deck_type?: string };
                                        if (metadata.deck_type === "fundraising") return "Fundraising";
                                        if (metadata.deck_type === "investor_update") return "Investor Update";
                                      } catch {
                                        // Ignore
                                      }
                                    }
                                    return "Deck";
                                  })()
                                  : "Deck";
                                return `Deck: ${deckType}`;
                              })()}
                            </Badge>
                          )}
                          {selectedDocument.templateId && (
                            <span className="text-sm text-muted-foreground truncate min-w-0 flex-1">
                              {templateNameMap.get(selectedDocument.templateId) ?? "—"}
                            </span>
                          )}
                          {!selectedDocument.kind && !selectedDocument.templateId && (
                            <span className="text-sm text-muted-foreground truncate">—</span>
                          )}
                        </div>
                        {selectedDocumentFolderName && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Folder: <span className="font-medium text-foreground/80">{selectedDocumentFolderName}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedDoc(null)}
                        aria-label="Close details"
                      >
                        ×
                      </Button>
                    </div>

                    {/* Collapsible Version Details (default collapsed) */}
                    <details className="group rounded-lg border bg-background/50">
                      <summary className="cursor-pointer list-none px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium">Version history</span>
                            <span className="text-xs text-muted-foreground">
                              v{selectedDocument.versionCount || 1}
                            </span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                        </div>
                      </summary>
                      <div className="px-3 pb-3 pt-1 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">Last modified</div>
                            <div className="mt-1 text-sm">
                              {new Date(selectedDocument.updated_at).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">Versions</div>
                            <div className="mt-1 text-sm">
                              {selectedDocument.versionCount} available
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Latest</div>
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                              v{selectedDocument.versionCount || 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-medium truncate">Current version</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(selectedDocument.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Latest saved version
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* Actions (kept high on the panel, no extra scrolling needed) */}
                    <div className="space-y-2">
                      <h3 className="font-medium">Actions</h3>
                      {vaultExperimental && ragEnabled && (
                        <div className="space-y-2 mb-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Maestro training
                            </span>
                            {(() => {
                              const state =
                                (selectedDocument &&
                                  trainingStatusByDocId[selectedDocument.id]) ??
                                { status: "not_trained" as MonoTrainingStatus };

                              const label =
                                state.status === "trained"
                                  ? "Trained"
                                  : state.status === "training"
                                    ? "Training"
                                    : state.status === "failed"
                                      ? "Failed"
                                      : "Not trained";

                              return (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[11px]",
                                    state.status === "trained" &&
                                    "border-emerald-500 text-emerald-700",
                                    state.status === "failed" &&
                                    "border-destructive text-destructive"
                                  )}
                                >
                                  {label}
                                </Badge>
                              );
                            })()}
                          </div>
                          {selectedDocument && (
                            <Button
                              className="w-full justify-start"
                              variant="outline"
                              onClick={() => onTrainWithMono(selectedDocument)}
                              disabled={
                                actionsDisabled ||
                                loadingTrainingDocId === selectedDocument.id ||
                                !selectedDocument.org_id
                              }
                            >
                              {loadingTrainingDocId === selectedDocument.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Queueing training job…
                                </>
                              ) : (
                                <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  Train Maestro on this doc
                                </>
                              )}
                            </Button>
                          )}
                          {selectedDocument &&
                            trainingStatusByDocId[selectedDocument.id]?.lastUpdated && (
                              <p className="text-[11px] text-muted-foreground">
                                Last update:{" "}
                                {new Date(
                                  trainingStatusByDocId[selectedDocument.id]!.lastUpdated!
                                ).toLocaleString()}
                              </p>
                            )}
                          {selectedDocument &&
                            trainingStatusByDocId[selectedDocument.id]?.error && (
                              <p className="text-[11px] text-destructive">
                                {trainingStatusByDocId[selectedDocument.id]!.error}
                              </p>
                            )}
                          <p className="text-[11px] text-muted-foreground">
                            Experimental: queues a background job to add this document to
                            Maestro&apos;s training set.
                          </p>
                        </div>
                      )}
                      {vaultExperimental && ragEnabled && selectedDocument && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => onPreviewMonoContext(selectedDocument)}
                          disabled={actionsDisabled || !selectedDocument.org_id}
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Preview Maestro context (dev)
                        </Button>
                      )}
                      {vaultExperimental && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => openDoc(selectedDocument.id)}
                        >
                          Open in Builder
                        </Button>
                      )}
                      {selectedDocument.kind === "deck" && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const exportUrl = `/api/decks/${selectedDocument.id}/export`;
                              toast({
                                title: "Exporting deck",
                                description: "Generating export...",
                              });

                              // Get current user ID to pass to API for auth
                              let currentUserId: string | null = userId;
                              if (!currentUserId) {
                                try {
                                  const { data: { user } } = await sb.auth.getUser();
                                  if (user) {
                                    currentUserId = user.id;
                                  }
                                } catch {
                                  // Ignore errors, will fall back to cookie-based auth
                                }
                              }

                              // Fetch with credentials to ensure cookies are sent
                              const response = await fetch(exportUrl, {
                                method: "GET",
                                credentials: "include",
                                headers: {
                                  Accept: "text/html",
                                  ...(currentUserId && { "x-user-id": currentUserId }),
                                },
                              });

                              if (!response.ok) {
                                const errorText = await response.text().catch(() => "Unknown error");
                                throw new Error(errorText || `HTTP ${response.status}`);
                              }

                              const htmlBlob = await response.blob();
                              const blobUrl = URL.createObjectURL(htmlBlob);
                              const newWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");

                              // Clean up blob URL after a delay (even if window.open returns null)
                              setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

                              if (!newWindow) {
                                // window.open can return null even when it succeeds in some browsers
                                // Log a warning but don't fail - the blob URL is accessible
                                console.warn("[export-deck] window.open() returned null, but export may have succeeded");
                                toast({
                                  title: "Export generated",
                                  description: "Deck export ready. If a new tab didn't open, please check your popup blocker settings.",
                                });
                              } else {
                                toast({
                                  title: "Export opened",
                                  description: "Deck export opened in a new tab.",
                                });
                              }

                              // Log telemetry (fire-and-forget)
                              try {
                                logBuilderEvent("deck_exported", {
                                  doc_id: selectedDocument.id,
                                  source: "vault",
                                  // deck_type will be parsed from metadata if needed, or can be added later
                                });
                              } catch {
                                // Ignore telemetry errors
                              }
                            } catch (error) {
                              console.error("[export-deck] Error", error);
                              toast({
                                title: "Export failed",
                                description: error instanceof Error ? error.message : "Failed to export deck",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={actionsDisabled}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export Deck
                        </Button>
                      )}
                      <Button
                        className="w-full justify-start"
                        onClick={() => setIsSignDialogOpen(true)}
                        disabled={
                          actionsDisabled || !selectedDocument.latestVersion?.content
                        }
                      >
                        <FileSignature className="h-4 w-4 mr-2" />
                        Send for signature
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => onView(selectedDocument)}
                        disabled={actionsDisabled || !selectedDocument.latestVersion?.content}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button asChild className="w-full justify-start" variant="outline">
                        <Link href={`/vault/${encodeURIComponent(selectedDocument.id)}`}>
                          Review / Comments
                        </Link>
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => onDownload(selectedDocument)}
                        disabled={actionsDisabled || !selectedDocument.latestVersion?.content}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => onCreateLink(selectedDocument)}
                        disabled={actionsDisabled}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => onCreatePasscodeLink(selectedDocument)}
                        disabled={actionsDisabled}
                      >
                        Passcode link
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {actionsDisabled && (
            <div className="border-t p-4">
              <p className="text-sm text-muted-foreground">
                Actions are disabled until your sign-in is detected. If this persists, open{" "}
                <Link href="/signin" className="underline">/signin</Link>, sign in, then refresh this page.
              </p>
            </div>
          )}

          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create new folder</DialogTitle>
                <DialogDescription>
                  Organize your Vault into Personal or Business folders.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="vault-folder-name">Folder name</Label>
                  <Input
                    id="vault-folder-name"
                    ref={folderNameInputRef}
                    value={newFolderName}
                    onChange={(e) => {
                      setNewFolderName(e.target.value);
                      if (newFolderError) setNewFolderError(null);
                    }}
                    maxLength={VAULT_FOLDER_NAME_MAX}
                    placeholder="e.g. Contracts"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max {VAULT_FOLDER_NAME_MAX} characters.
                  </p>
                </div>
                {showFolderSuggestions && suggestedFolderNames.length > 0 && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      Suggested by Maestro
                    </div>
                    <div className="space-y-2">
                      {suggestedFolderNames.map((suggestion) => (
                        <div key={suggestion} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-foreground">{suggestion}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                applyFolderSuggestion(suggestion, false);
                                setShowFolderSuggestions(false);
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => applyFolderSuggestion(suggestion, true)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => setShowFolderSuggestions(false)}
                    >
                      Dismiss suggestions
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Root</Label>
                  <Select
                    value={newFolderRoot}
                    onValueChange={(value) => {
                      if (value === "personal" || value === "company") {
                        setNewFolderRoot(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose root" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="company">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parent (optional)</Label>
                  <Select
                    value={newFolderParentId ?? "none"}
                    onValueChange={(value) => {
                      setNewFolderParentId(value === "none" ? null : value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent</SelectItem>
                      {folderParentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newFolderError && (
                  <Alert variant="destructive">
                    <AlertDescription>{newFolderError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={onSubmitNewFolder}>Create folder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isMoveFolderDialogOpen} onOpenChange={(open) => !open && closeMoveFolderDialog()}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Move to folder</DialogTitle>
                <DialogDescription>
                  {moveFolderDocId
                    ? `Choose a folder for “${buildVaultTitle(
                      rows?.find((doc) => doc.id === moveFolderDocId)?.title ?? "this document",
                    )}”.`
                    : "Choose a folder for this document."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {hasFolders ? (
                  <div className="space-y-4 max-h-72 overflow-y-auto rounded-lg border bg-background/40 p-2">
                    {rootFolders.map((root) => {
                      const rootItems = folderTree.roots.get(root.root) ?? [];
                      return (
                        <div key={root.id} className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2">
                            {root.name}
                          </div>
                          {rootItems.length === 0 ? (
                            <div className="px-2 text-xs text-muted-foreground">No folders yet.</div>
                          ) : (
                            rootItems.map((folder) => {
                              const renderBranch = (node: VaultFolder, depth: number) => {
                                const children = folderTree.byParent.get(node.id) ?? [];
                                const isSelected = moveFolderTargetId === node.id;
                                return (
                                  <div key={node.id} className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => setMoveFolderTargetId(node.id)}
                                      className={cn(
                                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                        "hover:bg-muted/60",
                                        isSelected && "bg-muted font-medium",
                                      )}
                                      style={{ paddingLeft: 8 + depth * 14 }}
                                    >
                                      <span className="truncate">{node.name}</span>
                                    </button>
                                    {children.length > 0 && (
                                      <div className="space-y-1">
                                        {children.map((child) => renderBranch(child, depth + 1))}
                                      </div>
                                    )}
                                  </div>
                                );
                              };
                              return renderBranch(folder, 0);
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Create a folder first, then you can move files into it.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeMoveFolderDialog}>
                  Cancel
                </Button>
                <Button onClick={onConfirmMoveFolder} disabled={!moveFolderTargetId || !hasFolders}>
                  Move
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={renameFolderId !== null} onOpenChange={(open) => !open && setRenameFolderId(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Rename folder</DialogTitle>
                <DialogDescription>Update the name for this folder.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="vault-rename-folder-name">Folder name</Label>
                  <Input
                    id="vault-rename-folder-name"
                    value={renameFolderName}
                    onChange={(e) => {
                      setRenameFolderName(e.target.value);
                      if (renameFolderError) setRenameFolderError(null);
                    }}
                    maxLength={VAULT_FOLDER_NAME_MAX}
                    placeholder="e.g. Contracts"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max {VAULT_FOLDER_NAME_MAX} characters.
                  </p>
                </div>
                {renameFolderError && (
                  <Alert variant="destructive">
                    <AlertDescription>{renameFolderError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRenameFolderId(null)}>
                  Cancel
                </Button>
                <Button onClick={onSubmitRenameFolder}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={deleteFolderId !== null} onOpenChange={(open) => !open && setDeleteFolderId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete folder?</AlertDialogTitle>
                <AlertDialogDescription>
                  {(deleteFolderId &&
                    (folderTree.byParent.get(deleteFolderId) ?? []).length > 0) &&
                    "This folder has subfolders. Move or delete them first."}
                  {deleteFolderId &&
                    (folderTree.byParent.get(deleteFolderId) ?? []).length === 0 &&
                    "This action cannot be undone. Documents stay in Vault and can be re-filed later."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmDeleteFolder}
                  disabled={Boolean(
                    deleteFolderId && (folderTree.byParent.get(deleteFolderId) ?? []).length > 0,
                  )}
                >
                  Delete folder
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={handleUploadDialogChange}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload files to Vault</DialogTitle>
                <DialogDescription>
                  Upload text-based files ({VAULT_UPLOAD_ALLOWED_LABEL}). We’ll create a Vault document for each file.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choose files</label>
                  <Input
                    type="file"
                    accept={VAULT_UPLOAD_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
                    multiple
                    onChange={(e) => handleUploadSelection(e.target.files)}
                    disabled={uploadStatus === "uploading"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported types: {VAULT_UPLOAD_ALLOWED_LABEL}. Long filenames are truncated in the list.
                  </p>
                </div>

                {uploadHasIssues && (
                  <Alert>
                    <AlertTitle>Some files need attention</AlertTitle>
                    <AlertDescription>
                      {uploadUnsupportedCount > 0 && (
                        <p>
                          {uploadUnsupportedCount} unsupported file{uploadUnsupportedCount === 1 ? "" : "s"}.
                          Choose {VAULT_UPLOAD_ALLOWED_LABEL} files instead.
                        </p>
                      )}
                      {uploadDuplicateCount > 0 && (
                        <p>
                          {uploadDuplicateCount} duplicate file{uploadDuplicateCount === 1 ? "" : "s"}.
                          Rename the file or replace the existing Vault document.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {uploadHasFailures && uploadError && (
                  <Alert variant="destructive">
                    <AlertTitle>Upload failed</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>{uploadError}</p>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={retryFailedUploads}
                          disabled={uploadStatus === "uploading"}
                        >
                          Retry failed uploads
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {uploadItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Selected files
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-md border">
                      {uploadItems.map((item) => (
                        <div
                          key={`${item.file.name}-${item.file.size}-${item.file.lastModified}`}
                          className="flex items-start justify-between gap-3 border-b px-3 py-2 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[18rem]" title={item.file.name}>
                              {item.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[18rem]" title={item.title}>
                              Vault title: {item.title || "Untitled document"}
                            </p>
                            {item.message && (
                              <p className="text-xs text-muted-foreground">{item.message}</p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px] shrink-0",
                              item.status === "uploaded" && "border-emerald-500 text-emerald-700",
                              item.status === "error" && "border-destructive text-destructive",
                              (item.status === "unsupported" || item.status === "duplicate") &&
                              "border-amber-400 text-amber-700",
                            )}
                          >
                            {item.status === "ready" && "Ready"}
                            {item.status === "uploading" && "Uploading"}
                            {item.status === "uploaded" && "Uploaded"}
                            {item.status === "unsupported" && "Unsupported"}
                            {item.status === "duplicate" && "Duplicate"}
                            {item.status === "error" && "Failed"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadHasLongNames && (
                  <Alert>
                    <AlertTitle>Long filenames truncated</AlertTitle>
                    <AlertDescription>
                      We truncate long filenames in this list to avoid layout issues. The full name is still used for the Vault title.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleUploadDialogChange(false)}
                  disabled={uploadStatus === "uploading"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => startUpload()}
                  disabled={uploadStatus === "uploading" || uploadReadyCount === 0}
                >
                  {uploadStatus === "uploading"
                    ? "Uploading…"
                    : uploadReadyCount > 0
                      ? `Upload ${uploadReadyCount} file${uploadReadyCount === 1 ? "" : "s"}`
                      : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send for signature</DialogTitle>
                <DialogDescription>
                  Send this document to a recipient to collect an e-signature.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Recipient name</label>
                  <Input
                    value={signRecipientName}
                    onChange={(e) => setSignRecipientName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Recipient email</label>
                  <Input
                    type="email"
                    value={signRecipientEmail}
                    onChange={(e) => setSignRecipientEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isSendingForSignature) return;
                    setIsSignDialogOpen(false);
                  }}
                  disabled={isSendingForSignature}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => onConfirmSendForSignature(selectedDocument)}
                  disabled={
                    isSendingForSignature ||
                    !selectedDocument ||
                    !signRecipientEmail.trim()
                  }
                >
                  {isSendingForSignature ? "Sending…" : "Send"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <VaultPageInner />
    </Suspense>
  );
}
