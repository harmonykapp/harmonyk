"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type {
  AccountsPackResponse,
  InvestorAccountsSnapshotPack,
  SaaSExpensesPack,
} from "@/lib/accounts/packs";
import { analyzeItem } from "@/lib/ai/analyze";
import type { AnalyzeResult } from "@/lib/ai/schemas";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { handleApiError } from "@/lib/handle-api-error";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { logBuilderEvent } from "@/lib/telemetry/builder";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Brain,
  ChevronDown,
  ChevronRight,
  Eye,
  FileSignature,
  FileText,
  FolderOpen,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type TemplateOption = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  default_prompt?: string | null;
  canonical_type?: string | null;
  tags?: string[] | null;
  risk?: "low" | "medium" | "high" | null;
  jurisdiction?: string | null;
};

type MonoContextDoc = {
  id: string;
  title: string;
  kind?: string;
  source?: string;
  snippet?: string;
  score?: number;
  tags?: string[];
};

type MonoContextResponse = {
  docs: MonoContextDoc[];
};

type ClauseOption = {
  id: string;
  name: string;
  category?: string | null;
  body: string;
};

type DeckType = "fundraising" | "investor_update";

interface DeckTemplate {
  id: string;
  name: string;
  deck_type: DeckType;
  is_canonical: boolean;
  description: string | null;
  tags: string[];
  default_outline: unknown;
}

type DeckOutlineSection = {
  id: string;
  sectionKey: string;
  title: string;
  order: number;
  isRequired: boolean;
  enabled: boolean;
  defaultPrompt?: string | null;
  isCustom?: boolean; // True for user-added sections
};

type DeckCompanyInfo = {
  companyName: string;
  stage?: string;
  roundSize?: string;
  keyMetrics?: string;
};

type DeckGenerationSectionInput = {
  sectionKey: string;
  title: string;
  order: number;
};

type DeckGeneratedSection = {
  sectionKey: string;
  title: string;
  content: string;
};

type DeckGenerationResult = {
  sections: DeckGeneratedSection[];
};

type FinancialInboxRow = {
  id: string;
  [key: string]: unknown;
};

type FinancialInboxItem = {
  id: string;
  provider?: string | null;
  source_kind?: string | null;
  doc_type?: string | null;
  report_type?: string | null;
  vendor_name?: string | null;
  currency?: string | null;
  total_amount?: number | null;
  period_start?: string | null;
  period_end?: string | null;
  created_at?: string | null;
};

interface BuilderClientProps {
  templates: TemplateOption[];
  clauses: ClauseOption[];
  deckTemplates?: DeckTemplate[];
  initialDocId?: string;
  initialTab?: "contracts" | "decks" | "accounts";
}

// Map database categories to bolt design categories
function mapCategoryToBoltCategory(category: string | null | undefined): string {
  if (!category) return "Operational & HR";

  const cat = category.toLowerCase();

  // Explicit mapping for GA categories
  if (cat === "operational_hr") {
    return "Operational & HR";
  }
  if (cat === "corporate_finance") {
    return "Corporate & Finance";
  }
  if (cat === "commercial_dealmaking") {
    return "Commercial & Dealmaking";
  }

  // Fallback heuristics for legacy data
  if (
    cat.includes("contract") ||
    cat.includes("nda") ||
    cat.includes("employment") ||
    cat.includes("service") ||
    cat.includes("consulting") ||
    cat.includes("independent")
  ) {
    return "Operational & HR";
  }
  if (
    cat.includes("sales") ||
    cat.includes("purchase") ||
    cat.includes("partnership") ||
    cat.includes("joint") ||
    cat.includes("commercial") ||
    cat.includes("deal")
  ) {
    return "Commercial & Dealmaking";
  }
  if (cat.includes("corporate") || cat.includes("finance") || cat.includes("llc") || cat.includes("shareholder") || cat.includes("convertible") || cat.includes("safe")) {
    return "Corporate & Finance";
  }
  return "Operational & HR";
}

// Group templates by bolt category
function groupTemplatesByCategory(templates: TemplateOption[]) {
  const grouped: Record<string, TemplateOption[]> = {
    "Operational & HR": [],
    "Corporate & Finance": [],
    "Commercial & Dealmaking": [],
  };

  templates.forEach((template) => {
    const boltCategory = mapCategoryToBoltCategory(template.category);
    if (!grouped[boltCategory]) {
      grouped[boltCategory] = [];
    }
    grouped[boltCategory].push(template);
  });

  return Object.entries(grouped).filter(([_, items]) => items.length > 0);
}

