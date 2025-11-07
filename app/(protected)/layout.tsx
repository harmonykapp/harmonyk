import type React from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <aside
        style={{
          borderRight: "1px solid #eee",
          padding: "16px",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Monolyth</div>
        <nav style={{ display: "grid", gap: 8 }}>
          <a href="/dashboard">Dashboard</a>
          <a href="/workbench">Workbench</a>
          <a href="/workbench/lens/contracts">Lens · Contracts</a>
          <a href="/builder">Builder</a>
          <a href="/builder/draft">Draft</a>
          <a href="/vault">Vault</a>
          <a href="/signatures">Signatures</a> {/* <-- NEW LINK */}
          <a href="/integrations">Integrations</a>
          <a href="/calendar">Calendar</a>
          <a href="/tasks">Tasks</a>
          <a href="/insights">Insights</a>
          <a href="/settings">Settings</a>
          <a href="/billing">Billing</a>
        </nav>
      </aside>
      <main style={{ padding: "16px" }}>{children}</main>
    </div>
  );
}
