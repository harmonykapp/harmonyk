import type { Room } from "@/lib/rooms/types";

type StoredRoomsV1 = {
  version: 1;
  rooms: Room[];
};

const STORAGE_KEY = "harmonyk.rooms.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isRoom(value: unknown): value is Room {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || !isString(value.name)) return false;
  if (!isString(value.createdAt) || !isString(value.updatedAt)) return false;
  if (!Array.isArray(value.sources) || !Array.isArray(value.pins) || !Array.isArray(value.timeline)) return false;
  return true;
}

export function readRoomsStorage(): StoredRoomsV1 {
  if (typeof window === "undefined") return { version: 1, rooms: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, rooms: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { version: 1, rooms: [] };
    if (parsed.version !== 1) return { version: 1, rooms: [] };
    const rooms = parsed.rooms;
    if (!Array.isArray(rooms) || !rooms.every(isRoom)) return { version: 1, rooms: [] };
    return { version: 1, rooms };
  } catch {
    return { version: 1, rooms: [] };
  }
}

export function writeRoomsStorage(next: StoredRoomsV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures (quota/privacy mode). Rooms remains best-effort until backend.
  }
}

