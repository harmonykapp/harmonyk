type SignPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SignPage({ params }: SignPageProps) {
  const resolved = await params;
  const id = resolved?.id ?? "";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
          padding: "2.5rem",
          textAlign: "center",
          border: "1px solid rgba(148, 163, 184, 0.15)",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Sign Document
        </h1>
        <p style={{ color: "#475569", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          You&apos;re about to sign document:
          <br />
          <span
            style={{
              display: "inline-block",
              marginTop: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              background: "rgba(79, 70, 229, 0.08)",
              color: "#4338CA",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.95rem",
            }}
          >
            {id || "unknown"}
          </span>
        </p>

        <button
          type="button"
          style={{
            width: "100%",
            padding: "0.85rem 1.5rem",
            borderRadius: 12,
            border: "none",
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 12px 24px rgba(79, 70, 229, 0.25)",
          }}
        >
          Continue
        </button>
      </div>
    </main>
  );
}
