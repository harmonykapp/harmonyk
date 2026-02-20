export type NormalizedRect = {
  /** 0..1 normalized coords relative to the page */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PinAnchor = {
  page: number; // 1-based page index
  x?: number;
  y?: number;
  rect?: NormalizedRect; // optional selection box; single point pins have no rect
};

export type PinnedComment = {
  id: string;
  anchor: PinAnchor;
  text: string;
  status: "open" | "resolved";
  createdAt: string;
  author: string;
};
