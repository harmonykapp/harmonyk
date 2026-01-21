import { readRoomsStorage, writeRoomsStorage } from "@/lib/rooms/storage";
import type { Room, RoomId, RoomTimelineEvent } from "@/lib/rooms/types";

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  // Non-cryptographic. Good enough for stub/local IDs.
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function track(event: { name: string; props?: Record<string, string | number | boolean> }): void {
  // “Real wiring” without assuming a telemetry provider. Later we can route this into PostHog/Sentry/etc.
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug(`[telemetry] ${event.name}`, event.props ?? {});
  }
}

function upsertRoom(nextRoom: Room): void {
  const stored = readRoomsStorage();
  const idx = stored.rooms.findIndex((r) => r.id === nextRoom.id);
  const rooms =
    idx >= 0 ? stored.rooms.map((r) => (r.id === nextRoom.id ? nextRoom : r)) : [nextRoom, ...stored.rooms];
  writeRoomsStorage({ version: 1, rooms });
}

function appendEvent(room: Room, event: RoomTimelineEvent): Room {
  return { ...room, updatedAt: nowIso(), timeline: [...room.timeline, event] };
}

export const RoomsService = {
  listRooms(): Room[] {
    const stored = readRoomsStorage();
    return [...stored.rooms].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  },

  getRoom(id: RoomId): Room | null {
    const stored = readRoomsStorage();
    return stored.rooms.find((r) => r.id === id) ?? null;
  },

  createRoom(input: { name: string }): Room {
    const name = input.name.trim();
    const t = nowIso();
    const id: RoomId = randomId("room");
    const room: Room = {
      id,
      name,
      createdAt: t,
      updatedAt: t,
      sources: [],
      pins: [],
      timeline: [
        {
          id: randomId("evt"),
          kind: "room.created",
          at: t,
          actor: { type: "system" },
          payload: { roomId: id, name },
        },
      ],
    };
    upsertRoom(room);
    track({ name: "rooms.create", props: { roomId: id } });
    return room;
  },

  renameRoom(input: { roomId: RoomId; name: string }): Room | null {
    const existing = this.getRoom(input.roomId);
    if (!existing) return null;
    const nextName = input.name.trim();
    const t = nowIso();
    const next = appendEvent(
      { ...existing, name: nextName, updatedAt: t },
      {
        id: randomId("evt"),
        kind: "room.renamed",
        at: t,
        actor: { type: "system" },
        payload: { roomId: existing.id, name: nextName },
      }
    );
    upsertRoom(next);
    track({ name: "rooms.rename", props: { roomId: existing.id } });
    return next;
  },

  attachSource(input: { roomId: RoomId; vaultDocId: string; label?: string; vaultDocKind?: string | null }): Room | null {
    const existing = this.getRoom(input.roomId);
    if (!existing) return null;
    const t = nowIso();
    const vaultDocId = input.vaultDocId.trim();
    const label = input.label?.trim();
    const vaultDocKindRaw = typeof input.vaultDocKind === "string" ? input.vaultDocKind.trim() : null;
    const vaultDocKind = vaultDocKindRaw && vaultDocKindRaw.length > 0 ? vaultDocKindRaw : null;

    const sourceId = randomId("src");
    const nextRoom: Room = appendEvent(
      {
        ...existing,
        updatedAt: t,
        sources: [
          ...existing.sources,
          {
            id: sourceId,
            kind: "vaultDoc",
            vaultDocId,
            vaultDocKind,
            label: label && label.length > 0 ? label : undefined,
            addedAt: t,
          },
        ],
      },
      {
        id: randomId("evt"),
        kind: "source.attached",
        at: t,
        actor: { type: "system" },
        payload: { roomId: existing.id, sourceId, vaultDocId },
      }
    );

    upsertRoom(nextRoom);
    track({ name: "rooms.source.attach", props: { roomId: existing.id } });
    return nextRoom;
  },

  relinkSource(input: {
    roomId: RoomId;
    sourceId: string;
    vaultDocId: string;
    label?: string;
    vaultDocKind?: string | null;
  }): Room | null {
    const existing = this.getRoom(input.roomId);
    if (!existing) return null;

    const sourceIdx = existing.sources.findIndex((s) => s.id === input.sourceId);
    if (sourceIdx < 0) return existing;

    const t = nowIso();
    const nextVaultDocId = input.vaultDocId.trim();
    const nextLabelRaw = input.label?.trim();
    const nextLabel = nextLabelRaw && nextLabelRaw.length > 0 ? nextLabelRaw : undefined;
    const nextKindRaw = typeof input.vaultDocKind === "string" ? input.vaultDocKind.trim() : null;
    const nextKind = nextKindRaw && nextKindRaw.length > 0 ? nextKindRaw : null;

    const current = existing.sources[sourceIdx]!;
    const fromVaultDocId = current.vaultDocId;

    const nextSources = existing.sources.map((s) => {
      if (s.id !== input.sourceId) return s;
      return {
        ...s,
        vaultDocId: nextVaultDocId,
        label: nextLabel,
        vaultDocKind: nextKind,
      };
    });

    const nextRoom: Room = appendEvent(
      { ...existing, updatedAt: t, sources: nextSources },
      {
        id: randomId("evt"),
        kind: "source.relinked",
        at: t,
        actor: { type: "system" },
        payload: {
          roomId: existing.id,
          sourceId: input.sourceId,
          fromVaultDocId,
          toVaultDocId: nextVaultDocId,
        },
      }
    );

    upsertRoom(nextRoom);
    track({ name: "rooms.source.relink", props: { roomId: existing.id } });
    return nextRoom;
  },

  removeSource(input: { roomId: RoomId; sourceId: string }): Room | null {
    const existing = this.getRoom(input.roomId);
    if (!existing) return null;
    const target = existing.sources.find((s) => s.id === input.sourceId);
    if (!target) return existing;
    const t = nowIso();

    const nextSources = existing.sources.filter((s) => s.id !== input.sourceId);
    const nextPins = existing.pins.filter((p) => p.sourceId !== input.sourceId);

    const nextRoom: Room = appendEvent(
      { ...existing, updatedAt: t, sources: nextSources, pins: nextPins },
      {
        id: randomId("evt"),
        kind: "source.detached",
        at: t,
        actor: { type: "system" },
        payload: { roomId: existing.id, sourceId: input.sourceId },
      }
    );

    upsertRoom(nextRoom);
    track({ name: "rooms.source.remove", props: { roomId: existing.id } });
    return nextRoom;
  },

  pinSource(input: { roomId: RoomId; sourceId: string }): Room | null {
    const existing = this.getRoom(input.roomId);
    if (!existing) return null;
    const sourceExists = existing.sources.some((s) => s.id === input.sourceId);
    if (!sourceExists) return existing;
    const alreadyPinned = existing.pins.some((p) => p.sourceId === input.sourceId);
    if (alreadyPinned) return existing;

    const t = nowIso();
    const pinId = randomId("pin");

    const nextRoom: Room = appendEvent(
      {
        ...existing,
        updatedAt: t,
        pins: [...existing.pins, { id: pinId, sourceId: input.sourceId, pinnedAt: t }],
      },
      {
        id: randomId("evt"),
        kind: "evidence.pinned",
        at: t,
        actor: { type: "system" },
        payload: { roomId: existing.id, pinId, sourceId: input.sourceId },
      }
    );

    upsertRoom(nextRoom);
    track({ name: "rooms.evidence.pin", props: { roomId: existing.id } });
    return nextRoom;
  },

  unpinSource(input: { roomId: RoomId; sourceId: string }): Room | null {
    const existing = this.getRoom(input.roomId);
    if (!existing) return null;
    const target = existing.pins.find((p) => p.sourceId === input.sourceId);
    if (!target) return existing;

    const t = nowIso();
    const nextPins = existing.pins.filter((p) => p.sourceId !== input.sourceId);

    const nextRoom: Room = appendEvent(
      { ...existing, updatedAt: t, pins: nextPins },
      {
        id: randomId("evt"),
        kind: "evidence.unpinned",
        at: t,
        actor: { type: "system" },
        payload: { roomId: existing.id, pinId: target.id },
      }
    );

    upsertRoom(nextRoom);
    track({ name: "rooms.evidence.unpin", props: { roomId: existing.id } });
    return nextRoom;
  },
};

