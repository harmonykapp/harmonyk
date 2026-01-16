"use client";

import * as React from "react";
import FilterChipsRowV0 from "@/components/widgets/FilterChipsRow_v0";

export default function FilterChipsDevPage() {
  const [selectedMulti, setSelectedMulti] = React.useState<string[]>(["all", "shared"]);
  const [selectedSingle, setSelectedSingle] = React.useState<string[]>(["all"]);

  const chips = [
    { id: "all", label: "All", count: 42 },
    { id: "starred", label: "Starred", count: 7 },
    { id: "recent", label: "Recent", count: 12 },
    { id: "shared", label: "Shared", count: 18 },
    { id: "signed", label: "Signed", count: 9 },
    { id: "archived", label: "Archived", count: 3 },
  ];

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Filter Chips Dev Page</h1>

      <div className="space-y-3">
        <div className="text-sm font-medium">Multi-select</div>
        <FilterChipsRowV0
          chips={chips}
          selected={selectedMulti}
          onSelectionChange={setSelectedMulti}
          multiSelect
        />
        <div className="text-xs text-muted-foreground">
          Selected: {selectedMulti.join(", ") || "none"}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Single-select</div>
        <FilterChipsRowV0
          chips={chips}
          selected={selectedSingle}
          onSelectionChange={setSelectedSingle}
          multiSelect={false}
        />
        <div className="text-xs text-muted-foreground">
          Selected: {selectedSingle.join(", ") || "none"}
        </div>
      </div>
    </div>
  );
}

