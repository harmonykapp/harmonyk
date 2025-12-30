"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function AuthCallbackClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Support both OAuth code flow (?code=...) and implicit/hash flows.
        const code = params.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        } else {
          // If session is already in URL hash, detectSessionInUrl=true will have handled it.
          const { error: sessErr } = await supabase.auth.getSession();
          if (sessErr) throw sessErr;
        }

        if (cancelled) return;

        // Send user somewhere sane after auth.
        router.replace("/dashboard");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Auth callback failed";
        setError(msg);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [params, router, supabase]);

  return (
    <div className="mx-auto max-w-md p-6 space-y-3">
      <h1 className="text-xl font-semibold">Signing you in…</h1>
      <p className="text-sm text-muted-foreground">
        Completing authentication. You'll be redirected automatically.
      </p>
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

