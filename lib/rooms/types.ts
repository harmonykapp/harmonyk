export type ISODateString = string;
export type RoomId = string;

export type RoomSourceKind = "vaultDoc";

export type RoomTimelineEventKind =
  | "room.created"
  | "room.renamed"
  | "source.attached"
  | "source.relinked"
  | "source.detached"
  | "evidence.pinned"
  | "evidence.unpinned";

export type RoomSource = {
  id: string;
  kind: RoomSourceKind;
  vaultDocId: string;
  vaultDocKind?: string | null;
  label?: string;
  addedAt: ISODateString;
};

export type RoomPin = {
  id: string;
  sourceId: string;
  pinnedAt: ISODateString;
};

export type RoomTimelineEvent = {
  id: string;
  kind: RoomTimelineEventKind;
  at: ISODateString;
  actor?: { type: "user"; id?: string } | { type: "system" };
  payload:
    | { roomId: RoomId; name: string }
    | { roomId: RoomId; sourceId: string; vaultDocId: string }
    | { roomId: RoomId; sourceId: string; fromVaultDocId: string; toVaultDocId: string }
    | { roomId: RoomId; sourceId: string }
    | { roomId: RoomId; pinId: string; sourceId: string }
    | { roomId: RoomId; pinId: string };
};

export type Room = {
  id: RoomId;
  name: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  sources: RoomSource[];
  pins: RoomPin[];
  timeline: RoomTimelineEvent[];
};

