"use client";

import { phCapture } from "@/lib/posthog-client";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { sendDocumensoEnvelope } from "./actions";

type Doc = { id: string; title: string; created_at: string };
type SendSuccess = { envelopeId: string; shareUrl: string };

export default function SignaturesPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SendSuccess | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data?.user) {
        setLoading(false);
        return;
      }
      setUserId(data.user.id);

      const { data: documents } = await sb
        .from("documents")
        .select("id, title, created_at")
        .eq("owner_id", data.user.id)
        .order("created_at", { ascending: false });
      setDocs((documents || []) as Doc[]);
      setLoading(false);
    })();
  }, [sb]);

  const onSend = () => {
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError("Please sign in again.");
      return;
    }

    if (!docId || !email) {
      setError("Select a document and enter a signer email.");
      return;
    }

    // Bridge client → server action so the UI stays responsive.
    startTransition(async () => {
      const result = await sendDocumensoEnvelope({ docId, email, userId });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess({ envelopeId: result.envelopeId, shareUrl: result.shareUrl });
      phCapture("sign_send", { docId, provider: "documenso" });
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Send for Signature</h1>
      {loading && <div>Loading…</div>}
      {!loading && (
        <div className="space-y-4 max-w-xl">
          <label className="block">
            <div className="text-sm mb-1">Document</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={docId}
              onChange={(event) => setDocId(event.target.value)}
              disabled={isPending}
            >
              <option value="">Select a document…</option>
              {docs.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-sm mb-1">Signer email</div>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="person@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
            />
          </label>

          <button
            className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-60"
            onClick={onSend}
            disabled={isPending}
          >
            {isPending ? "Sending…" : "Send for signature"}
          </button>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          {success ? (
            <div className="space-y-2 rounded-lg border px-3 py-2 text-sm">
              <div>Envelope {success.envelopeId} created.</div>
              <Link href={success.shareUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                Open signer link
              </Link>
            </div>
          ) : null}

          <div className="text-xs text-gray-500">
            Documenso envelopes send immediately; status updates land in Insights.
          </div>
        </div>
      )}
    </div>
  );
}
