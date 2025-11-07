import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supa
    .from("events")
    .select("id,created_at,event_type,doc_id,actor,meta_json")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return new NextResponse("Error: " + error.message, { status: 500 });

  const rows = data || [];
  const header = ["id","created_at","event_type","doc_id","actor","meta_json"].join(",");
  const body = rows
    .map(r => {
      const meta = JSON.stringify(r.meta_json || {});
      const safeMeta = `"${meta.replace(/"/g, '""')}"`;
      return [r.id, r.created_at, r.event_type, r.doc_id ?? "", r.actor ?? "", safeMeta].join(",");
    })
    .join("\n");

  const csv = header + "\n" + body;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="insights.csv"`
    }
  });
}
