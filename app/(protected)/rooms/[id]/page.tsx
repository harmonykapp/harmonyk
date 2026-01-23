"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { useRoom } from "@/lib/rooms/hooks";
import { RoomsService } from "@/lib/rooms/service";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { flag } from "@/lib/ui/flags";
import { readVaultDocs } from "@/lib/vault-local";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

type PageProps = { params: Promise<{ id: string }> };

type VaultPickerDoc = {
  id: string;
  title: string;
  kind?: string | null;
  updatedAt?: string | null;
  source: "supabase" | "local";
};

type RoomSourceLike = {
  id: string;
  vaultDocId: string;
  label?: string | null;
  kind?: string | null;
  vaultDocKind?: string | null;
};

type RoomLike = {
  id: string;
  sources: RoomSourceLike[];
};

type SupabaseAuthUser = { id: string };
type SupabaseAuthResult = { data: { user: SupabaseAuthUser | null }; error: unknown | null };

type SupabaseRow = Record<string, unknown>;
type SupabaseQueryResult = { data: unknown[] | null; error: { message: string } | null };

type SupabaseFromChain = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (n: number) => Promise<SupabaseQueryResult>;
      };
      limit: (n: number) => Promise<SupabaseQueryResult>;
    };
    order: (column: string, options: { ascending: boolean }) => {
      limit: (n: number) => Promise<SupabaseQueryResult>;
    };
    limit: (n: number) => Promise<SupabaseQueryResult>;
  };
};

