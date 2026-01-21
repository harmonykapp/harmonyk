"use client";

import { RoomsService } from "@/lib/rooms/service";
import type { Room, RoomId } from "@/lib/rooms/types";
import { useCallback, useEffect, useState } from "react";

export function useRoomsList(enabled: boolean): { rooms: Room[]; refresh: () => void } {
  const [rooms, setRooms] = useState<Room[]>([]);

  const refresh = useCallback(() => {
    if (!enabled) return;
    setRooms(RoomsService.listRooms());
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: StorageEvent) => {
      if (e.key !== "harmonyk.rooms.v1") return;
      refresh();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [enabled, refresh]);

  return { rooms, refresh };
}

export function useRoom(enabled: boolean, roomId: RoomId): { room: Room | null; refresh: () => void } {
  const [room, setRoom] = useState<Room | null>(null);

  const refresh = useCallback(() => {
    if (!enabled) return;
    setRoom(RoomsService.getRoom(roomId));
  }, [enabled, roomId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: StorageEvent) => {
      if (e.key !== "harmonyk.rooms.v1") return;
      refresh();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [enabled, refresh]);

  return { room, refresh };
}
