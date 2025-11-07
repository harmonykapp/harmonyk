"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getGoogleAccessToken } from "@/lib/google-token";
import { analyzeRowAction } from "./actions";

type Row = {
  id: string;
  title: string;
  source: "Drive" | "Gmail";
  kind: string;
  owner?: string;
  modified?: string; // ISO date
  url?: string;      // preview link
  preview?: string;  // (optional) short text we pass to AI if available
};

export default function WorkbenchPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All"|"Drive"|"Gmail">("All");

  const [openId, setOpenId] = useState<string|null>(null);
  const [aiState, setAiState] = useState<any|null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(
    () => rows.filter(r => filter === "All" ? true : r.source === filter),
    [rows, filter]
  );

  async function fetchDriveRecents(accessToken: string): Promise<Row[]> {
    const params = new URLSearchParams({
      pageSize: "25",
      orderBy: "modifiedTime desc",
      fields: "files(id,name,mimeType,owners,modifiedTime)"
    });
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error(`Drive error ${res.status}`);
    const data = await res.json();
    return (data.files ?? []).map((f:any) => ({
      id: `drive:${f.id}`,
      title: f.name,
      source: "Drive",
      kind: f.mimeType,
      owner: f.owners?.[0]?.displayName || f.owners?.[0]?.emailAddress,
      modified: f.modifiedTime,
      url: `https://drive.google.com/file/d/${f.id}/view`
    }));
  }

  async function fetchGmailMetadata(accessToken: string): Promise<Row[]> {
    const list = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!list.ok) throw new Error(`Gmail list error ${list.status}`);
    const { messages = [] } = await list.json();

    const detailPromises = (messages as any[]).slice(0, 25).map(async m => {
      const d = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!d.ok) return null;
      const msg = await d.json();
      const headers: Record<string,string> = {};
      for (const h of msg.payload?.headers || []) headers[h.name] = h.value;
      const subject = headers["Subject"] || "(no subject)";
      const from = headers["From"];
      const date = headers["Date"];
      return {
        id: `gmail:${msg.id}`,
        title: subject,
        source: "Gmail" as const,
        kind: "email",
        owner: from,
        modified: date ? new Date(date).toISOString() : undefined,
        url: `https://mail.google.com/mail/u/0/#all/${msg.id}`,
        preview: subject // minimal text for AI
      } as Row;
    });

    const details = await Promise.all(detailPromises);
    return details.filter(Boolean) as Row[];
  }

  async function load() {
    setLoading(true); setError(null);
    try {
      const token = await getGoogleAccessToken();
      if (!token) throw new Error("No Google access token. Use Integrations → Connect first.");
      const [drive, gmail] = await Promise.allSettled([
        fetchDriveRecents(token),
        fetchGmailMetadata(token)
      ]);
      const rows: Row[] = []
        .concat(drive.status === "fulfilled" ? drive.value : [])
        .concat(gmail.status === "fulfilled" ? gmail.value : []);
      setRows(rows);
    } catch (e:any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function onAnalyze(row: Row) {
    setOpenId(row.id);
    setAiState(null);
    startTransition(async () => {
      const res = await analyzeRowAction({
        title: row.title,
        source: row.source,
        kind: row.kind,
        owner: row.owner,
        modified: row.modified,
        preview: row.preview
      });
      setAiState(res);
    });
  }

  return (
    <div style={{fontFamily:"system-ui, sans-serif"}}>
      <h1>Workbench</h1>
      <div style={{display:"flex", gap:8, marginBottom:12}}>
        <select value={filter} onChange={e=>setFilter(e.target.value as any)}>
          <option>All</option><option>Drive</option><option>Gmail</option>
        </select>
        <button onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
        {error && <span style={{color:"#B00020"}}>{error}</span>}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"2fr 100px 1fr 1.2fr 120px 320px", gap:8, fontSize:14, fontWeight:600, padding:"6px 0", borderBottom:"1px solid #eee"}}>
        <div>Title</div><div>Source</div><div>Kind</div><div>Owner</div><div>Modified</div><div>Actions</div>
      </div>

      {visible.map(row => (
        <div key={row.id} style={{display:"grid", gridTemplateColumns:"2fr 100px 1fr 1.2fr 120px 320px", gap:8, padding:"8px 0", borderBottom:"1px solid #f3f3f3"}}>
          <div style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}} title={row.title}>{row.title}</div>
          <div>{row.source}</div>
          <div>{row.kind}</div>
          <div style={{overflow:"hidden", textOverflow:"ellipsis"}} title={row.owner}>{row.owner}</div>
          <div>{row.modified ? new Date(row.modified).toLocaleString() : ""}</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {row.url && <a href={row.url} target="_blank" rel="noreferrer">Preview</a>}
            <button onClick={()=>onAnalyze(row)} disabled={isPending}>Analyze</button>
            <button disabled>Save</button>
            <button disabled>Share</button>
            <button disabled>Send for Signature</button>
          </div>
        </div>
      ))}

      {!loading && visible.length === 0 && !error && (
        <div style={{padding:"12px 0", opacity:.7}}>No items found. Try Refresh or Connect integrations.</div>
      )}

      {/* Analyze Drawer (very simple) */}
      {openId && (
        <div style={{
          position:"fixed", right:0, top:0, bottom:0, width:420, background:"#fff",
          borderLeft:"1px solid #eee", boxShadow:"-8px 0 16px rgba(0,0,0,.06)", padding:16, overflowY:"auto"
        }}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <h3 style={{margin:0}}>Analyze</h3>
            <button onClick={()=>setOpenId(null)}>Close</button>
          </div>
          {!aiState && <div>Analyzing…</div>}
          {aiState?.error && <div style={{color:"#B00020"}}>{aiState.error}</div>}
          {aiState?.triage && (
            <div style={{marginBottom:16}}>
              <h4 style={{margin:"8px 0"}}>Triage</h4>
              <div>Priority: <b>{aiState.triage.priority}</b></div>
              <div>Labels: {(aiState.triage.labels||[]).join(", ")}</div>
              <div>Next: {aiState.triage.suggested_next_action}</div>
            </div>
          )}
          {aiState?.analysis && (
            <div>
              <h4 style={{margin:"8px 0"}}>Summary</h4>
              <p>{aiState.analysis.summary}</p>
              <h4 style={{margin:"8px 0"}}>Entities</h4>
              <ul>{(aiState.analysis.entities||[]).map((e:string,i:number)=><li key={i}>{e}</li>)}</ul>
              <h4 style={{margin:"8px 0"}}>Dates</h4>
              <ul>{(aiState.analysis.dates||[]).map((d:string,i:number)=><li key={i}>{d}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
