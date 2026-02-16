"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRoomsList } from "@/lib/rooms/hooks";
import { RoomsService } from "@/lib/rooms/service";
import type { Room } from "@/lib/rooms/types";
import { flag } from "@/lib/ui/flags";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CollapsibleHeaderButton } from "@/components/ui/collapsible-header-button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ROOMS_WIDGETS_COLLAPSED_KEY = "harmonyk.rooms.widgets.collapsed.v1";

type RoomRisk = {
  score: number;
  reasons: string[];
};

function safeDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysSince(iso: string, nowMs: number): number | null {
  const d = safeDate(iso);
  if (!d) return null;
  const diff = nowMs - d.getTime();
  if (!Number.isFinite(diff) || diff < 0) return 0;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function computeRoomRisk(room: Room, nowMs: number): RoomRisk {
  const reasons: string[] = [];
  let score = 0;

  const sourceCount = room.sources.length;
  const pinCount = room.pins.length;

  if (sourceCount === 0) {
    score += 3;
    reasons.push("No sources attached");
  }
  if (pinCount === 0) {
    score += 2;
    reasons.push("Nothing pinned");
  }

  const ageDays = daysSince(room.updatedAt, nowMs);
  if (ageDays != null && ageDays > 7) {
    score += 2;
    reasons.push(`No updates in ${ageDays}d`);
  }

  const removedCount = room.timeline.filter((e) => e.kind === "source.detached").length;
  if (removedCount > 0) {
    score += Math.min(3, removedCount);
    reasons.push(`${removedCount} source${removedCount === 1 ? "" : "s"} removed`);
  }

  if (sourceCount > 10 && pinCount < 2) {
    score += 1;
    reasons.push("Many sources, low curation");
  }

  return { score, reasons };
}

type ActivityDay = { label: string; count: number; iso: string };

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function startOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function buildActivityLast7Days(rooms: Room[], nowMs: number): ActivityDay[] {
  const days: ActivityDay[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
    d.setHours(0, 0, 0, 0);
    const iso = d.toISOString().slice(0, 10);
    days.push({ label: formatDayLabel(d), count: 0, iso });
  }

  const dayIndexByIso = new Map(days.map((x, idx) => [x.iso, idx]));

  for (const r of rooms) {
    for (const evt of r.timeline) {
      const at = safeDate(evt.at);
      if (!at) continue;
      const iso = new Date(startOfDayMs(at)).toISOString().slice(0, 10);
      const idx = dayIndexByIso.get(iso);
      if (idx == null) continue;
      days[idx] = { ...days[idx], count: days[idx].count + 1 };
    }
  }

  return days;
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export default function RoomsPage() {
  const enabled = flag("rooms.enabled");
  const router = useRouter();
  const { rooms } = useRoomsList(enabled);
  const nowMs = useMemo(() => Date.now(), []);
  const roomsCountLabel = useMemo(
    () => `${rooms.length} Room${rooms.length === 1 ? "" : "s"}`,
    [rooms.length]
  );
  const topRiskRooms = useMemo(() => {
    const scored = rooms.map((room) => ({ room, risk: computeRoomRisk(room, nowMs) }));
    scored.sort((a, b) => {
      if (a.risk.score !== b.risk.score) return b.risk.score - a.risk.score;
      return a.room.updatedAt < b.room.updatedAt ? 1 : -1;
    });
    return scored.slice(0, 5);
  }, [rooms, nowMs]);
  const coverageRooms = useMemo(() => {
    const byRecent = [...rooms].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return byRecent.slice(0, 5);
  }, [rooms]);
  const activity7d = useMemo(() => buildActivityLast7Days(rooms, nowMs), [rooms, nowMs]);
  const activityMax = useMemo(() => Math.max(1, ...activity7d.map((d) => d.count)), [activity7d]);
  const activityTotal = useMemo(() => activity7d.reduce((sum, d) => sum + d.count, 0), [activity7d]);
  const mostRecentActivity = useMemo(() => {
    let latest: string | null = null;
    for (const r of rooms) {
      for (const evt of r.timeline) {
        const at = safeDate(evt.at);
        if (!at) continue;
        if (!latest) {
          latest = evt.at;
          continue;
        }
        const latestD = safeDate(latest);
        if (!latestD) {
          latest = evt.at;
          continue;
        }
        if (at.getTime() > latestD.getTime()) latest = evt.at;
      }
    }
    return latest;
  }, [rooms]);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [widgetsCollapsed, setWidgetsCollapsed] = useState(false);

  function openCreate(): void {
    setCreateName("");
    setCreateError(null);
    setCreating(true);
  }

  function closeCreate(): void {
    setCreating(false);
  }

  function submitCreate(): void {
    const name = createName.trim();
    if (name.length === 0) {
      setCreateError("Room name is required.");
      return;
    }
    if (name.length > 80) {
      setCreateError("Room name must be 80 characters or less.");
      return;
    }
    const room = RoomsService.createRoom({ name });
    closeCreate();
    router.push(`/rooms/${room.id}`);
  }

  useEffect(() => {
    if (!creating) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      e.preventDefault();
      submitCreate();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creating, createName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem(ROOMS_WIDGETS_COLLAPSED_KEY);
      setWidgetsCollapsed(v === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ROOMS_WIDGETS_COLLAPSED_KEY, widgetsCollapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [widgetsCollapsed]);

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
      ) : (
        <>
          <div className="grid gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-semibold text-foreground">
                Project hubs where your docs, sources, and actions live.
              </p>
              <Button type="button" size="sm" onClick={openCreate}>
                Create Room
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/builder?tab=contracts">New Document</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/share/links">Create Share Link</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/signatures">Request Signature</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/workbench#insightsStrip">Open Review Queue</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={openCreate}>
                Create Room
              </Button>
            </div>

            <Card className="p-4">
              <div className="text-base font-semibold">Quick start</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Create your first Room from an existing contract, deck, or account pack.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/vault">Choose from Vault</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/builder">Create new</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <Collapsible
                open={!widgetsCollapsed}
                onOpenChange={(nextOpen) => setWidgetsCollapsed(!nextOpen)}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <CollapsibleHeaderButton
                      title="Room health"
                      subtitle="At-a-glance status across Rooms."
                      open={!widgetsCollapsed}
                      controlsId="rooms-health-widgets"
                      buttonClassName="px-0 py-0 min-h-0"
                      titleClassName="text-base font-semibold"
                    />
                  </div>
                </div>

                <CollapsibleContent id="rooms-health-widgets">
                  <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <Card className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">At-risk Rooms</div>
                        <Badge variant="outline" className="text-xs">
                          Top {Math.min(5, rooms.length)}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Rooms that look stale or under-curated.
                      </div>
                      {rooms.length === 0 ? (
                        <EmptyState
                          title="No Room risk yet"
                          description="Create a Room to see risk signals."
                        action={
                          <Button type="button" variant="outline" size="sm" onClick={openCreate}>
                            Create Room
                          </Button>
                        }
                          className="items-start text-left bg-muted/30 border-dashed mt-3"
                        />
                      ) : (
                        <div className="mt-3 grid gap-2">
                          {topRiskRooms.map(({ room, risk }) => (
                            <Link
                              key={room.id}
                              href={`/rooms/${room.id}`}
                              className="block rounded-md border px-3 py-2 hover:bg-muted/30"
                              aria-label={`Open room ${room.name}`}
                            >
                              <div className="flex items-start justify-between gap-2 min-w-0">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">{room.name}</div>
                                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                    {risk.reasons.length > 0 ? risk.reasons.slice(0, 2).join(" • ") : "Looks healthy"}
                                  </div>
                                </div>
                                <Badge
                                  variant={risk.score >= 5 ? "destructive" : risk.score >= 3 ? "secondary" : "outline"}
                                  className="shrink-0"
                                >
                                  {risk.score}
                                </Badge>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </Card>

                    <Card className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">Evidence coverage</div>
                      <Badge variant="outline" className="text-xs">
                        Sources / Pins
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Are Rooms collecting sources, and are you pinning the important ones?
                    </div>
                    {rooms.length === 0 ? (
                      <EmptyState
                        title="No Rooms yet"
                        description="Create a Room to start tracking sources and pins."
                        action={
                          <Button type="button" variant="outline" size="sm" onClick={openCreate}>
                            Create Room
                          </Button>
                        }
                        className="items-start text-left bg-muted/30 border-dashed mt-3"
                      />
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {coverageRooms.map((room) => {
                          const src = room.sources.length;
                          const pins = room.pins.length;
                          const pct = src > 0 ? clamp01(pins / src) : 0;
                          const pctLabel = src > 0 ? `${Math.round(pct * 100)}% pinned` : "—";
                          return (
                            <Link
                              key={room.id}
                              href={`/rooms/${room.id}`}
                              className="block rounded-md border px-3 py-2 hover:bg-muted/30"
                              aria-label={`Open room ${room.name}`}
                            >
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">{room.name}</div>
                                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                    {src} source{src === 1 ? "" : "s"} • {pins} pin{pins === 1 ? "" : "s"} •{" "}
                                    {pctLabel}
                                  </div>
                                </div>
                                <div className="shrink-0 w-20">
                                  <div className="h-2 w-full rounded bg-muted">
                                    <div
                                      className="h-2 rounded bg-mono"
                                      style={{ width: `${Math.round(pct * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">Activity</div>
                      <Badge variant="outline" className="text-xs">
                        Last 7 days
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Sources, pins, and edits across all Rooms.
                    </div>
                    <div className="mt-3">
                      <div className="flex items-end justify-between gap-2">
                        {activity7d.map((day) => {
                          const h = Math.max(2, Math.round((day.count / activityMax) * 44));
                          return (
                            <div key={day.iso} className="flex w-full flex-col items-center gap-1">
                              <div className="w-full rounded bg-muted" style={{ height: 48 }}>
                                <div
                                  className="w-full rounded bg-mono"
                                  style={{ height: h, marginTop: 48 - h }}
                                  aria-label={`${day.label}: ${day.count} events`}
                                />
                              </div>
                              <div className="text-[11px] text-muted-foreground">{day.label}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div>{activityTotal} event{activityTotal === 1 ? "" : "s"}</div>
                        <div>
                          {mostRecentActivity
                            ? `Last: ${new Date(mostRecentActivity).toLocaleString()}`
                            : "No activity yet"}
                        </div>
                      </div>
                    </div>
                  </Card>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold">Rooms</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Sorted by: Recently updated</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={openCreate}>
                    Create Room
                  </Button>
                  <div className="text-xs text-muted-foreground">{roomsCountLabel}</div>
                </div>
              </div>

              <div className="mt-3 min-h-[120px]">
                {rooms.length === 0 ? (
                  <EmptyState
                    title="No Rooms yet"
                    description="Create your first Room to start collecting evidence."
                    action={
                      <Button type="button" variant="outline" size="sm" onClick={openCreate}>
                        Create Room
                      </Button>
                    }
                    className="items-start text-left bg-muted/30 border-dashed"
                  />
                ) : (
                  <div className="grid gap-3">
                    {rooms.map((room) => (
                      <Link
                        key={room.id}
                        href={`/rooms/${room.id}`}
                        className="block rounded-md border px-3 py-2 hover:bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{room.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground truncate">
                              Updated {new Date(room.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-nowrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {room.sources.length} src
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {room.pins.length} pin
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {creating ? (
            <Card className="p-4">
              <div className="text-base font-semibold">Create Room</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Give this Room a short name. You’ll attach sources next.
              </div>
              <div className="mt-3 grid gap-2">
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Acme Seed Round"
                  maxLength={80}
                  autoFocus
                />
                {createError ? <div className="text-sm text-destructive">{createError}</div> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={closeCreate}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={submitCreate} disabled={createName.trim().length === 0}>
                    Create
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
