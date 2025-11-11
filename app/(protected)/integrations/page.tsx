"use client";

import StatusPanel from "@/components/integrations/StatusPanel";

export default function IntegrationsPage() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Integrations</h1>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Google Drive */}
        <StatusPanel />
        {/* Future: Gmail / Slack / Notion panels go here */}
      </div>
    </div>
  );
}
