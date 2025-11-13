// app/share/[id]/page.tsx

type ShareData =
  | { title: string; html: string; markdown?: never }
  | { title: string; html?: never; markdown: string };

async function fetchShare(id: string): Promise<ShareData | null> {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() && process.env.NEXT_PUBLIC_APP_URL !== ""
      ? process.env.NEXT_PUBLIC_APP_URL
      : "http://localhost:3000";
  const url = new URL("/api/dev/shares/render", base);
  url.searchParams.set("id", id);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });

  if (res.status === 404 || res.status === 405) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Render failed (${res.status})`);
  }

  return (await res.json()) as ShareData;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next 16: unwrap the promises
  const p = await params;
  const sp = await searchParams;

  const id =
    p?.id ??
    (typeof sp?.id === "string" ? sp.id : Array.isArray(sp?.id) ? sp.id[0] : undefined);

  if (!id) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Invalid share link</h1>
        <p className="mt-2 text-sm text-neutral-500">Missing share id.</p>
      </div>
    );
  }

  const data = await fetchShare(id);

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Preview unavailable</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This preview endpoint is dev-only. Generate a share from Builder first.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">{data.title}</h1>

        {"html" in data && typeof data.html === "string" ? (
          // eslint-disable-next-line react/no-danger
          <article
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: data.html }}
          />
        ) : null}

        {"markdown" in data && typeof data.markdown === "string" ? (
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap break-words">{data.markdown}</pre>
          </article>
        ) : null}
      </div>
    </div>
  );
}
