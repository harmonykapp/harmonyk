"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Something went wrong</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          {error?.message || "Unexpected error"}
        </p>
      </body>
    </html>
  );
}
