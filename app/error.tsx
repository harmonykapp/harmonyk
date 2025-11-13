"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error?.message?.trim() ? error.message : "Please try again.";

  return (
    <div
      role="presentation"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        fontFamily: "system-ui, sans-serif",
        background: "#f8fafc",
      }}
    >
      <div
        role="alert"
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
        }}
      >
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 600,
            margin: 0,
            color: "#0f172a",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            marginTop: "0.75rem",
            color: "#475569",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            width: "100%",
            padding: "0.85rem 1.25rem",
            borderRadius: 12,
            border: "none",
            background: "#111827",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
