"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useMemo, useState } from "react";

export default function SignInPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/vault`
      : "/auth/callback?next=/vault";

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: callbackUrl,
        },
      });
      if (error) throw error;
      setMsg(
        isLocalhost
          ? "Magic link sent (LOCAL). Open Mailpit at http://127.0.0.1:54324 and click it."
          : "Magic link sent. Check your inbox.",
      );
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to send magic link";
      setMsg(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use Google or a magic link. After auth you will return to /auth/callback.
        </p>
      </div>

      {/* Google OAuth should work on localhost too (your Supabase Redirect URLs already allow it) */}
      <button
        className="w-full rounded-md border px-3 py-2 text-sm font-medium"
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: callbackUrl },
          });
          if (error) setMsg(error.message);
          setBusy(false);
        }}
        disabled={busy}
      >
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <label className="block text-sm font-medium">Email</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          disabled={busy}
        />
        <button
          className="w-full rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium disabled:opacity-60"
          type="submit"
          disabled={busy || !email.trim()}
        >
          Send magic link
        </button>
      </form>

      {msg && (
        <p className={`text-sm ${msg.toLowerCase().includes("fail") ? "text-red-600" : "text-muted-foreground"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
