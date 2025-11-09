// app/(protected)/builder/page.tsx
// Server page that renders the client-side Builder UI.
// All interactive logic lives in components/builder/BuilderClient.

import BuilderClient from "@/components/builder/BuilderClient";

export default async function BuilderPage() {
  // Add server-side auth/data prefetch later if needed.
  return <BuilderClient />;
}