export function BuilderClient({ templates, clauses, deckTemplates = [], initialDocId, initialTab }: BuilderClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const monoTrainingEnabled = isFeatureEnabled("FEATURE_VAULT_EXPERIMENTAL_ACTIONS");
  const safeTemplates = Array.isArray(templates) ? templates : [];
  const safeClauses = Array.isArray(clauses) ? clauses : [];
  const safeDeckTemplates = Array.isArray(deckTemplates) ? deckTemplates : [];

  const [activeBuilder, setActiveBuilder] = useState<"contracts" | "decks" | "accounts">(initialTab ?? "contracts");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>([]);
  const [selectedDeckTemplateId, setSelectedDeckTemplateId] = useState<string>("");
  const [deckOutlineSections, setDeckOutlineSections] = useState<DeckOutlineSection[]>([]);
  const [loadingDeckSections, setLoadingDeckSections] = useState(false);
  const [deckCompanyInfo, setDeckCompanyInfo] = useState<DeckCompanyInfo>({ companyName: "" });
  const [generatedDeckSections, setGeneratedDeckSections] = useState<DeckGeneratedSection[]>([]);
  const [editingDeckSectionContent, setEditingDeckSectionContent] = useState<Record<string, string>>({});
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [savedDeckDocumentId, setSavedDeckDocumentId] = useState<string | null>(null);
  const [accountsInbox, setAccountsInbox] = useState<FinancialInboxItem[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsSearch, setAccountsSearch] = useState("");
  const [accountsView, setAccountsView] = useState<"inbox" | "packs">("inbox");
  const [saasPackPreviewOpen, setSaasPackPreviewOpen] = useState(false);
  const [investorPackPreviewOpen, setInvestorPackPreviewOpen] = useState(false);
  const [saasPack, setSaasPack] = useState<SaaSExpensesPack | null>(null);
  const [saasPackLoading, setSaasPackLoading] = useState(false);
  const [saasPackError, setSaasPackError] = useState<string | null>(null);
  const [investorPack, setInvestorPack] = useState<InvestorAccountsSnapshotPack | null>(null);
  const [investorPackLoading, setInvestorPackLoading] = useState(false);
  const [investorPackError, setInvestorPackError] = useState<string | null>(null);

  // NEW: track whether we've already loaded the Accounts inbox to avoid refetch loops
  const accountsLoadedRef = useRef(false);

  const MIN_ENABLED_SECTIONS = 5;
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});
  const [instructions, setInstructions] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Analyze state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const analyzingRef = useRef(false);

  // Send for Signature modal state
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingQueuedForDocId, setTrainingQueuedForDocId] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  const [previewingMonoContext, setPreviewingMonoContext] = useState(false);

  const selectedTemplate = safeTemplates.find((t) => t.id === selectedTemplateId);

  const groupedTemplates = useMemo(() => {
    const filtered = searchQuery
      ? safeTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : safeTemplates;
    return groupTemplatesByCategory(filtered);
  }, [safeTemplates, searchQuery]);

  // Ensure each visible category has an open/closed state, defaulting to collapsed.
  useEffect(() => {
    setCategoryOpen((prev) => {
      const next: Record<string, boolean> = { ...prev };
      groupedTemplates.forEach(([category]) => {
        if (!(category in next)) {
          next[category] = false;
        }
      });
      return next;
    });
  }, [groupedTemplates]);

  // Load Financial Inbox rows once when switching into Accounts builder
  useEffect(() => {
    if (activeBuilder !== "accounts") {
      return;
    }

    // Only fetch once per visit to Accounts to avoid infinite re-fetch loops
    if (accountsLoadedRef.current) {
      return;
    }
    accountsLoadedRef.current = true;

    const loadFinancialInbox = async () => {
      setAccountsLoading(true);
      setAccountsError(null);

      try {
        const supabase = getBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("financial_documents")
          .select("*");

        if (error) {
          console.error("[accounts] Failed to load financial_documents", error);
          setAccountsError("Failed to load financial documents.");
          setAccountsInbox([]);
          return;
        }

        const rows = (data ?? []) as FinancialInboxRow[];

        const items: FinancialInboxItem[] = rows.map((row) => {
          const getString = (key: string): string | null => {
            const value = row[key];
            return typeof value === "string" ? value : null;
          };

          const getNumber = (key: string): number | null => {
            const value = row[key];
            return typeof value === "number" ? value : null;
          };

          return {
            id: row.id,
            provider: getString("provider"),
            source_kind: getString("source_kind"),
            doc_type: getString("doc_type"),
            report_type: getString("report_type"),
            vendor_name: getString("vendor_name"),
            currency: getString("currency"),
            total_amount: getNumber("total_amount"),
            period_start: getString("period_start"),
            period_end: getString("period_end"),
            created_at: getString("created_at"),
          };
        });

        setAccountsInbox(items);
      } catch (err) {
        console.error("[accounts] Unexpected error loading financial_documents", err);
        setAccountsError("Failed to load financial documents.");
        setAccountsInbox([]);
      } finally {
        setAccountsLoading(false);
      }
    };

    void loadFinancialInbox();
  }, [activeBuilder]);

  // Load deck sections when a template is selected
  // Option A: Switching templates resets outline state to the canonical sections for the newly selected template.
  useEffect(() => {
    if (!selectedDeckTemplateId) {
      setDeckOutlineSections([]);
      setLoadingDeckSections(false);
      return;
    }

    const loadDeckSections = async () => {
      setLoadingDeckSections(true);
      try {
        const supabase = getBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("deck_sections")
          .select("id, section_key, title, order_idx, is_required, default_prompt")
          .eq("template_id", selectedDeckTemplateId)
          .order("order_idx", { ascending: true });

        if (error) {
          console.error("Failed to load deck sections", error);
          toast({
            title: "Error",
            description: "Failed to load deck sections.",
            variant: "destructive",
          });
          setDeckOutlineSections([]);
        } else if (data) {
          // Map DB rows to DeckOutlineSection with all sections enabled by default
          const sections: DeckOutlineSection[] = data.map((row) => ({
            id: row.id,
            sectionKey: row.section_key,
            title: row.title,
            order: row.order_idx,
            isRequired: row.is_required ?? true,
            enabled: true,
            defaultPrompt: row.default_prompt ?? null,
            isCustom: false, // DB sections are not custom
          }));
          setDeckOutlineSections(sections);
        }
      } catch (err) {
        console.error("Unexpected error loading deck sections", err);
        setDeckOutlineSections([]);
      } finally {
        setLoadingDeckSections(false);
      }
    };

    loadDeckSections();
  }, [selectedDeckTemplateId, toast]);

  // Load deck document from Vault when initialDocId is provided
  useEffect(() => {
    if (!initialDocId || !safeDeckTemplates.length) return;

    const loadDeckDocument = async () => {
      try {
        const supabase = getBrowserSupabaseClient();

        // Load document
        const { data: doc, error: docError } = await supabase
          .from("document")
          .select("id, title, kind")
          .eq("id", initialDocId)
          .single();

        if (docError || !doc || doc.kind !== "deck") {
          console.warn("[builder] Failed to load deck document or not a deck", docError);
          return;
        }

        // Load latest version
        const { data: version, error: versionError } = await supabase
          .from("version")
          .select("content")
          .eq("document_id", initialDocId)
          .order("number", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (versionError || !version?.content) {
          console.warn("[builder] Failed to load deck version", versionError);
          return;
        }

        // Parse metadata from content
        const metadataMatch = version.content.match(/<!-- MONO_DECK_METADATA:({.*?}) -->/);
        if (!metadataMatch) {
          console.warn("[builder] No metadata found in deck document");
          return;
        }

        let metadata: {
          deck_type?: DeckType;
          company_name?: string;
          stage?: string;
          round_size?: string;
          outline_sections?: Array<{
            sectionKey: string;
            title: string;
            order: number;
            preview?: string;
          }>;
        };

        try {
          metadata = JSON.parse(metadataMatch[1]);
        } catch {
          console.warn("[builder] Failed to parse deck metadata");
          return;
        }

        if (!metadata.deck_type) return;

        // Find matching template
        const matchingTemplate = safeDeckTemplates.find(
          (t) => t.deck_type === metadata.deck_type
        );

        if (!matchingTemplate) {
          console.warn("[builder] No matching template found for deck type", metadata.deck_type);
          return;
        }

        // Set template and switch to decks tab
        setActiveBuilder("decks");
        setSelectedDeckTemplateId(matchingTemplate.id);

        // Set company info
        setDeckCompanyInfo({
          companyName: metadata.company_name || "",
          stage: metadata.stage,
          roundSize: metadata.round_size,
          keyMetrics: undefined, // Not stored in metadata
        });

        // Parse content into sections
        // Content format: <!-- metadata -->\n\n# Section Title\n\nContent\n\n...
        const contentWithoutMetadata = version.content.replace(/<!-- MONO_DECK_METADATA:.*? -->\s*\n*/s, "");
        const sectionBlocks = contentWithoutMetadata.split(/\n(?=# )/);

        const loadedSections: DeckGeneratedSection[] = [];
        const loadedContent: Record<string, string> = {};

        sectionBlocks.forEach((block: string) => {
          const lines = block.split("\n");
          const titleMatch = lines[0]?.match(/^# (.+)$/);
          if (!titleMatch) return;

          const sectionTitle = titleMatch[1].trim();
          const sectionContent = lines.slice(1).join("\n").trim();

          // Find section by title in metadata outline
          const outlineSection = metadata.outline_sections?.find(
            (s) => s.title === sectionTitle || s.sectionKey
          );

          if (outlineSection) {
            loadedSections.push({
              sectionKey: outlineSection.sectionKey,
              title: sectionTitle,
              content: sectionContent,
            });
            loadedContent[outlineSection.sectionKey] = sectionContent;
          }
        });

        setGeneratedDeckSections(loadedSections);
        setEditingDeckSectionContent(loadedContent);

        toast({
          title: "Deck loaded",
          description: "Deck content loaded from Vault.",
        });
      } catch (error) {
        console.error("[builder] Error loading deck document", error);
        toast({
          title: "Failed to load deck",
          description: "Could not load deck document from Vault.",
          variant: "destructive",
        });
      }
    };

    loadDeckDocument();
  }, [initialDocId, safeDeckTemplates]);

  const toggleClause = (id: string) => {
    setSelectedClauseIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError("Please select a template first.");
      return;
    }
    if (!instructions.trim()) {
      setError("Please add some instructions or context.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      logBuilderEvent("builder_generate", {
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        clauseCount: selectedClauseIds.length,
      });

      const includedClauses = safeClauses.filter((c) =>
        selectedClauseIds.includes(c.id)
      );

      const clauseText =
        includedClauses.length > 0
          ? includedClauses
            .map(
              (c, idx) =>
                `${idx + 1}. ${c.name}${c.category ? ` [${c.category}]` : ""
                }\n${c.body}`
            )
            .join("\n\n")
          : "No specific clauses selected. Use standard boilerplate where appropriate.";

      const stub = [
        `DRAFT VERSION 1 – ${selectedTemplate.name}`,
        "",
        "Scenario / instructions:",
        instructions.trim(),
        "",
        "Clauses to reflect:",
        clauseText,
        "",
        "In production, contract text is generated by Mono and the Contracts Builder, not this placeholder.",
      ].join("\n");

      setGeneratedContent(stub);
      setError(null);

      // Log doc_generated event (best-effort, don't block on failure)
      try {
        const currentUserId = (await getBrowserSupabaseClient().auth.getUser()).data.user?.id;
        if (currentUserId) {
          const response = await fetch("/api/activity/log-doc-generated", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": currentUserId,
            },
            body: JSON.stringify({
              templateId: selectedTemplate.id,
              contentLength: stub.length,
            }),
          });
          if (!response.ok) {
            // Silently fail - logging is best-effort
            const status = response.status;
            if (status === 401 || status === 403) {
              // Auth errors are logged but don't show toast for background logging
              console.warn("[builder] Auth error logging doc_generated event", { status });
            }
          }
        }
      } catch {
        // Ignore errors - logging is best-effort
      }
    } catch (err) {
      const errorMessage = (err as Error).message ?? "Failed to generate Version 1.";
      setError(errorMessage);
      logBuilderEvent("builder_generate_failed", {
        error: errorMessage,
      });

      const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "builder",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!selectedTemplate) {
      setError("Please select a template first.");
      return;
    }
    if (!generatedContent.trim()) {
      setError("Please generate Version 1 content first.");
      return;
    }

    setError(null);
    setSaving(true);

    // Get current user ID to pass to API for auth
    let currentUserId: string | null = null;
    try {
      const sb = getBrowserSupabaseClient();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        currentUserId = user.id;
      }
    } catch {
      // Ignore errors, will fall back to cookie-based auth
    }

    try {
      const title = documentTitle.trim() || `${selectedTemplate.name} — ${new Date().toISOString().slice(0, 10)}`;
      const content = generatedContent;

      const response = await fetch("/api/documents/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUserId && { "x-user-id": currentUserId }),
        },
        body: JSON.stringify({
          title,
          content,
          templateId: selectedTemplate.id,
        }),
      });

      let data: any = null;
      let rawBody: string | null = null;

      // Clone response before reading to preserve body for error handling
      const responseClone = response.clone();

      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, try to get raw body for debugging
        try {
          rawBody = await responseClone.text();
          console.warn("[builder] Save to Vault: failed to parse JSON response", {
            status: response.status,
            rawBodyPreview: rawBody.substring(0, 200),
          });
        } catch (textError) {
          console.warn("[builder] Save to Vault: failed to read response body", {
            jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError),
            textError: textError instanceof Error ? textError.message : String(textError),
          });
        }
      }

      if (!response.ok || !data?.ok) {
        const status = response.status;
        const baseMessage = data?.error ?? "Failed to save to Vault";
        const details = data?.details;

        let detailsSuffix = "";
        if (details) {
          const parts: string[] = [];
          if (details.code) parts.push(`code=${details.code}`);
          if (details.message) parts.push(details.message);
          if (parts.length) {
            detailsSuffix = ` (${parts.join(" - ")})`;
          }
        }

        const errorMessage = `${baseMessage}${detailsSuffix}`;

        // If we don't have rawBody yet, try to get it from the cloned response
        if (!rawBody) {
          try {
            rawBody = await responseClone.text();
          } catch {
            // ignore
          }
        }

        // Create error details with proper serialization
        const errorDetails: Record<string, unknown> = {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          details: details ?? null,
          data: data ?? null,
        };

        if (rawBody) {
          errorDetails.rawBody = rawBody;
        }

        // Log with JSON.stringify to ensure proper serialization
        console.error("[builder] Save to Vault error", JSON.stringify(errorDetails, null, 2));

        handleApiError({
          status,
          errorMessage,
          toast,
          context: "builder",
        });
        return;
      }

      setSavedDocumentId(data.documentId ?? null);
      toast({
        title: "Saved to Vault",
        description: "Document has been saved successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = {
        message: errorMessage,
        name: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      };
      console.error("[builder] Save to Vault unexpected error", errorDetails);

      const isAuthError = errorMessage.includes("Authentication required") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403");

      if (isAuthError) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      } else {
        const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "builder",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToDrafts = async () => {
    // Save to Drafts is the same as Save to Vault, but we can add a draft flag if needed
    // For now, it's the same operation
    await handleSaveToVault();
  };

  const handleAnalyze = async () => {
    if (!generatedContent.trim()) {
      setError("Please generate document content first.");
      return;
    }

    if (analyzingRef.current) {
      return;
    }

    setAnalyzeError(null);
    setAnalyzeResult(null);
    setAnalyzing(true);
    analyzingRef.current = true;

    try {
      const payload = {
        itemId: savedDocumentId || "builder-draft",
        title: documentTitle.trim() || selectedTemplate?.name || "Untitled Document",
        snippet: generatedContent.slice(0, 500) + (generatedContent.length > 500 ? "..." : ""),
        metadata: {
          source: "builder",
          kind: "text/plain",
          template: selectedTemplate?.name,
        },
      };
      const res = await analyzeItem(payload);
      setAnalyzeResult(res);
      toast({
        title: "Analyze complete",
        description: "Document analysis finished successfully.",
      });
    } catch (err) {
      const errorMessage = (err as Error).message ?? "Analyze failed";
      setAnalyzeError(errorMessage);

      const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "builder",
      });
    } finally {
      setAnalyzing(false);
      analyzingRef.current = false;
    }
  };

  const handleTrainWithMono = async () => {
    if (!monoTrainingEnabled) {
      toast({
        title: "Training disabled",
        description: "Mono training is not enabled in this environment.",
        variant: "destructive",
      });
      return;
    }

    if (!savedDocumentId) {
      toast({
        title: "Save to Vault first",
        description: "Save the document to Vault before training Mono on it.",
        variant: "destructive",
      });
      return;
    }

    setTrainingError(null);
    setTrainingLoading(true);

    try {
      const sb = getBrowserSupabaseClient();
      const { data, error } = await sb
        .from("document")
        .select("org_id")
        .eq("id", savedDocumentId)
        .maybeSingle();

      if (error || !data?.org_id) {
        const errorMessage =
          error?.message || "Could not determine organisation for this document.";
        console.error("[builder] Mono training: failed to resolve org", { error, data });
        setTrainingError(errorMessage);
        toast({
          title: "Training unavailable",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/mono/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: data.org_id,
          vaultDocumentId: savedDocumentId,
        }),
      });

      const text = await response.text();
      let payload: { job?: unknown; error?: string } = {};
      try {
        payload = text ? (JSON.parse(text) as typeof payload) : {};
      } catch {
        // ignore parse error; fall back to raw text
      }

      if (!response.ok || payload.error) {
        const errorMessage =
          payload.error ||
          text ||
          `Failed to queue training job (HTTP ${response.status})`;

        setTrainingError(errorMessage);
        handleApiError({
          status: response.status || 500,
          errorMessage,
          toast,
          context: "builder-mono-train",
        });
        return;
      }

      // Success: API returns {job: {...}} on success
      setTrainingQueuedForDocId(savedDocumentId);
      toast({
        title: "Training queued",
        description: "Mono will train on this document in the background.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setTrainingError(errorMessage);
      handleApiError({
        status: 500,
        errorMessage,
        toast,
        context: "builder-mono-train",
      });
    } finally {
      setTrainingLoading(false);
    }
  };

  const handlePreviewMonoContextDev = async () => {
    if (!monoTrainingEnabled) {
      toast({
        title: "Mono context disabled",
        description: "Mono dev context preview is not enabled in this environment.",
        variant: "destructive",
      });
      return;
    }

    if (!savedDocumentId) {
      toast({
        title: "Save to Vault first",
        description: "Save the document to Vault before previewing Mono context.",
        variant: "destructive",
      });
      return;
    }

    setPreviewingMonoContext(true);
    try {
      const sb = getBrowserSupabaseClient();
      const { data, error } = await sb
        .from("document")
        .select("org_id, title")
        .eq("id", savedDocumentId)
        .maybeSingle();

      if (error || !data?.org_id) {
        const errorMessage =
          error?.message || "Could not determine organisation for this document.";
        console.error("[builder] Mono context: failed to resolve org", { error, data });
        handleApiError({
          status: 500,
          errorMessage,
          toast,
          context: "builder-mono-context",
        });
        return;
      }

      const effectiveTitle =
        documentTitle.trim() ||
        data.title ||
        selectedTemplate?.name ||
        "Untitled document";

      const requestBody = {
        orgId: data.org_id as string,
        query: effectiveTitle.slice(0, 200),
        maxItems: 5,
      };

      const response = await fetch("/api/mono/context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      let payload: MonoContextResponse | { error?: string } = { docs: [] };

      try {
        payload = text
          ? (JSON.parse(text) as MonoContextResponse | { error?: string })
          : { docs: [] };
      } catch {
        payload = { error: text || "Failed to parse Mono context response" };
      }

      if (!response.ok || "error" in payload) {
        const errorMessage =
          "error" in payload && payload.error
            ? payload.error
            : `Failed to load Mono context (HTTP ${response.status})`;

        handleApiError({
          status: response.status || 500,
          errorMessage,
          toast,
          context: "builder-mono-context",
        });
        return;
      }

      const docs = (payload as MonoContextResponse).docs ?? [];

      try {
        console.groupCollapsed("[builder-mono-context] Preview Mono context (dev)");
        console.log("request", requestBody);
        console.log("docs", docs);
        console.groupEnd();
      } catch {
        // ignore console errors
      }

      toast({
        title: "Mono context loaded",
        description: docs.length
          ? `Found ${docs.length} matching internal docs for this organisation.`
          : "No internal docs matched this query yet.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error loading Mono context";

      handleApiError({
        status: 500,
        errorMessage,
        toast,
        context: "builder-mono-context",
      });
    } finally {
      setPreviewingMonoContext(false);
    }
  };

  const handleSendForSignature = async () => {
    if (!recipientEmail || !recipientName) {
      toast({
        title: "Missing information",
        description: "Please fill in recipient name and email",
        variant: "destructive",
      });
      return;
    }

    if (!savedDocumentId) {
      toast({
        title: "Document not saved",
        description: "Please save the document to Vault first before sending for signature.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const requestBody = {
        documentId: savedDocumentId,
        recipient: {
          email: recipientEmail,
          name: recipientName,
        },
      };

      console.log("[builder] Sending signature request", {
        documentId: savedDocumentId,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
      });

      const response = await fetch("/api/sign/documenso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("[builder] Received response", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
      });

      if (!response.ok) {
        const status: number = response.status || 500;
        const statusText: string = response.statusText || "No status text";
        let data: { ok?: boolean; error?: string; details?: string; envelopeId?: string } | null = null;
        let errorText: string = "";
        let parseError: unknown = null;

        try {
          const contentType = response.headers.get("content-type") || "";
          const clonedResponse = response.clone(); // Clone so we can read body multiple times if needed

          if (contentType.includes("application/json")) {
            try {
              data = await response.json();
            } catch (jsonError) {
              parseError = jsonError;
              // If JSON parse fails, try text
              try {
                errorText = await clonedResponse.text();
                console.error("[builder] Failed to parse JSON error response, trying text", {
                  jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError),
                  errorTextLength: errorText.length,
                });
              } catch (textError) {
                console.error("[builder] Failed to read response as both JSON and text", {
                  jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError),
                  textError: textError instanceof Error ? textError.message : String(textError),
                });
              }
            }
          } else {
            try {
              errorText = await response.text();
            } catch (textReadError) {
              parseError = textReadError;
              console.error("[builder] Failed to read text response", {
                error: textReadError instanceof Error ? textReadError.message : String(textReadError),
              });
            }
          }
        } catch (parseErr) {
          parseError = parseErr;
          const parseErrorMessage = parseErr instanceof Error ? parseErr.message : String(parseErr);
          console.error("[builder] Failed to parse error response", {
            error: parseErr,
            message: parseErrorMessage,
            status: response.status,
            statusText: response.statusText,
          });
          errorText = `Failed to parse error response: ${parseErrorMessage}`;
        }

        const errorMessage: string =
          (data?.error) ||
          (data?.details) ||
          (errorText) ||
          (response.statusText) ||
          `HTTP ${status}: Request failed`;

        // Ensure all values are actually set (defensive checks)
        const finalStatus: number = typeof status === "number" ? status : (response.status || 500);
        const finalStatusText: string = typeof statusText === "string" ? statusText : (response.statusText || "Unknown");
        const finalErrorMessage: string = typeof errorMessage === "string" && errorMessage ? errorMessage : "Unknown error occurred";

        // Always log error with guaranteed non-empty values
        const errorLog: Record<string, unknown> = {
          status: String(finalStatus),
          statusText: String(finalStatusText),
          errorMessage: String(finalErrorMessage),
        };

        if (data) {
          errorLog.hasResponseData = true;
          if (data.error) errorLog.responseError = String(data.error);
          if (data.details) errorLog.responseDetails = String(data.details);
          errorLog.responseData = data;
        } else {
          errorLog.hasResponseData = false;
        }

        if (errorText) {
          errorLog.errorText = errorText;
        }

        if (parseError) {
          errorLog.parseError = parseError instanceof Error ? parseError.message : String(parseError);
        }

        const contentType = response.headers.get("content-type");
        if (contentType) {
          errorLog.contentType = contentType;
        }

        // Log error - use string message to ensure visibility
        const errorDetailsStr = `Status: ${finalStatus}, StatusText: ${finalStatusText}, Error: ${finalErrorMessage}`;
        console.error("[builder] Send for signature API error -", errorDetailsStr);

        // Also log structured data
        const errorDetails = {
          status: finalStatus,
          statusText: finalStatusText,
          errorMessage: finalErrorMessage,
          hasResponseData: !!data,
          responseData: data,
        };
        try {
          console.error("[builder] Send for signature API error (structured):", JSON.stringify(errorDetails, null, 2));
        } catch (e) {
          console.error("[builder] Send for signature API error (structured, fallback):", errorDetailsStr);
        }

        // Provide a more actionable error message for common cases
        let userFacingMessage = finalErrorMessage;

        if (
          finalErrorMessage.includes("Save this document to Vault first") ||
          finalErrorMessage.includes("No file available for signature")
        ) {
          // Backend is telling us there is no signable file for this documentId.
          // In practice this usually means the Documenso route is not finding a file artifact
          // (or latest version fallback) for this Vault document – it is NOT a Google Drive issue.
          userFacingMessage =
            "Backend reports no signable file for this document. The document is saved in Vault, but the Documenso signature route still needs to be wired to a signable artifact. See docs/SIGNATURES_DOCUMENSO_TROUBLESHOOTING.md.";
        }

        handleApiError({
          status: finalStatus,
          errorMessage:
            userFacingMessage ||
            "Failed to send for signature. Please check your Documenso configuration.",
          toast,
          context: "builder",
        });
        return;
      }

      const data = (await response.json()) as { ok: boolean; error?: string; details?: string; envelopeId?: string };

      if (!data.ok) {
        const errorMessage = data.error || data.details || "Failed to send for signature";
        console.error("[builder] Send for signature returned ok: false", {
          error: data.error,
          details: data.details,
        });
        handleApiError({
          status: 500,
          errorMessage,
          toast,
          context: "builder",
        });
        return;
      }

      // Check if this is a dev stub response
      const isDevStub = data.envelopeId === "dev-stub-envelope-no-file";

      toast({
        title: isDevStub ? "Document sent for signature (dev stub)" : "Document sent for signature",
        description: isDevStub
          ? "Stub response: Signature request accepted in development mode. No actual envelope was created."
          : "Document has been sent successfully.",
        duration: isDevStub ? 8000 : 5000, // Longer duration for stub messages
      });

      console.log("[builder] Send for signature success", {
        envelopeId: data.envelopeId,
        isDevStub,
      });

      setSignModalOpen(false);
      setRecipientName("");
      setRecipientEmail("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : typeof error;
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error("[builder] Send for signature unexpected error", {
        message: errorMessage || "Unknown error occurred",
        name: errorName || "Unknown",
        stack: errorStack,
        error: error,
      });

      // Extract status from error if it's a fetch/network error
      let status = 500;
      if (errorMessage.includes("401") || errorMessage.toLowerCase().includes("unauthorized")) {
        status = 401;
      } else if (errorMessage.includes("403") || errorMessage.toLowerCase().includes("forbidden")) {
        status = 403;
      } else if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("fetch")) {
        status = 0; // Network error
      }

      handleApiError({
        status,
        errorMessage: errorMessage || "An unexpected error occurred while sending for signature. Please try again or check your Documenso configuration.",
        toast,
        context: "builder",
      });
    } finally {
      setSending(false);
    }
  };

  const renderContractsBuilder = () => {
    const quickStartNda = safeTemplates.find((t) => t.canonical_type === "nda_mutual");
    const quickStartMsa = safeTemplates.find((t) => t.canonical_type === "msa_services");
    const quickStartSow = safeTemplates.find((t) => t.canonical_type === "sow_general");

    return (
      <div className="h-full flex">
        {/* Left Sidebar - Templates */}
        <div className="w-80 border-r bg-sidebar overflow-auto">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Templates</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/activity")}
                  className="text-xs"
                >
                  View activity
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/builder/draft")}
                  className="text-xs"
                >
                  <FolderOpen className="h-3 w-3 mr-1" />
                  View Drafts
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-6">
              {groupedTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? "No templates found matching your search." : "No templates available."}
                </div>
              ) : (
                groupedTemplates.map(([category, categoryTemplates]) => {
                  const isOpen = categoryOpen[category] ?? false;
                  return (
                    <div key={category} className="space-y-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryOpen((prev) => ({
                            ...prev,
                            [category]: !(prev[category] ?? false),
                          }))
                        }
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-sidebar-active/40"
                      >
                        <span>{category}</span>
                        {isOpen ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="space-y-1">
                          {categoryTemplates.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => setSelectedTemplateId(template.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTemplateId === template.id
                                ? "bg-sidebar-active text-primary"
                                : "hover:bg-sidebar-active/50"
                                }`}
                            >
                              <div className="font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {template.description}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Builder Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedTemplate ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Start Building</h2>
                  <p className="text-muted-foreground mb-2">
                    Draft investor and operational contracts with AI. Start from a template or a prompt.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Select a template from the sidebar to begin creating your document.
                    Mono will help you draft, review, and refine the content.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-mono" />
                    <span>AI-assisted document generation</span>
                  </div>
                  {(quickStartNda || quickStartMsa || quickStartSow) && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Quick start with a common contract:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {quickStartNda && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTemplateId(quickStartNda.id);
                              setInstructions(
                                "Create a mutual NDA between my startup and a potential partner for early-stage discussions. 2-year term, mutual confidentiality, standard carve-outs.",
                              );
                            }}
                          >
                            Start NDA
                          </Button>
                        )}
                        {quickStartMsa && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTemplateId(quickStartMsa.id);
                              setInstructions(
                                "Create a standard MSA for ongoing SaaS and consulting services between my company and a B2B customer. Include scope of work via SOW, net 30 payment terms, and standard SLAs.",
                              );
                            }}
                          >
                            Start MSA
                          </Button>
                        )}
                        {quickStartSow && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTemplateId(quickStartSow.id);
                              setInstructions(
                                "Create a general Statement of Work describing a fixed-scope project for a B2B client. Include deliverables, milestones, acceptance criteria, and payment tied to milestones.",
                              );
                            }}
                          >
                            Start SOW
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header Bar */}
              <div className="border-b p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTemplateId("")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <Badge variant="outline">{selectedTemplate.name}</Badge>
                      <h1 className="text-2xl font-bold mt-2">New Document</h1>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push("/builder/draft")}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      View Drafts
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyze}
                      disabled={analyzing || !generatedContent.trim()}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      {analyzing ? "Analyzing..." : "Analyze"}
                    </Button>
                    {monoTrainingEnabled && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviewMonoContextDev}
                          disabled={previewingMonoContext || !savedDocumentId}
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          {previewingMonoContext
                            ? "Loading context…"
                            : "Preview Mono context (dev)"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTrainWithMono}
                          disabled={trainingLoading || !savedDocumentId}
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          {trainingLoading ? "Queueing…" : "Train Mono"}
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" disabled={!generatedContent.trim()}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveToDrafts}
                      disabled={saving || !generatedContent.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSignModalOpen(true)}
                      disabled={!generatedContent.trim() || !savedDocumentId}
                    >
                      <FileSignature className="h-4 w-4 mr-2" />
                      Send for Signature
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {error && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {savedDocumentId && (
                    <div className="rounded-md border border-green-500/40 bg-green-500/5 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                      ✓ Saved to Vault (document ID: {savedDocumentId})
                    </div>
                  )}

                  {monoTrainingEnabled && trainingQueuedForDocId === savedDocumentId && (
                    <div className="rounded-md border border-blue-500/40 bg-blue-500/5 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
                      Mono training job queued for this document.
                    </div>
                  )}

                  {monoTrainingEnabled && trainingError && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      {trainingError}
                    </div>
                  )}

                  {/* AI-Assisted Generation */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-mono" />
                            AI-Assisted Generation
                          </CardTitle>
                          <CardDescription>
                            Describe what you need and Mono will draft the document for you
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 text-mono" />
                          <span>Ask Mono about building</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Step 2: Clauses */}
                      {safeClauses.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Clauses (optional)</label>
                          <ScrollArea className="h-32 rounded-md border p-2 bg-muted/40">
                            <div className="space-y-1">
                              {safeClauses.map((c) => (
                                <label
                                  key={c.id}
                                  className="flex items-start gap-2 text-xs cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-0.5"
                                    checked={selectedClauseIds.includes(c.id)}
                                    onChange={() => toggleClause(c.id)}
                                  />
                                  <span>
                                    <span className="font-medium">{c.name}</span>
                                    {c.category && (
                                      <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                                        ({c.category})
                                      </span>
                                    )}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Step 3: Instructions */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Instructions / Scenario</label>
                        <Textarea
                          placeholder="Example: Create an NDA between Acme Corp and my company for a partnership discussion about cloud infrastructure. Standard terms, mutual confidentiality, 2 year duration."
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {loading ? "Generating..." : "Generate Document"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Document Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Content</CardTitle>
                      <CardDescription>
                        Edit and refine your document
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Document Title
                        </label>
                        <Input
                          placeholder="Enter document title..."
                          value={documentTitle}
                          onChange={(e) => setDocumentTitle(e.target.value)}
                        />
                      </div>

                      <Tabs defaultValue="editor" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="editor">Editor</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="editor" className="space-y-4">
                          <Textarea
                            className="w-full min-h-[400px] font-mono text-sm"
                            placeholder="Version 1 content will appear here after generation. You can edit it before saving."
                            value={generatedContent}
                            onChange={(e) => setGeneratedContent(e.target.value)}
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {savedDocumentId
                                ? "Saved to Vault. You can generate again to create a new version."
                                : "Edit the content above, then save to Vault."}
                            </p>
                            <Button
                              onClick={handleSaveToVault}
                              disabled={saving || !generatedContent.trim()}
                            >
                              {saving ? "Saving..." : "Save to Vault"}
                            </Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="preview">
                          <div className="border rounded-lg p-8 bg-background min-h-[400px]">
                            {generatedContent ? (
                              <div className="prose max-w-none whitespace-pre-wrap">
                                {generatedContent}
                              </div>
                            ) : (
                              <p className="text-muted-foreground italic text-center py-20">
                                Preview will appear here after generation...
                              </p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Analyze Results */}
                  {(analyzeResult || analyzeError) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-mono" />
                          Analysis Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyzeError && (
                          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive mb-4">
                            AI error: {analyzeError}
                          </div>
                        )}
                        {analyzeResult && (
                          <div className="space-y-4">
                            {analyzeResult.summary && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Summary</h4>
                                <p className="text-sm text-muted-foreground">{analyzeResult.summary}</p>
                              </div>
                            )}
                            {analyzeResult.entities && analyzeResult.entities.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Key Entities</h4>
                                <div className="flex flex-wrap gap-2">
                                  {analyzeResult.entities.map((entity, i) => (
                                    <Badge key={i} variant="secondary">
                                      {entity.label}: {entity.value}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {analyzeResult.dates && analyzeResult.dates.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Important Dates</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {analyzeResult.dates.map((date, i) => (
                                    <li key={i}>{date}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analyzeResult.nextAction && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Suggested Next Action</h4>
                                <p className="text-sm text-muted-foreground">{analyzeResult.nextAction}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  {generatedContent.trim() && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="justify-start">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Review & Tighten Language
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Add Missing Clauses
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Check for Legal Issues
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Simplify Complex Terms
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Send for Signature Modal */}
        <Dialog open={signModalOpen} onOpenChange={setSignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send for Signature</DialogTitle>
              <DialogDescription>
                Send this document to a recipient for electronic signature via Documenso
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  placeholder="John Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSignModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendForSignature} disabled={sending || !recipientName || !recipientEmail}>
                {sending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderDecksBuilder = () => {
    const selectedDeckTemplate = safeDeckTemplates.find((t) => t.id === selectedDeckTemplateId);

    const getDeckTypeLabel = (deckType: DeckType): string => {
      if (deckType === "fundraising") return "Fundraising Deck";
      if (deckType === "investor_update") return "Investor Update";
      return deckType;
    };

    // Get enabled sections count
    const enabledSectionsCount = deckOutlineSections.filter((s) => s.enabled).length;

    // Handle section toggle
    const handleToggleSection = (sectionId: string) => {
      const section = deckOutlineSections.find((s) => s.id === sectionId);
      if (!section) return;

      // If trying to disable, check minimum count
      if (section.enabled && enabledSectionsCount <= MIN_ENABLED_SECTIONS) {
        toast({
          title: "Minimum sections required",
          description: `You must have at least ${MIN_ENABLED_SECTIONS} enabled sections.`,
          variant: "destructive",
        });
        return;
      }

      setDeckOutlineSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s))
      );
    };

    // Handle section title change
    const handleSectionTitleChange = (sectionId: string, newTitle: string) => {
      setDeckOutlineSections((prev) => {
        // Get existing sectionKeys to ensure uniqueness when updating
        const existingKeys = new Set(prev.map((s) => s.sectionKey));

        return prev.map((s) => {
          if (s.id === sectionId) {
            const updated: DeckOutlineSection = { ...s, title: newTitle };
            // For custom sections, also update sectionKey based on title
            if (s.isCustom) {
              // Temporarily remove current key from set to allow reuse if title unchanged
              existingKeys.delete(s.sectionKey);
              updated.sectionKey = generateSectionKey(newTitle, existingKeys);
            }
            return updated;
          }
          return s;
        });
      });
    };

    // Handle section reorder (move up)
    const handleMoveUp = (sectionId: string) => {
      setDeckOutlineSections((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const currentIndex = sorted.findIndex((s) => s.id === sectionId);
        if (currentIndex <= 0) return prev;

        // Create new array with swapped order values
        const newSections = sorted.map((section, index) => {
          if (index === currentIndex) {
            // Current section gets the previous section's order
            return { ...section, order: sorted[currentIndex - 1].order };
          }
          if (index === currentIndex - 1) {
            // Previous section gets the current section's order
            return { ...section, order: sorted[currentIndex].order };
          }
          return section;
        });

        return newSections;
      });
    };

    // Handle section reorder (move down)
    const handleMoveDown = (sectionId: string) => {
      setDeckOutlineSections((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const currentIndex = sorted.findIndex((s) => s.id === sectionId);
        if (currentIndex < 0 || currentIndex >= sorted.length - 1) return prev;

        // Create new array with swapped order values
        const newSections = sorted.map((section, index) => {
          if (index === currentIndex) {
            // Current section gets the next section's order
            return { ...section, order: sorted[currentIndex + 1].order };
          }
          if (index === currentIndex + 1) {
            // Next section gets the current section's order
            return { ...section, order: sorted[currentIndex].order };
          }
          return section;
        });

        return newSections;
      });
    };

    // Generate a slug-like sectionKey from title
    const generateSectionKey = (title: string, existingKeys: Set<string>): string => {
      let base = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "custom_section";

      // Ensure uniqueness by appending a counter if needed
      let key = base;
      let counter = 1;
      while (existingKeys.has(key)) {
        key = `${base}_${counter}`;
        counter += 1;
      }
      return key;
    };

    // Handle add custom section
    const handleAddCustomSection = () => {
      const sorted = [...deckOutlineSections].sort((a, b) => a.order - b.order);
      const maxOrder = sorted.length > 0 ? Math.max(...sorted.map((s) => s.order)) : 0;
      const newOrder = maxOrder + 1;

      // Get existing sectionKeys to ensure uniqueness
      const existingKeys = new Set(deckOutlineSections.map((s) => s.sectionKey));
      const newSectionKey = generateSectionKey("New Section", existingKeys);

      const newSection: DeckOutlineSection = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        sectionKey: newSectionKey,
        title: "New Section",
        order: newOrder,
        isRequired: false,
        enabled: true,
        defaultPrompt: null,
        isCustom: true,
      };

      setDeckOutlineSections((prev) => [...prev, newSection]);

      // Auto-focus the title input after adding
      setTimeout(() => {
        const titleInput = document.querySelector(
          `input[data-section-id="${newSection.id}"]`
        ) as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      }, 100);
    };

    // Handle delete custom section
    const handleDeleteCustomSection = (sectionId: string) => {
      const section = deckOutlineSections.find((s) => s.id === sectionId);
      if (!section) return;

      // Don't allow deleting if it would drop below minimum
      if (section.enabled && enabledSectionsCount <= MIN_ENABLED_SECTIONS) {
        toast({
          title: "Cannot delete section",
          description: `You must have at least ${MIN_ENABLED_SECTIONS} enabled sections. Disable this section first if you want to remove it.`,
          variant: "destructive",
        });
        return;
      }

      setDeckOutlineSections((prev) => prev.filter((s) => s.id !== sectionId));

      // Also remove from generated content if present
      if (section.isCustom) {
        setEditingDeckSectionContent((prev) => {
          const updated = { ...prev };
          delete updated[section.sectionKey];
          return updated;
        });
        setGeneratedDeckSections((prev) => prev.filter((s) => s.sectionKey !== section.sectionKey));
      }
    };


    // Handle generate deck
    const handleGenerateDeck = async () => {
      if (!selectedDeckTemplate) {
        toast({
          title: "Error",
          description: "Please select a template first.",
          variant: "destructive",
        });
        return;
      }

      if (loadingDeckSections || deckOutlineSections.length === 0) {
        return;
      }

      if (enabledSectionsCount < MIN_ENABLED_SECTIONS) {
        toast({
          title: "Minimum sections required",
          description: `You must have at least ${MIN_ENABLED_SECTIONS} enabled sections.`,
          variant: "destructive",
        });
        return;
      }

      if (!deckCompanyInfo.companyName.trim()) {
        toast({
          title: "Company name required",
          description: "Please enter a company name to generate the deck.",
          variant: "destructive",
        });
        return;
      }

      setIsGeneratingDeck(true);

      try {
        // Build outline with only enabled sections, sorted by order
        const outline: DeckGenerationSectionInput[] = deckOutlineSections
          .filter((s) => s.enabled)
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            sectionKey: s.sectionKey,
            title: s.title,
            order: s.order,
          }));

        const request: {
          deckType: DeckType;
          outline: DeckGenerationSectionInput[];
          companyInfo: DeckCompanyInfo;
        } = {
          deckType: selectedDeckTemplate.deck_type,
          outline,
          companyInfo: deckCompanyInfo,
        };

        const response = await fetch("/api/ai/generate-deck", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = (await response.json()) as DeckGenerationResult;

        // Store generated sections
        setGeneratedDeckSections(result.sections);

        // Initialize editing state with generated content
        const contentMap: Record<string, string> = {};
        result.sections.forEach((section) => {
          contentMap[section.sectionKey] = section.content;
        });
        setEditingDeckSectionContent(contentMap);

        toast({
          title: "Deck generated",
          description: "Review and edit the generated content below.",
        });

        // Log telemetry (fire-and-forget)
        try {
          logBuilderEvent("deck_generated", {
            deck_type: selectedDeckTemplate.deck_type,
            section_count: result.sections.length,
            content_length: result.sections.reduce((sum, s) => sum + s.content.length, 0),
            has_key_metrics: !!deckCompanyInfo.keyMetrics?.trim(),
          });
        } catch {
          // Ignore telemetry errors
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Deck generation failed";
        console.error("[builder] Deck generation error", error);
        toast({
          title: "Generation failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsGeneratingDeck(false);
      }
    };

    // Build deck narrative for saving (combines all enabled sections)
    const buildDeckNarrative = (): string => {
      const enabledSections = deckOutlineSections
        .filter((s) => s.enabled)
        .sort((a, b) => a.order - b.order);

      const sections: string[] = [];
      enabledSections.forEach((section) => {
        const content = editingDeckSectionContent[section.sectionKey] ??
          generatedDeckSections.find((gs) => gs.sectionKey === section.sectionKey)?.content ?? "";
        sections.push(`# ${section.title}\n\n${content}\n\n`);
      });

      return sections.join("");
    };

    // Build structured deck metadata for saving
    const buildDeckMetadata = (): {
      doc_type: "deck";
      deck_type: DeckType;
      company_name: string;
      stage?: string;
      round_size?: string;
      has_key_metrics: boolean;
      outline_sections: Array<{
        sectionKey: string;
        title: string;
        order: number;
        preview?: string;
      }>;
    } => {
      const enabledSections = deckOutlineSections
        .filter((s) => s.enabled)
        .sort((a, b) => a.order - b.order);

      return {
        doc_type: "deck",
        deck_type: selectedDeckTemplate?.deck_type ?? "fundraising",
        company_name: deckCompanyInfo.companyName,
        stage: deckCompanyInfo.stage || undefined,
        round_size: deckCompanyInfo.roundSize || undefined,
        has_key_metrics: !!deckCompanyInfo.keyMetrics?.trim(),
        outline_sections: enabledSections.map((s) => {
          const content = editingDeckSectionContent[s.sectionKey] ??
            generatedDeckSections.find((gs) => gs.sectionKey === s.sectionKey)?.content ?? "";
          return {
            sectionKey: s.sectionKey,
            title: s.title,
            order: s.order,
            preview: content.substring(0, 200), // First 200 chars as preview
          };
        }),
      };
    };

    // Handle save deck to Vault
    const handleSaveDeckToVault = async () => {
      if (!selectedDeckTemplate) {
        toast({
          title: "Error",
          description: "Please select a template first.",
          variant: "destructive",
        });
        return;
      }

      if (generatedDeckSections.length === 0) {
        toast({
          title: "No content to save",
          description: "Generate a draft with Mono before saving to Vault.",
          variant: "destructive",
        });
        return;
      }

      if (!deckCompanyInfo.companyName.trim()) {
        toast({
          title: "Company name required",
          description: "Please enter a company name to save the deck.",
          variant: "destructive",
        });
        return;
      }

      setIsSavingDeck(true);

      // Get current user ID to pass to API for auth
      let currentUserId: string | null = null;
      try {
        const sb = getBrowserSupabaseClient();
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          currentUserId = user.id;
        }
      } catch {
        // Ignore errors, will fall back to cookie-based auth
      }

      try {
        const deckTypeLabel = selectedDeckTemplate.deck_type === "fundraising"
          ? "Fundraising Deck"
          : "Investor Update Deck";
        const title = `${deckCompanyInfo.companyName} — ${deckTypeLabel}`;

        const narrative = buildDeckNarrative();
        const metadata = buildDeckMetadata();

        // Store metadata as JSON at the top of the content (for later parsing)
        const contentWithMetadata = `<!-- MONO_DECK_METADATA:${JSON.stringify(metadata)} -->\n\n${narrative}`;

        const response = await fetch("/api/documents/versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(currentUserId && { "x-user-id": currentUserId }),
          },
          body: JSON.stringify({
            title,
            content: contentWithMetadata,
            kind: "deck",
            metadata,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string; details?: unknown };
          const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;

          // Handle auth errors specifically
          if (response.status === 401 || response.status === 403 || errorMessage.includes("Authentication required")) {
            toast({
              title: "Session expired",
              description: "Please sign in again to continue.",
              variant: "destructive",
            });
            throw new Error(errorMessage);
          }

          throw new Error(errorMessage);
        }

        const result = (await response.json()) as { ok: boolean; documentId: string; message?: string };

        if (result.ok && result.documentId) {
          setSavedDeckDocumentId(result.documentId);
          toast({
            title: "Deck saved to Vault",
            description: `Saved as "${title}"`,
          });

          // Log telemetry (fire-and-forget)
          try {
            logBuilderEvent("deck_saved", {
              deck_type: selectedDeckTemplate.deck_type,
              section_count: metadata.outline_sections.length,
              content_length: narrative.length,
              has_key_metrics: metadata.has_key_metrics,
            });
          } catch {
            // Ignore telemetry errors
          }
        } else {
          throw new Error("Failed to save deck");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Deck save failed";
        console.error("[builder] Deck save error", error);

        const isAuthError = errorMessage.includes("Authentication required") ||
          errorMessage.includes("401") ||
          errorMessage.includes("403");

        if (!isAuthError) {
          // Only show toast if we haven't already shown one for auth errors
          toast({
            title: "Save failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setIsSavingDeck(false);
      }
    };

    return (
      <div className="h-full flex">
        {/* Left Sidebar - Deck Templates */}
        <div className="w-80 border-r bg-sidebar overflow-auto">
          <div className="p-4 border-b space-y-3">
            <h2 className="font-semibold">Deck Templates</h2>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-2">
              {safeDeckTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No deck templates available.
                </div>
              ) : (
                safeDeckTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedDeckTemplateId(template.id)}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors border ${selectedDeckTemplateId === template.id
                      ? "bg-sidebar-active text-primary border-primary/50"
                      : "hover:bg-sidebar-active/50 border-transparent"
                      }`}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getDeckTypeLabel(template.deck_type)}
                    </div>
                    {template.description && (
                      <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {template.description}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedDeckTemplate ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Decks Builder</h2>
                  <p className="text-muted-foreground mb-2">
                    Build fundraising decks and investor updates in minutes.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Select a template from the sidebar to get started. Mono will help you generate content for each section.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-mono" />
                    <span>AI-assisted deck generation</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedDeckTemplate.name}</CardTitle>
                        <CardDescription>
                          {getDeckTypeLabel(selectedDeckTemplate.deck_type)}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDeckTemplateId("")}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedDeckTemplate.description && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedDeckTemplate.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Outline Editor */}
                {loadingDeckSections ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-muted-foreground">
                        Loading sections...
                      </div>
                    </CardContent>
                  </Card>
                ) : deckOutlineSections.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Deck Outline</CardTitle>
                          <CardDescription>
                            This outline drives the slides Mono will generate. You can rename, disable, or reorder sections.
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomSection}
                          disabled={loadingDeckSections}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Section
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {deckOutlineSections
                        .sort((a, b) => a.order - b.order)
                        .map((section, index) => {
                          const canMoveUp = index > 0;
                          const canMoveDown = index < deckOutlineSections.length - 1;
                          const isCustom = section.isCustom ?? false;

                          return (
                            <div
                              key={section.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${section.enabled ? "bg-background" : "bg-muted/30 opacity-60"
                                } ${isCustom ? "border-primary/30 bg-primary/5" : ""}`}
                            >
                              <div className="pt-1">
                                <input
                                  type="checkbox"
                                  checked={section.enabled}
                                  onChange={() => handleToggleSection(section.id)}
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    data-section-id={section.id}
                                    value={section.title}
                                    onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                                    className="flex-1"
                                    disabled={!section.enabled}
                                    placeholder="Section title"
                                  />
                                  <div className="flex gap-1">
                                    {isCustom && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteCustomSection(section.id)}
                                        disabled={section.enabled && enabledSectionsCount <= MIN_ENABLED_SECTIONS}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        title="Delete custom section"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMoveUp(section.id)}
                                      disabled={!canMoveUp}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMoveDown(section.id)}
                                      disabled={!canMoveDown}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {section.defaultPrompt && (
                                  <p className="text-xs text-muted-foreground">
                                    {section.defaultPrompt}
                                  </p>
                                )}
                                {isCustom && (
                                  <p className="text-xs text-muted-foreground italic">
                                    Custom section
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </CardContent>
                  </Card>
                ) : null}

                {/* Company Info Form */}
                {selectedDeckTemplate && deckOutlineSections.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Company & Round Info</CardTitle>
                      <CardDescription>
                        Provide company information to help Mono generate relevant content.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          value={deckCompanyInfo.companyName}
                          onChange={(e) =>
                            setDeckCompanyInfo((prev) => ({ ...prev, companyName: e.target.value }))
                          }
                          placeholder="Acme Corp"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stage">Stage</Label>
                        <Input
                          id="stage"
                          value={deckCompanyInfo.stage || ""}
                          onChange={(e) =>
                            setDeckCompanyInfo((prev) => ({ ...prev, stage: e.target.value }))
                          }
                          placeholder="Pre-Seed, Seed, Series A, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roundSize">Round Size</Label>
                        <Input
                          id="roundSize"
                          value={deckCompanyInfo.roundSize || ""}
                          onChange={(e) =>
                            setDeckCompanyInfo((prev) => ({ ...prev, roundSize: e.target.value }))
                          }
                          placeholder="$500k SAFE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="keyMetrics">Key Metrics</Label>
                        <Textarea
                          id="keyMetrics"
                          value={deckCompanyInfo.keyMetrics || ""}
                          onChange={(e) =>
                            setDeckCompanyInfo((prev) => ({ ...prev, keyMetrics: e.target.value }))
                          }
                          placeholder="Revenue, growth, customers, partnerships, milestones..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generate Button */}
                {selectedDeckTemplate && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Mono will generate slide content from this outline and your company info in one pass. Make sure you have at least{" "}
                          {MIN_ENABLED_SECTIONS} sections enabled and a company name entered.
                        </div>
                        <Button
                          onClick={handleGenerateDeck}
                          disabled={
                            !selectedDeckTemplate ||
                            loadingDeckSections ||
                            enabledSectionsCount < MIN_ENABLED_SECTIONS ||
                            deckOutlineSections.length === 0 ||
                            !deckCompanyInfo.companyName.trim() ||
                            isGeneratingDeck
                          }
                          className="w-full"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isGeneratingDeck ? "Generating..." : "Generate Deck with Mono"}
                        </Button>
                        {enabledSectionsCount < MIN_ENABLED_SECTIONS && deckOutlineSections.length > 0 && (
                          <p className="text-xs text-destructive">
                            Please enable at least {MIN_ENABLED_SECTIONS} sections to generate a deck.
                          </p>
                        )}
                        {!deckCompanyInfo.companyName.trim() && (
                          <p className="text-xs text-destructive">
                            Please enter a company name to generate the deck.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Review Draft */}
                {generatedDeckSections.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Draft</CardTitle>
                      <CardDescription>
                        Review and edit the generated content for each section. Your edits will be saved when you save to Vault.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {deckOutlineSections
                        .filter((s) => s.enabled)
                        .sort((a, b) => a.order - b.order)
                        .map((section) => {
                          const generatedSection = generatedDeckSections.find(
                            (gs) => gs.sectionKey === section.sectionKey
                          );
                          const content = editingDeckSectionContent[section.sectionKey] ?? generatedSection?.content ?? "";

                          return (
                            <div key={section.id} className="space-y-2">
                              <Label className="text-base font-medium">{section.title}</Label>
                              <Textarea
                                value={content}
                                onChange={(e) =>
                                  setEditingDeckSectionContent((prev) => ({
                                    ...prev,
                                    [section.sectionKey]: e.target.value,
                                  }))
                                }
                                className="min-h-[150px] font-mono text-sm"
                                placeholder="Add your talking points for this section..."
                              />
                            </div>
                          );
                        })}

                      <div className="border-t pt-6 space-y-4">
                        <Button
                          onClick={handleSaveDeckToVault}
                          disabled={
                            isSavingDeck ||
                            generatedDeckSections.length === 0 ||
                            !selectedDeckTemplate ||
                            !deckCompanyInfo.companyName.trim()
                          }
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isSavingDeck ? "Saving..." : "Save Deck to Vault"}
                        </Button>
                        {generatedDeckSections.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center">
                            Generate a draft with Mono before saving to Vault.
                          </p>
                        )}
                        {!deckCompanyInfo.companyName.trim() && (
                          <p className="text-xs text-muted-foreground text-center">
                            Please enter a company name to save the deck.
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          {savedDeckDocumentId && (
                            <>
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const exportUrl = `/api/decks/${savedDeckDocumentId}/export`;
                                    toast({
                                      title: "Exporting deck",
                                      description: "Generating export...",
                                    });

                                    // Get current user ID to pass to API for auth
                                    let currentUserId: string | null = null;
                                    try {
                                      const sb = getBrowserSupabaseClient();
                                      const { data: { user } } = await sb.auth.getUser();
                                      if (user) {
                                        currentUserId = user.id;
                                      }
                                    } catch {
                                      // Ignore errors, will fall back to cookie-based auth
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
                                        deck_type: selectedDeckTemplate?.deck_type ?? "unknown",
                                        doc_id: savedDeckDocumentId,
                                        source: "builder",
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
                                className="flex-1"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Export Deck
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => router.push(`/vault`)}
                                className="h-auto p-0"
                              >
                                View in Vault →
                              </Button>
                            </>
                          )}
                          {!savedDeckDocumentId && (
                            <p className="text-xs text-muted-foreground text-center w-full">
                              Save to Vault first to export.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAccountsBuilder = () => {
    const runPack = async (
      type: "saas_monthly_expenses" | "investor_accounts_snapshot",
    ) => {
      const isSaas = type === "saas_monthly_expenses";
      const setLoading = isSaas ? setSaasPackLoading : setInvestorPackLoading;
      const setError = isSaas ? setSaasPackError : setInvestorPackError;

      setError(null);
      setLoading(true);

      try {
        const sb = getBrowserSupabaseClient();
        const { data: { user } } = await sb.auth.getUser();
        const userId = user?.id;

        const response = await fetch("/api/accounts/packs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(userId && { "x-user-id": userId }),
          },
          body: JSON.stringify({ type }),
        });

        const json = (await response.json().catch(() => null)) as
          | { ok?: boolean; error?: string; pack?: AccountsPackResponse }
          | null;

        if (!response.ok || !json?.ok) {
          const status = response.status || 500;
          const base = json?.error || "Failed to generate accounts pack";
          const message =
            status === 401 || status === 403
              ? "Authentication required"
              : `${base} (HTTP ${status})`;

          const err = new Error(message) as Error & { status?: number };
          err.status = status;
          throw err;
        }

        if (isSaas) {
          setSaasPack((json.pack ?? null) as SaaSExpensesPack | null);
        } else {
          setInvestorPack((json.pack ?? null) as InvestorAccountsSnapshotPack | null);
        }

        toast({
          title: isSaas
            ? "SaaS expenses pack generated"
            : "Investor snapshot generated",
          description: "Pack built from current financial documents.",
        });
      } catch (err) {
        const error = err as Error & { status?: number };
        const message =
          error?.message || "Failed to generate accounts pack";
        const status =
          typeof error?.status === "number"
            ? error.status
            : message.includes("401")
              ? 401
              : message.includes("403")
                ? 403
                : 500;

        setError(message);
        console.error("[accounts] pack generation failed", {
          message,
          status,
        });

        handleApiError({
          status,
          errorMessage: message,
          toast,
          context: "accounts-packs",
        });
      } finally {
        setLoading(false);
      }
    };

    const normalizedSearch = accountsSearch.trim().toLowerCase();

    const visibleItems = normalizedSearch
      ? accountsInbox.filter((item) => {
        const parts: string[] = [];
        if (item.vendor_name) {
          parts.push(item.vendor_name);
        }
        if (item.provider) {
          parts.push(item.provider);
        }
        if (item.doc_type) {
          parts.push(item.doc_type);
        }
        if (item.report_type) {
          parts.push(item.report_type);
        }
        const haystack = parts.join(" ").toLowerCase();
        if (!haystack) {
          return false;
        }
        return haystack.includes(normalizedSearch);
      })
      : accountsInbox;

    const formatAmount = (
      amount: number | null | undefined,
      currency: string | null | undefined,
    ): string => {
      if (amount == null || Number.isNaN(amount)) {
        return "";
      }
      const rounded = Math.round(amount);
      const formatted = rounded.toLocaleString();
      return currency ? `${currency} ${formatted}` : formatted;
    };

    const formatDate = (value: string | null | undefined): string | null => {
      if (!value) {
        return null;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleDateString();
    };

    const formatDateRange = (
      start: string | null | undefined,
      end: string | null | undefined,
    ): string | null => {
      const startLabel = formatDate(start);
      const endLabel = formatDate(end);

      if (startLabel && endLabel) {
        return `${startLabel} \u2192 ${endLabel}`;
      }
      return startLabel ?? endLabel ?? null;
    };

    const isInboxView = accountsView === "inbox";

    return (
      <div className="h-full flex">
        {/* Left Sidebar - Summary / Filters */}
        <div className="w-80 border-r bg-sidebar overflow-auto">
          <div className="p-4 border-b space-y-3">
            <h2 className="font-semibold">Financial Inbox</h2>
            <p className="text-xs text-muted-foreground">
              Normalized view of SaaS bills, bank reports, and accountant packs from your connected accounts.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vendor, provider, type..."
                value={accountsSearch}
                onChange={(e) => setAccountsSearch(e.target.value)}
                className="pl-9"
                disabled={!isInboxView}
              />
            </div>
          </div>
          <div className="p-4 space-y-2 text-xs text-muted-foreground">
            <p>
              This v1 inbox is read-only. Week 14–15 will wire this into the Accounts Builder packs:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Monthly SaaS Expenses Pack</li>
              <li>Investor Accounts Snapshot</li>
            </ul>
          </div>
        </div>

        {/* Right Panel - Inbox / Packs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">
                  {isInboxView ? "Financial Inbox" : "Accounts Packs"}
                </h1>
                {isInboxView ? (
                  <p className="text-xs text-muted-foreground">
                    Preview of classified financial documents from your connectors. No write actions yet.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Packs turn raw financial docs into investor-ready summaries. v1 runs live packs with read-only results.
                  </p>
                )}
              </div>
              <div className="inline-flex items-center rounded-full border bg-muted/40 p-1 text-xs">
                <Button
                  size="sm"
                  variant={isInboxView ? "default" : "ghost"}
                  className="rounded-full px-3"
                  onClick={() => setAccountsView("inbox")}
                >
                  Inbox
                </Button>
                <Button
                  size="sm"
                  variant={!isInboxView ? "default" : "ghost"}
                  className="rounded-full px-3"
                  onClick={() => setAccountsView("packs")}
                >
                  Packs
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {isInboxView ? (
              <>
                {accountsError && (
                  <div className="max-w-2xl mx-auto mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {accountsError}
                  </div>
                )}

                {accountsLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Loading financial documents...
                  </div>
                ) : visibleItems.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="max-w-lg text-center space-y-4">
                      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold mb-2">No financial documents yet</h2>
                        <p className="text-muted-foreground text-sm mb-2">
                          Pull out founder-friendly financial insights from your raw numbers.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Upload a spreadsheet or connect a source, then run a pack to see insights.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-2">
                    {visibleItems.map((item) => {
                      const amountLabel = formatAmount(item.total_amount ?? null, item.currency ?? null);
                      const periodLabel = formatDateRange(item.period_start ?? null, item.period_end ?? null);

                      const typeParts: string[] = [];
                      if (item.doc_type) {
                        typeParts.push(item.doc_type);
                      }
                      if (item.report_type) {
                        typeParts.push(item.report_type);
                      }
                      if (item.source_kind) {
                        typeParts.push(item.source_kind);
                      }
                      const typeLabel = typeParts.length > 0 ? typeParts.join(" \u2022 ") : "Unclassified financial doc";

                      const createdLabel = formatDate(item.created_at ?? null);

                      return (
                        <Card key={item.id}>
                          <CardContent className="flex items-center justify-between gap-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {item.vendor_name || item.provider || "Unlabeled document"}
                                  </span>
                                  {item.provider && (
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                      {item.provider}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {typeLabel}
                                </div>
                                {createdLabel && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    Ingested {createdLabel}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              {amountLabel && (
                                <div className="font-semibold text-sm">
                                  {amountLabel}
                                </div>
                              )}
                              {periodLabel && (
                                <div className="text-muted-foreground mt-1">
                                  {periodLabel}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="space-y-2 mb-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Pull out founder-friendly financial insights from your raw numbers.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Accounts Packs bundle your classified financial docs into investor-ready summaries and snapshots.
                    v1 is read-only (no exports yet) but uses the live <code>financial_documents</code> and accounts tables underneath.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly SaaS Expenses Pack</CardTitle>
                    <CardDescription>
                      Summarize SaaS spend for a given month: top vendors, total, and MoM change for your finance review.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Input: month or date range, optional vendor filters.</p>
                      <p>Output: short summary, table of vendors, and quick commentary on changes.</p>
                      {saasPack && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          Last run available below — open to inspect the raw payload.
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setSaasPackPreviewOpen(true);
                        await runPack("saas_monthly_expenses");
                      }}
                      disabled={saasPackLoading}
                    >
                      {saasPackLoading
                        ? "Generating..."
                        : saasPack
                          ? "Re-run pack"
                          : "Run pack"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Investor Accounts Snapshot</CardTitle>
                    <CardDescription>
                      One-page snapshot of runway, burn, and key movements for investor updates and board packs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Input: period (month / quarter) plus high-level options.</p>
                      <p>Output: summary bullets, key metrics, and highlights ready to drop into your deck.</p>
                      {investorPack && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          Last run available below — open to inspect the raw payload.
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setInvestorPackPreviewOpen(true);
                        await runPack("investor_accounts_snapshot");
                      }}
                      disabled={investorPackLoading}
                    >
                      {investorPackLoading
                        ? "Generating..."
                        : investorPack
                          ? "Re-run pack"
                          : "Run pack"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Pack preview dialogs (post-GA enhancement; GA focuses on core pack runs) */}
        <Dialog open={saasPackPreviewOpen} onOpenChange={setSaasPackPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Monthly SaaS Expenses Pack (Preview)</DialogTitle>
              <DialogDescription>
                Live payload from <code>/api/accounts/packs</code> using your current financial documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              {saasPackError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {saasPackError}
                </div>
              )}
              {saasPackLoading && (
                <p className="text-xs">Generating SaaS expenses pack...</p>
              )}
              {!saasPackLoading && !saasPackError && !saasPack && (
                <p className="text-xs">
                  No pack has been generated yet. Use <strong>Run pack</strong> from the Accounts Packs card to create one.
                </p>
              )}
              {saasPack && !saasPackLoading && (
                <>
                  <p className="text-xs">
                    Raw JSON payload for the latest run. UI polish can come later; this is meant as a sanity check that the aggregation is behaving.
                  </p>
                  <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(saasPack, null, 2)}
                  </pre>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaasPackPreviewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={investorPackPreviewOpen} onOpenChange={setInvestorPackPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Investor Accounts Snapshot (Preview)</DialogTitle>
              <DialogDescription>
                Live payload from <code>/api/accounts/packs</code> using current document + accounts classifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              {investorPackError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {investorPackError}
                </div>
              )}
              {investorPackLoading && (
                <p className="text-xs">Generating investor accounts snapshot...</p>
              )}
              {!investorPackLoading && !investorPackError && !investorPack && (
                <p className="text-xs">
                  No snapshot has been generated yet. Use <strong>Run pack</strong> from the Accounts Packs card to create one.
                </p>
              )}
              {investorPack && !investorPackLoading && (
                <>
                  <p className="text-xs">
                    Raw JSON payload for the latest investor snapshot. This confirms the pack wiring before we build a prettier view.
                  </p>
                  <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(investorPack, null, 2)}
                  </pre>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInvestorPackPreviewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Builder Type Switcher */}
      <div className="border-b bg-background px-6 pt-4 pb-2 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Builder</h1>
          <p className="text-xs text-muted-foreground">
            Draft contracts, decks, and accounts packs from one workspace.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border bg-muted/40 p-1 text-xs">
          <Button
            size="sm"
            variant={activeBuilder === "contracts" ? "default" : "ghost"}
            className="rounded-full px-3"
            onClick={() => setActiveBuilder("contracts")}
          >
            Contracts
          </Button>
          <Button
            size="sm"
            variant={activeBuilder === "decks" ? "default" : "ghost"}
            className="rounded-full px-3"
            onClick={() => setActiveBuilder("decks")}
          >
            Decks
          </Button>
          <Button
            size="sm"
            variant={activeBuilder === "accounts" ? "default" : "ghost"}
            className="rounded-full px-3"
            onClick={() => setActiveBuilder("accounts")}
          >
            Accounts
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {activeBuilder === "contracts" && renderContractsBuilder()}
        {activeBuilder === "decks" && renderDecksBuilder()}
        {activeBuilder === "accounts" && renderAccountsBuilder()}
      </div>
    </div>
  );
}
