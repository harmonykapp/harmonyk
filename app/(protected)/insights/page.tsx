// Week 8: Insights page wired to InsightsClient
//
// Server component:
// - Renders InsightsClient without requiring a workspace.
// - In this v1, metrics are aggregated across all visible data
//   for the current user/project.

import InsightsClient from "./_components/insights-client";

export default async function InsightsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Insights</h1>
        <p className="text-sm text-muted-foreground">
          High-level metrics for your usage: docs generated, saved to Vault,
          share links, signatures, playbooks, Mono queries, and time saved.
        </p>
      </div>

      <InsightsClient />
    </div>
  );
}
