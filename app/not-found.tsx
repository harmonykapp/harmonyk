import Link from "next/link";

export default function NotFound() {
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
          textAlign: "center",
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
          Page not found
        </h1>
        <p
          style={{
            marginTop: "0.75rem",
            color: "#475569",
            lineHeight: 1.6,
          }}
        >
          We couldn’t find that page. It may have been moved or deleted.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "1.5rem",
            padding: "0.8rem 1.25rem",
            borderRadius: 12,
            fontWeight: 600,
            color: "#111827",
            textDecoration: "none",
            background: "#e2e8f0",
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
