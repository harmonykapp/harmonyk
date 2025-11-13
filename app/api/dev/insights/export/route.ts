const rows = [
  {
    timestamp: "2025-01-01T08:00:00.000Z",
    event: "share_view",
    meta: "doc=nda-2025;actor=ceo@example.com",
  },
  {
    timestamp: "2025-01-01T08:05:30.000Z",
    event: "share_scroll_66",
    meta: "doc=nda-2025;section=payment_terms",
  },
  {
    timestamp: "2025-01-01T08:10:42.000Z",
    event: "share_download",
    meta: "doc=nda-2025;bytes=128450",
  },
];

function toCsv(): string {
  const header = "timestamp,event,meta";
  const body = rows
    .map((row) => {
      const columns = [row.timestamp, row.event, row.meta];
      return columns
        .map((value) => {
          const safeValue = `${value ?? ""}`;
          if (safeValue.includes(",") || safeValue.includes('"')) {
            return `"${safeValue.replace(/"/g, '""')}"`;
          }
          return safeValue;
        })
        .join(",");
    })
    .join("\n");

  return `${header}\n${body}`;
}

export async function GET() {
  const csv = toCsv();
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="insights.csv"',
      "Cache-Control": "no-store",
    },
  });
}