type SupabaseClientLike = {
  auth: { getUser: () => Promise<SupabaseAuthResult> };
  from: (table: string) => SupabaseFromChain;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(row: SupabaseRow, key: string): string | null {
  const v = row[key];
  return typeof v === "string" ? v : null;
}

function safeDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dayKeyLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDayHeader(dayKey: string, now: Date): string {
  const todayKey = dayKeyLocal(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterdayKey = dayKeyLocal(y);

  if (dayKey === todayKey) return "Today";
  if (dayKey === yesterdayKey) return "Yesterday";

  const parts = dayKey.split("-").map((x) => Number(x));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return dayKey;
  const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getStrFromPayload(payload: unknown, key: string): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  if (!(key in (payload as Record<string, unknown>))) return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function describeTimelineEvent(
  evt: { kind: string; payload: unknown },
  ctx?: { room?: RoomLike | null; vaultIndex?: Record<string, VaultPickerDoc> }
): { title: string; detail?: string } {
  const payload = evt.payload;
  const has = (key: string): boolean => typeof payload === "object" && payload !== null && key in payload;
  const getStr = (key: string): string | null => {
    if (!has(key)) return null;
    const v = (payload as Record<string, unknown>)[key];
    return typeof v === "string" ? v : null;
  };

  const room = ctx?.room ?? null;
  const vaultIndex = ctx?.vaultIndex ?? {};

  const resolveSourceIdFromPinId = (pinId: string): string | null => {
    if (!room) return null;
    // Best-effort: find the original pin event with this pinId and reuse its sourceId.
    // (unpin payload may only contain pinId depending on storage version)
    const timelineAny = (room as unknown as { timeline?: Array<{ kind: string; payload: unknown }> }).timeline ?? [];
    for (const e of timelineAny) {
      if (e.kind !== "evidence.pinned") continue;
      const ePinId = getStrFromPayload(e.payload, "pinId");
      if (ePinId !== pinId) continue;
      return getStrFromPayload(e.payload, "sourceId");
    }
    return null;
  };

  const sourceLabelById = (sourceId: string): string | null => {
    if (!room) return null;
    const s = room.sources.find((x) => x.id === sourceId) ?? null;
    if (!s) return null;
    return (s.label ?? s.vaultDocId) || null;
  };

  const vaultTitleByDocId = (vaultDocId: string): string | null => {
    const d = vaultIndex[vaultDocId] ?? null;
    return d?.title ?? null;
  };

  switch (evt.kind) {
    case "room.created": {
      const name = getStr("name");
      return { title: "Room created", detail: name ?? undefined };
    }
    case "room.renamed": {
      const name = getStr("name");
      return { title: "Room renamed", detail: name ?? undefined };
    }
    case "source.attached": {
      const vaultDocId = getStr("vaultDocId");
      if (!vaultDocId) return { title: "Source attached" };
      const title = vaultTitleByDocId(vaultDocId);
      return { title: "Source attached", detail: title ?? vaultDocId };
    }
    case "source.relinked": {
      const from = getStr("fromVaultDocId");
      const to = getStr("toVaultDocId");
      if (!from && !to) return { title: "Source relinked" };
      const fromTitle = from ? vaultTitleByDocId(from) : null;
      const toTitle = to ? vaultTitleByDocId(to) : null;
      const detail =
        from && to ? `${fromTitle ?? from} → ${toTitle ?? to}` : (toTitle ?? to ?? fromTitle ?? from);
      return { title: "Source relinked", detail: detail ?? undefined };
    }
    case "source.detached": {
      const sourceId = getStr("sourceId");
      if (!sourceId) return { title: "Source removed" };
      const label = sourceLabelById(sourceId);
      return { title: "Source removed", detail: label ?? sourceId };
    }
    case "evidence.pinned": {
      const sourceId = getStr("sourceId");
      if (!sourceId) return { title: "Evidence pinned" };
      const label = sourceLabelById(sourceId);
      return { title: "Evidence pinned", detail: label ?? sourceId };
    }
    case "evidence.unpinned": {
      const sourceId = getStr("sourceId");
      if (sourceId) {
        const label = sourceLabelById(sourceId);
        return { title: "Evidence unpinned", detail: label ?? sourceId };
      }
      const pinId = getStr("pinId");
      if (pinId) {
        const resolved = resolveSourceIdFromPinId(pinId);
        const label = resolved ? sourceLabelById(resolved) : null;
        return { title: "Evidence unpinned", detail: label ?? resolved ?? pinId };
      }
      return { title: "Evidence unpinned" };
    }
    default:
      return { title: evt.kind };
  }
}

async function loadVaultDocsSupabase(limit: number): Promise<VaultPickerDoc[] | null> {
  try {
    const sb = getBrowserSupabaseClient();
    const sbLike = sb as unknown as SupabaseClientLike;
    const userRes = await sbLike.auth.getUser();
    const user = userRes?.data?.user ?? null;
    if (!user?.id) return null;

    const q = sbLike
      .from("document")
      .select("id,title,kind,updated_at,owner_id")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    const res = await q;
    if (res.error) return null;
    const rows = res.data ?? [];

    const parsed: VaultPickerDoc[] = [];
    for (const r of rows) {
      if (!isRecord(r)) continue;
      const row = r as SupabaseRow;
      const id = getString(row, "id");
      const title = getString(row, "title");
      if (!id || !title) continue;
      const kind = getString(row, "kind");
      const updatedAt = getString(row, "updated_at");
      parsed.push({ id, title, kind, updatedAt, source: "supabase" });
    }

    return parsed;
  } catch {
    return null;
  }
}

function loadVaultDocsLocal(limit: number): VaultPickerDoc[] {
  const docs = readVaultDocs();
  return docs
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, limit)
    .map((d) => ({
      id: d.id,
      title: d.title,
      kind: null,
      updatedAt: d.updatedAt,
      source: "local",
    }));
}

export default function RoomDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const enabled = flag("rooms.enabled");
  const { room, refresh } = useRoom(enabled, id);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  const [attachOpen, setAttachOpen] = useState(false);
  const [fixSourceId, setFixSourceId] = useState<string | null>(null);
  const [attachDocId, setAttachDocId] = useState("");
  const [attachLabel, setAttachLabel] = useState("");
  const [attachKind, setAttachKind] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attachAdvancedOpen, setAttachAdvancedOpen] = useState(false);

  const [vaultDocs, setVaultDocs] = useState<VaultPickerDoc[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [vaultQuery, setVaultQuery] = useState("");

  const [vaultIndexLoading, setVaultIndexLoading] = useState(false);
  const [vaultIndexError, setVaultIndexError] = useState<string | null>(null);
  const [vaultIndex, setVaultIndex] = useState<Record<string, VaultPickerDoc>>({});
  const [vaultIndexState, setVaultIndexState] = useState<"none" | "supabase" | "local">("none");

  function openRename(): void {
    if (!room) return;
    setRenameValue(room.name);
    setRenameError(null);
    setRenaming(true);
  }

  function closeRename(): void {
    setRenaming(false);
  }

  function submitRename(): void {
    const name = renameValue.trim();
    if (name.length === 0) {
      setRenameError("Room name is required.");
      return;
    }
    if (name.length > 80) {
      setRenameError("Room name must be 80 characters or less.");
      return;
    }
    RoomsService.renameRoom({ roomId: id, name });
    closeRename();
    refresh();
  }

  async function refreshVaultPicker(): Promise<void> {
    setVaultLoading(true);
    setVaultError(null);
    try {
      const fromSupabase = await loadVaultDocsSupabase(25);
      if (fromSupabase && fromSupabase.length > 0) {
        setVaultDocs(fromSupabase);
        setVaultLoading(false);
        return;
      }

      const local = loadVaultDocsLocal(25);
      setVaultDocs(local);
      if (!fromSupabase) {
        setVaultError("Showing local Vault docs (Supabase unavailable or not signed in).");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load Vault documents.";
      setVaultError(msg);
      setVaultDocs(loadVaultDocsLocal(25));
    } finally {
      setVaultLoading(false);
    }
  }

  async function refreshVaultIndex(): Promise<void> {
    setVaultIndexLoading(true);
    setVaultIndexError(null);
    try {
      const fromSupabase = await loadVaultDocsSupabase(200);
      if (fromSupabase && fromSupabase.length > 0) {
        const idx: Record<string, VaultPickerDoc> = {};
        for (const d of fromSupabase) idx[d.id] = d;
        setVaultIndex(idx);
        setVaultIndexState("supabase");
        setVaultIndexLoading(false);
        return;
      }

      const local = loadVaultDocsLocal(200);
      const idx: Record<string, VaultPickerDoc> = {};
      for (const d of local) idx[d.id] = d;
      setVaultIndex(idx);
      setVaultIndexState("local");
      if (!fromSupabase) {
        setVaultIndexError("Using local Vault index (Supabase unavailable or not signed in).");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to index Vault documents.";
      setVaultIndexError(msg);
      const local = loadVaultDocsLocal(200);
      const idx: Record<string, VaultPickerDoc> = {};
      for (const d of local) idx[d.id] = d;
      setVaultIndex(idx);
      setVaultIndexState("local");
    } finally {
      setVaultIndexLoading(false);
    }
  }

  function openAttach(): void {
    setFixSourceId(null);
    setAttachDocId("");
    setAttachLabel("");
    setAttachKind(null);
    setAttachError(null);
    setVaultQuery("");
    setAttachAdvancedOpen(false);
    setAttachOpen(true);
    void refreshVaultPicker();
  }

  function openFixMissing(sourceId: string): void {
    setFixSourceId(sourceId);
    setAttachDocId("");
    setAttachLabel("");
    setAttachKind(null);
    setAttachError(null);
    setVaultQuery("");
    setAttachAdvancedOpen(false);
    setAttachOpen(true);
    void refreshVaultPicker();
  }

  function closeAttach(): void {
    setAttachOpen(false);
    setFixSourceId(null);
  }

  function submitAttach(): void {
    const vaultDocId = attachDocId.trim();
    const label = attachLabel.trim();

    if (vaultDocId.length === 0) {
      setAttachError("Vault doc ID is required.");
      return;
    }

    if (label.length > 80) {
      setAttachError("Label must be 80 characters or less.");
      return;
    }

    if (fixSourceId) {
      RoomsService.relinkSource({
        roomId: id,
        sourceId: fixSourceId,
        vaultDocId,
        label: label.length > 0 ? label : undefined,
        vaultDocKind: attachKind,
      });
    } else {
      RoomsService.attachSource({
        roomId: id,
        vaultDocId,
        label: label.length > 0 ? label : undefined,
        vaultDocKind: attachKind,
      });
    }
    closeAttach();
    refresh();
  }

  useEffect(() => {
    if (!renaming && !attachOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      e.preventDefault();
      if (renaming) submitRename();
      else if (attachOpen) submitAttach();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renaming, attachOpen, renameValue, attachDocId, attachLabel]);

  function removeSource(sourceId: string): void {
    RoomsService.removeSource({ roomId: id, sourceId });
    refresh();
  }

  function isPinned(sourceId: string): boolean {
    return room ? room.pins.some((p) => p.sourceId === sourceId) : false;
  }

  function pinOrUnpin(sourceId: string): void {
    if (isPinned(sourceId)) {
      RoomsService.unpinSource({ roomId: id, sourceId });
    } else {
      RoomsService.pinSource({ roomId: id, sourceId });
    }
    refresh();
  }

  const filteredVaultDocs = useMemo(() => {
    const q = vaultQuery.trim().toLowerCase();
    if (!q) return vaultDocs;
    return vaultDocs.filter((d) => d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
  }, [vaultDocs, vaultQuery]);

  function chooseVaultDoc(d: VaultPickerDoc): void {
    setAttachDocId(d.id);
    if (attachLabel.trim().length === 0) {
      setAttachLabel(d.title);
    }
    setAttachKind(d.kind ?? null);
    setAttachError(null);
  }

  const roomLike = useMemo(() => (room as unknown as RoomLike | null), [room]);

  useEffect(() => {
    if (!enabled) return;
    if (!roomLike?.id) return;
    void refreshVaultIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomLike?.id]);

  function vaultHrefForDoc(vaultDocId: string): string {
    const title = vaultIndex[vaultDocId]?.title ?? null;
    const q = title ?? vaultDocId;
    return `/vault?q=${encodeURIComponent(q)}`;
  }

  function missingStateForVaultDoc(vaultDocId: string): "missing" | "present" | "unknown" {
    if (vaultIndexState === "none" || vaultIndexLoading) return "unknown";
    return vaultIndex[vaultDocId] ? "present" : "missing";
  }

  const roomHealth = useMemo(() => {
    const sources = room?.sources ?? [];
    const pins = room?.pins ?? [];
    const missing = sources.reduce((acc, s) => {
      return acc + (missingStateForVaultDoc(s.vaultDocId) === "missing" ? 1 : 0);
    }, 0);
    return {
      sourcesCount: sources.length,
      pinsCount: pins.length,
      missingCount: missing,
    };
    // missingStateForVaultDoc is stable for a render; vaultIndex state changes trigger re-render anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.sources, room?.pins, vaultIndexState, vaultIndexLoading, vaultIndex]);

  const groupedTimeline = useMemo(() => {
    if (!room?.timeline?.length) return [];
    const now = new Date();
    const items = room.timeline
      .slice()
      .sort((a, b) => (a.at < b.at ? 1 : -1));

    const groups: Array<{ dayKey: string; header: string; events: typeof items }> = [];
    const byKey = new Map<string, number>();

    for (const evt of items) {
      const d = safeDate(evt.at);
      const key = d ? dayKeyLocal(startOfDayLocal(d)) : "unknown";
      const header = key === "unknown" ? "Earlier" : formatDayHeader(key, now);

      const idx = byKey.get(key);
      if (idx == null) {
        byKey.set(key, groups.length);
        groups.push({ dayKey: key, header, events: [evt] });
      } else {
        groups[idx] = { ...groups[idx], events: [...groups[idx]!.events, evt] };
      }
    }

    return groups;
  }, [room?.timeline]);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {!enabled ? (
        <EmptyState
          title="Rooms disabled"
          description="Rooms are currently disabled for this environment."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/vault">Open in Vault</Link>
            </Button>
          }
          className="items-start text-left bg-card"
        />
      ) : !room ? (
        <EmptyState
          title="Room not found"
          description="We couldn't find this Room in your workspace."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/rooms">Create Room</Link>
            </Button>
          }
          className="items-start text-left bg-card"
        />
      ) : (
        <div className="grid gap-6">
          <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="truncate text-lg font-semibold">{room.name}</div>
                  <Badge variant="secondary" className="shrink-0 rounded-md">
                    Room
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Room ID: {room.id}</div>
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                <Button variant="outline" size="sm" onClick={openRename}>
                  Rename
                </Button>
                <Link href="/rooms" className="rounded border px-3 py-1 text-sm">
                  Back
                </Link>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-md border px-3 py-2">
                <div className="text-[11px] text-muted-foreground">Sources</div>
                <div className="text-sm font-semibold">{roomHealth.sourcesCount}</div>
              </div>
              <div className="rounded-md border px-3 py-2">
                <div className="text-[11px] text-muted-foreground">Pinned</div>
                <div className="text-sm font-semibold">{roomHealth.pinsCount}</div>
              </div>
              <div className="rounded-md border px-3 py-2">
                <div className="text-[11px] text-muted-foreground">Missing</div>
                <div className="text-sm font-semibold">{roomHealth.missingCount}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">Sources</div>
                <Button variant="outline" size="sm" onClick={openAttach}>
                  Attach source
                </Button>
              </div>
              {vaultIndexError ? (
                <div className="mt-2 text-xs text-muted-foreground">{vaultIndexError}</div>
              ) : null}
              {room.sources.length === 0 ? (
                <EmptyState
                  title="No sources attached"
                  description="Attach Vault documents to build your evidence trail."
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={openAttach}>
                      Add to Room
                    </Button>
                  }
                  className="items-start text-left bg-muted/30 border-dashed mt-3"
                />
              ) : (
                <div className="mt-3 grid gap-2">
                  {room.sources.map((s) => {
                    const missingState = missingStateForVaultDoc(s.vaultDocId);
                    return (
                      <div key={s.id} className="rounded-md border p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 sm:flex-1">
                            <div className="truncate text-sm font-medium">{s.label ?? s.vaultDocId}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <div className="break-all text-xs text-muted-foreground">{s.vaultDocId}</div>
                              {missingState === "missing" ? (
                                <Badge variant="destructive" className="text-[11px]">
                                  Missing
                                </Badge>
                              ) : null}
                              {missingState === "present" ? (
                                <Badge variant="secondary" className="text-[11px]">
                                  In Vault
                                </Badge>
                              ) : null}
                              {missingState === "unknown" ? (
                                <Badge variant="outline" className="text-[11px]">
                                  Unknown
                                </Badge>
                              ) : null}
                              <Badge variant="outline" className="text-[11px]">
                                {s.vaultDocKind ?? s.kind}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-start gap-2 sm:shrink-0 sm:justify-end">
                            <Button asChild variant="outline" size="sm" aria-label="Open in Vault">
                              <Link href={vaultHrefForDoc(s.vaultDocId)}>Open</Link>
                            </Button>
                            {missingState === "missing" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openFixMissing(s.id)}
                                aria-label="Fix missing document link"
                              >
                                Fix
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => pinOrUnpin(s.id)}
                              aria-label={isPinned(s.id) ? "Unpin evidence" : "Pin evidence"}
                            >
                              {isPinned(s.id) ? "Unpin" : "Pin"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSource(s.id)}
                              aria-label="Remove source"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">Pinned evidence</div>
              </div>
              {room.pins.length === 0 ? (
                <EmptyState
                  title="Nothing pinned yet"
                  description="Pin key sources to keep them on top."
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={openAttach}>
                      Add to Room
                    </Button>
                  }
                  className="items-start text-left bg-muted/30 border-dashed mt-3"
                />
              ) : (
                <div className="mt-3 grid gap-2">
                  {room.pins
                    .slice()
                    .sort((a, b) => (a.pinnedAt < b.pinnedAt ? 1 : -1))
                    .map((p) => {
                      const src = room.sources.find((s) => s.id === p.sourceId) ?? null;
                      const missingState = src ? missingStateForVaultDoc(src.vaultDocId) : "unknown";
                      return (
                        <div key={p.id} className="rounded-md border p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 sm:flex-1">
                              {src ? (
                                <>
                                  <div className="truncate text-sm font-medium">
                                    {src.label ?? src.vaultDocId}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <div className="break-all text-xs text-muted-foreground">{src.vaultDocId}</div>
                                    {missingState === "missing" ? (
                                      <Badge variant="destructive" className="text-[11px]">
                                        Missing
                                      </Badge>
                                    ) : null}
                                    {missingState === "present" ? (
                                      <Badge variant="secondary" className="text-[11px]">
                                        In Vault
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    Pinned {new Date(p.pinnedAt).toLocaleString()}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <EmptyState
                                    title="Source missing"
                                    description="This pinned item no longer links to a Vault document."
                                    action={
                                      <Button type="button" variant="outline" size="sm" onClick={openAttach}>
                                        Add to Room
                                      </Button>
                                    }
                                    className="items-start text-left bg-muted/30 border-dashed"
                                  />
                                  <div className="mt-2 break-all text-xs text-muted-foreground">{p.sourceId}</div>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center justify-start gap-2 sm:shrink-0 sm:justify-end">
                              {src ? (
                                <Button asChild variant="outline" size="sm" aria-label="Open in Vault">
                                  <Link href={vaultHrefForDoc(src.vaultDocId)}>Open</Link>
                                </Button>
                              ) : null}
                              {src && missingState === "missing" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openFixMissing(src.id)}
                                  aria-label="Fix missing document link"
                                >
                                  Fix
                                </Button>
                              ) : null}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => pinOrUnpin(p.sourceId)}
                                aria-label="Unpin evidence"
                              >
                                Unpin
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="font-medium">Timeline</div>
            {room.timeline.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Room activity will show up here as you add sources and pins."
                action={
                  <Button type="button" variant="outline" size="sm" onClick={openAttach}>
                    Add to Room
                  </Button>
                }
                className="items-start text-left bg-muted/30 border-dashed mt-3"
              />
            ) : (
              <div className="mt-3 grid gap-4">
                {groupedTimeline.map((group) => (
                  <div key={group.dayKey} className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-muted-foreground">{group.header}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {group.events.length} event{group.events.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {group.events.map((evt) => {
                        const desc = describeTimelineEvent(
                          { kind: evt.kind, payload: evt.payload },
                          { room: roomLike, vaultIndex }
                        );
                        const when = safeDate(evt.at);
                        const timeLabel = when
                          ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                          : "—";

                        return (
                          <div key={evt.id} className="rounded-md border px-3 py-2">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{desc.title}</div>
                                {desc.detail ? (
                                  <div className="mt-1 truncate text-xs text-muted-foreground">{desc.detail}</div>
                                ) : null}
                              </div>
                              <div className="shrink-0 text-xs text-muted-foreground">{timeLabel}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={renaming} onOpenChange={(open) => (open ? openRename() : closeRename())}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Room</DialogTitle>
                <DialogDescription>Update the Room title shown across Harmonyk.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Room name"
                  maxLength={100}
                />
                {renameError ? <div className="text-sm text-destructive">{renameError}</div> : null}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeRename}>
                  Cancel
                </Button>
                <Button onClick={submitRename} disabled={renameValue.trim().length === 0}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={attachOpen}
            onOpenChange={(open) => (open ? (fixSourceId ? openFixMissing(fixSourceId) : openAttach()) : closeAttach())}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{fixSourceId ? "Fix missing doc" : "Attach source"}</DialogTitle>
                <DialogDescription>
                  {fixSourceId
                    ? "Pick the correct Vault document to relink this source."
                    : "Pick a document from Vault (recommended). Advanced options are available if needed."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">Pick from Vault</div>
                    <Button variant="outline" size="sm" onClick={refreshVaultPicker} disabled={vaultLoading}>
                      {vaultLoading ? "Loading…" : "Refresh"}
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-2">
                    <Input
                      value={vaultQuery}
                      onChange={(e) => setVaultQuery(e.target.value)}
                      placeholder="Search by title or ID…"
                    />
                    {vaultError ? <div className="text-xs text-muted-foreground">{vaultError}</div> : null}
                    {filteredVaultDocs.length === 0 ? (
                      <EmptyState
                        title="No Vault documents yet"
                        description="Save a document to Vault, then attach it here."
                        action={
                          <Button asChild variant="outline" size="sm">
                            <Link href="/vault">Open in Vault</Link>
                          </Button>
                        }
                        className="items-start text-left bg-muted/30 border-dashed"
                      />
                    ) : (
                      <div className="max-h-56 overflow-auto rounded-md border">
                        {filteredVaultDocs.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => chooseVaultDoc(d)}
                            className="flex w-full items-start justify-between gap-3 border-b px-3 py-2 text-left hover:bg-muted/30"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{d.title}</div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">{d.id}</div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              {d.kind ? <Badge variant="outline">{d.kind}</Badge> : null}
                              <Badge variant="secondary">{d.source === "supabase" ? "Cloud" : "Local"}</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">Selected</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    onClick={() => setAttachAdvancedOpen((v) => !v)}
                    aria-expanded={attachAdvancedOpen}
                    aria-controls="attach-advanced"
                  >
                    {attachAdvancedOpen ? "Hide advanced" : "Advanced"}
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Input value={attachDocId} onChange={(e) => setAttachDocId(e.target.value)} placeholder="Vault doc ID" />
                  <Input
                    value={attachLabel}
                    onChange={(e) => setAttachLabel(e.target.value)}
                    placeholder="Label (defaults to title)"
                  />
                  {attachError ? <div className="text-sm text-destructive">{attachError}</div> : null}
                </div>

                {attachAdvancedOpen ? (
                  <div id="attach-advanced" className="rounded-md border p-3">
                    <div className="text-sm font-medium">Advanced</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      If you already have a Vault doc ID, paste it above. Prefer picking from Vault to avoid mistakes.
                    </div>
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeAttach}>
                  Close
                </Button>
                <Button onClick={submitAttach} disabled={attachDocId.trim().length === 0}>
                  {fixSourceId ? "Relink" : "Attach"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
