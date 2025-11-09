"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: 0 }}>Something went wrong</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        {error?.message || "Unexpected error"}
      </p>
      <button
        onClick={() => reset()}
        style={{
          marginTop: 12,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ccc",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
