"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Task = {
  id: string;
  title: string;
  status: "open" | "done" | "archived";
  due_at: string | null;
};

export default function TasksPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [uid, setUid] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  // Load current user and tasks
  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data?.user) return;
      setUid(data.user.id);
      await load(data.user.id);
    })();
  }, [sb]);

  async function load(userId: string) {
    const { data, error } = await sb
      .from("tasks")
      .select("id,title,status,due_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setTasks(data || []);
  }

  async function addTask() {
    if (!uid || !title.trim()) return;
    const dueAt = due ? new Date(due).toISOString() : null;
    const { error } = await sb.from("tasks").insert({
      user_id: uid,
      title: title.trim(),
      due_at: dueAt,
    });
    if (error) return alert("Failed to add: " + error.message);
    setTitle("");
    setDue("");
    await load(uid);
  }

  async function toggleDone(t: Task) {
    if (!uid) return;
    const next = t.status === "done" ? "open" : "done";
    const { error } = await sb
      .from("tasks")
      .update({ status: next })
      .eq("id", t.id);
    if (error) return alert("Failed: " + error.message);
    await load(uid);
  }

  return (
    <div style={{ padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 16 }}>
        Tasks
      </h1>

      {/* Input */}
      <div style={{ marginBottom: 24 }}>
        <input
          placeholder="Task title..."
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "8px 12px",
            width: "60%",
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
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <button
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
          }}
          onClick={addTask}
        >
          Add
        </button>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#f9f9f9" }}>
          <tr>
            <th style={{ textAlign: "left", padding: "8px" }}>Title</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Due</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: "12px", color: "#777" }}>
                No tasks yet
              </td>
            </tr>
          )}
          {tasks.map((t) => (
            <tr key={t.id} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "8px" }}>{t.title}</td>
              <td style={{ padding: "8px" }}>
                {t.due_at ? new Date(t.due_at).toLocaleString() : "—"}
              </td>
              <td style={{ padding: "8px", textTransform: "capitalize" }}>
                {t.status}
              </td>
              <td style={{ padding: "8px" }}>
                <button
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleDone(t)}
                >
                  {t.status === "done" ? "Reopen" : "Done"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
