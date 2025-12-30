import { Suspense } from "react";
import AuthCallbackClient from "./callback-client";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  // Next.js 16 requires useSearchParams() to be inside a client component
  // that is wrapped in a Suspense boundary.
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md p-6 space-y-3">
          <h1 className="text-xl font-semibold">Signing you in…</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
