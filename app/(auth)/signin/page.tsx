"use client";

import { useState } from "react";
// If "@/lib/..." doesn't work, use: import { supabaseBrowser } from "../../..//../lib/supabase-browser";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage("Magic link sent. Check your email.");
    }
  }

  async function signInWithGoogle() {
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Sign in</h1>

      <button
        onClick={signInWithGoogle}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #ccc",
          borderRadius: 8,
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        Continue with Google
      </button>

      <div style={{ opacity: 0.6, fontSize: 12, margin: "8px 0" }}>or</div>

      <form onSubmit={sendMagicLink} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending" || email.trim() === ""}
          style={{
            padding: "10px 12px",
            border: "1px solid #6B4FEF",
            background: "#6B4FEF",
            color: "#fff",
            borderRadius: 8,
            cursor: "pointer",
            opacity: status === "sending" ? 0.6 : 1,
          }}
        >
          {status === "sending" ? "Sending…" : "Send magic link"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 12, color: status === "error" ? "#B00020" : "#2f6f2f" }}>
          {message}
        </p>
      )}
    </div>
  );
}
