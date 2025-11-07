"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ConnState = "disconnected" | "connected" | "error" | "checking";

export default function IntegrationsPage() {
  const [drive, setDrive] = useState<ConnState>("checking");
  const [gmail, setGmail]   = useState<ConnState>("checking");
  const supabase = supabaseBrowser();

  async function getGoogleAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    // @ts-expect-error provider_token not in typings
    return data?.session?.provider_token ?? null;
  }

  async function probeDrive(token: string): Promise<boolean> {
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=user/displayName",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.ok;
  }

  async function probeGmail(token: string): Promise<boolean> {
    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.ok;
  }

  useEffect(() => {
    (async () => {
      setDrive("checking"); setGmail("checking");
      const token = await getGoogleAccessToken();
      if (!token) { setDrive("disconnected"); setGmail("disconnected"); return; }
      try {
        const [dOk, gOk] = await Promise.all([probeDrive(token), probeGmail(token)]);
        setDrive(dOk ? "connected" : "disconnected");
        setGmail(gOk ? "connected" : "disconnected");
      } catch {
        setDrive("error"); setGmail("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request BOTH scopes in one consent so the token works for both providers.
  const COMBINED_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/gmail.readonly",
  ].join(" ");

  async function connectAll() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: COMBINED_SCOPES,
        redirectTo: `${window.location.origin}/integrations`,
        queryParams: { prompt: "consent", access_type: "offline" },
      },
    });
  }

  // Keep individual buttons in case you want to re-consent one area later
  async function connectDrive() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file",
        redirectTo: `${window.location.origin}/integrations`,
        queryParams: { prompt: "consent", access_type: "offline" },
      },
    });
  }

  async function connectGmail() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        redirectTo: `${window.location.origin}/integrations`,
        queryParams: { prompt: "consent", access_type: "offline" },
      },
    });
  }

  function disconnectDrive(){ setDrive("disconnected"); }
  function disconnectGmail(){ setGmail("disconnected"); }
  function reauthDrive(){ connectDrive(); }
  function reauthGmail(){ connectGmail(); }

  const Card = ({title, desc, state, onConnect, onReauth, onDisconnect}:
    {title:string;desc:string;state:ConnState;onConnect:()=>void;onReauth:()=>void;onDisconnect:()=>void}) => (
    <div style={{border:"1px solid #eee", borderRadius:12, padding:16}}>
      <h3 style={{margin:0}}>{title}</h3>
      <p style={{opacity:.75, margin:"6px 0 12px"}}>{desc}</p>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        {state==="disconnected" && <button onClick={onConnect}>Connect</button>}
        {state==="connected" && (<><button onClick={onReauth}>Reauth</button><button onClick={onDisconnect}>Disconnect</button></>)}
        {state==="checking" && <span>Checking…</span>}
        {state==="error" && <span style={{color:"#B00020"}}>Error</span>}
        <span style={{marginLeft:"auto", fontSize:12, opacity:.6}}>Status: {state}</span>
      </div>
    </div>
  );

  return (
    <div style={{display:"grid", gap:16}}>
      <h1>Integrations</h1>

      <div style={{padding:12, border:"1px dashed #ddd", borderRadius:12}}>
        <b>One-click connect (recommended):</b>
        <div style={{marginTop:8}}>
          <button onClick={connectAll}>Connect Drive + Gmail</button>
        </div>
        <div style={{fontSize:12, opacity:.7, marginTop:6}}>
          Requests Drive (readonly + file) and Gmail (readonly) scopes in a single consent.
        </div>
      </div>

      <Card title="Google Drive" desc="List Recents (RO) and save to an app folder."
            state={drive} onConnect={connectDrive} onReauth={reauthDrive} onDisconnect={disconnectDrive}/>
      <Card title="Gmail" desc="Read metadata (subjects, senders) for Workbench filters."
            state={gmail} onConnect={connectGmail} onReauth={reauthGmail} onDisconnect={disconnectGmail}/>
    </div>
  );
}
