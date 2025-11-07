"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { TEMPLATES } from "@/data/templates";
import type { Template } from "@/data/templates";
import { CLAUSES } from "@/data/clauses";
import type { Clause } from "@/data/clauses";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { createDocFromTemplate } from "./actions";

/**
 * Consistent, neutral schema for contract generation.
 */
type PartiesInput = {
  partyA_name: string;
  partyB_name: string;
  partyA_role?: string;
  partyB_role?: string;
  governing_law?: string;
  effective_date?: string;
  term_months?: string;
  termination_notice_days?: string;
  extra_notes?: string;
  custom_prompt?: string; // optional override
};

export default function BuilderPage() {
  // Auth state
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    const supa = supabaseBrowser();
    supa.auth.getUser().then(({ data }) => setUserId(data.user?.id || ""));
  }, []);

  // Templates
  const [templateId, setTemplateId] = useState<string>("nda");
  const tpl: Template | undefined = useMemo(
    () => TEMPLATES.find((t) => t.id === templateId),
    [templateId]
  );

  // Parties & settings
  const [form, setForm] = useState<PartiesInput>({
    partyA_name: "",
    partyB_name: "",
    partyA_role: "",
    partyB_role: "",
    governing_law: "",
    effective_date: "",
    term_months: "",
    termination_notice_days: "",
    extra_notes: "",
    custom_prompt: "",
  });

  // Optional clause suggestion (informational for now)
  const [clauseId, setClauseId] = useState<string>("");

  // UI state
  const [status, setStatus] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Build a consistent prompt from fields (unless custom_prompt is provided)
  const builtPrompt = useMemo(() => {
    if (form.custom_prompt && form.custom_prompt.trim().length > 0) {
      return form.custom_prompt.trim();
    }

    const lines: string[] = [];
    lines.push(`Template type: ${tpl?.name ?? templateId}`);
    lines.push(`Purpose: ${tpl?.description ?? "Business agreement"}`);

    if (form.partyA_name || form.partyA_role) {
      lines.push(
        `Party A: ${form.partyA_name || "(TBD)"}${form.partyA_role ? ` (${form.partyA_role})` : ""}`
      );
    }
    if (form.partyB_name || form.partyB_role) {
      lines.push(
        `Party B: ${form.partyB_name || "(TBD)"}${form.partyB_role ? ` (${form.partyB_role})` : ""}`
      );
    }

    if (form.governing_law) lines.push(`Governing law: ${form.governing_law}`);
    if (form.effective_date) lines.push(`Effective date: ${form.effective_date}`);
    if (form.term_months) lines.push(`Term: ${form.term_months} months`);
    if (form.termination_notice_days)
      lines.push(`Termination notice: ${form.termination_notice_days} days`);

    if (form.extra_notes) lines.push(`Additional requirements: ${form.extra_notes}`);

    // If a clause is selected, surface its name/description to guide drafting (informational)
    if (clauseId) {
      const c: Clause | undefined = CLAUSES.find((x) => x.id === clauseId);
      if (c) {
        lines.push(`Suggested clause to consider: ${c.name} — ${c.description}`);
      }
    }

    // Drafting guidance
    lines.push(
      `Draft in clear, business-ready Markdown with section headings and numbered clauses where appropriate.`
    );
    lines.push(
      `Use neutral party labels (e.g., "Party A" and "Party B") unless the template requires specific roles.`
    );
    lines.push(
      `Keep it concise, include placeholders where information is missing (e.g., [ADDRESS], [AMOUNT], [DATE]).`
    );

    return lines.join("\n");
  }, [tpl, templateId, form, clauseId]);

  function update<K extends keyof PartiesInput>(key: K, value: PartiesInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    startTransition(async () => {
      if (!userId) {
        setStatus("Sign in required");
        return;
      }
      const res: any = await createDocFromTemplate({
        templateId,
        prompt: builtPrompt,
        userId,
      });
      if (res?.error) setStatus("Error: " + res.error);
      else setStatus(`Created v1 → ${res.contentUrl}`);
    });
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <h1>Builder</h1>

      <form onSubmit={onCreate} style={{ display: "grid", gap: 16, maxWidth: 820 }}>
        {/* Template picker */}
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            style={{ padding: "8px 10px", minWidth: 320 }}
          >
            {TEMPLATES.map((t: Template) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
            {tpl?.description ?? "Select a template to see its description."}
          </div>
        </div>

        {/* Parties */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 600 }}>Parties</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Party A — Name</label>
              <input
                value={form.partyA_name}
                onChange={(e) => update("partyA_name", e.target.value)}
                placeholder="e.g., Company Alpha LLC"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Party B — Name</label>
              <input
                value={form.partyB_name}
                onChange={(e) => update("partyB_name", e.target.value)}
                placeholder="e.g., Company Beta Ltd"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Party A — Role (optional)</label>
              <input
                value={form.partyA_role}
                onChange={(e) => update("partyA_role", e.target.value)}
                placeholder='e.g., "Disclosing Party", "Service Provider", "Buyer"'
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Party B — Role (optional)</label>
              <input
                value={form.partyB_role}
                onChange={(e) => update("partyB_role", e.target.value)}
                placeholder='e.g., "Receiving Party", "Customer", "Seller"'
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Jurisdiction & Dates */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 600 }}>Jurisdiction & Dates</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Governing Law</label>
              <input
                value={form.governing_law}
                onChange={(e) => update("governing_law", e.target.value)}
                placeholder="e.g., Delaware, England & Wales, California"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Effective Date</label>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) => update("effective_date", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Term (months)</label>
              <input
                value={form.term_months}
                onChange={(e) => update("term_months", e.target.value)}
                placeholder="e.g., 12"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Termination Notice (days)</label>
              <input
                value={form.termination_notice_days}
                onChange={(e) => update("termination_notice_days", e.target.value)}
                placeholder="e.g., 30"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Extra notes */}
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Additional Requirements (optional)
          </label>
          <textarea
            value={form.extra_notes}
            onChange={(e) => update("extra_notes", e.target.value)}
            rows={5}
            placeholder="Key clauses, unusual deal points, deliverables, SLAs, payment terms, liability caps, etc."
            style={textareaStyle}
          />
        </div>

        {/* Suggest a Clause (informational) */}
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ display: "block", fontWeight: 600 }}>Optional: Suggest a Clause</label>
          <select
            value={clauseId}
            onChange={(e) => setClauseId(e.target.value)}
            style={{ padding: "8px 10px", minWidth: 320 }}
          >
            <option value="">— None —</option>
            {CLAUSES.map((c: Clause) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {clauseId && (
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {CLAUSES.find((c) => c.id === clauseId)?.description}
            </div>
          )}
        </div>

        {/* Advanced: custom prompt override */}
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
            />
            <span>Use Advanced Prompt Override</span>
          </label>

          {showAdvanced && (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={form.custom_prompt}
                onChange={(e) => update("custom_prompt", e.target.value)}
                rows={6}
                placeholder="Paste or write your full custom prompt here. If present, it replaces the structured fields above."
                style={textareaStyle}
              />
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                Tip: If this is filled, the generator ignores the structured fields and uses your prompt verbatim.
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "10px 12px",
              background: "#6B4FEF",
              color: "#fff",
              border: "1px solid #6B4FEF",
              borderRadius: 8,
              cursor: "pointer",
              minWidth: 260,
            }}
          >
            {isPending ? "Creating…" : "Create Version 1 → Save to Vault"}
          </button>
          {status && <div style={{ marginTop: 8 }}>{status}</div>}
        </div>

        {/* Debug: show built prompt */}
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer" }}>Show built prompt (debug)</summary>
          <pre
            style={{
              marginTop: 8,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
              background: "#fafafa",
              whiteSpace: "pre-wrap",
              fontSize: 12,
            }}
          >
            {builtPrompt}
          </pre>
        </details>
      </form>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        Output files land in <code>/public/generated/*.md</code> for now and appear in <b>Vault</b>.
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
};
