"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type CalendarEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
};

export default function CalendarPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [uid, setUid] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loc, setLoc] = useState("");

  const load = useCallback(
    async (userId: string) => {
      const { data, error } = await sb
        .from("calendar_events")
        .select("id,title,starts_at,ends_at,location")
        .eq("user_id", userId)
        .order("starts_at", { ascending: true });
      if (error) console.error(error);
      setEvents(data || []);
    },
    [sb]
  );

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data?.user) return;
      setUid(data.user.id);
      await load(data.user.id);
    })();
  }, [sb, load]);

  async function addEvent() {
    if (!uid || !title || !start) {
      alert("Please enter at least a title and start time");
      return;
    }
    const { error } = await sb.from("calendar_events").insert({
      user_id: uid,
      title,
      starts_at: new Date(start).toISOString(),
      ends_at: end ? new Date(end).toISOString() : null,
      location: loc || null,
    });
    if (error) {
      alert("Failed to add event: " + error.message);
      return;
    }
    setTitle("");
    setStart("");
    setEnd("");
    setLoc("");
    await load(uid);
  }

  return (
    <div style={{ padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 16 }}>
        Calendar
      </h1>

      <div style={{ marginBottom: 24 }}>
        <input
          placeholder="Event title..."
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "8px 12px",
            width: "30%",
            marginRight: 8,
          }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="datetime-local"
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "8px 12px",
            marginRight: 8,
          }}
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="datetime-local"
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "8px 12px",
            marginRight: 8,
          }}
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <input
          placeholder="Location (optional)"
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "8px 12px",
            marginRight: 8,
          }}
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
        />
        <button
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
          }}
          onClick={addEvent}
        >
          Add
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#f9f9f9" }}>
          <tr>
            <th style={{ textAlign: "left", padding: "8px" }}>When</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Title</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Location</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: "12px", color: "#777" }}>
                No events yet
              </td>
            </tr>
          )}
          {events.map((ev) => (
            <tr key={ev.id} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "8px" }}>
                {new Date(ev.starts_at).toLocaleString()}
                {ev.ends_at
                  ? ` → ${new Date(ev.ends_at).toLocaleString()}`
                  : ""}
              </td>
              <td style={{ padding: "8px" }}>{ev.title}</td>
              <td style={{ padding: "8px" }}>{ev.location || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
