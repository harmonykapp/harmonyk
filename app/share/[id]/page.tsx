import ShareClient from "./ShareClient";

type Params = Promise<{ id?: string }>;

export default async function Page({ params }: { params: Params }) {
  const resolved = await params;
  const id = resolved?.id;

  if (!id) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Invalid share link</h1>
        <p className="mt-2 text-sm text-neutral-500">Missing share id.</p>
      </div>
    );
  }

  return <ShareClient shareId={id} />;
}
