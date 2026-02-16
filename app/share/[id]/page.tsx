import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ShareClient from "./ShareClient";

type Params = Promise<{ id?: string }>;

// PGW10 Day 1 (inventory only):
// - This route currently renders HTML via ShareClient (from /api/shares/render).
// - It does NOT render PDFs in-app today.
// PGW10 pinned comments will attach to PDF artifacts once a PDF viewer exists for Share links.

export default async function Page({ params }: { params: Params }) {
  const resolved = await params;
  const id = resolved?.id?.trim();
  const isValidUuid =
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  if (!id || !isValidUuid) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4">
        <EmptyState
          title={!id ? "This share link is missing." : "This share link is invalid or expired."}
          description={
            !id ? "Double-check the URL and try again." : "The document may have been deleted or the link has expired."
          }
          action={
            <Button asChild>
              <Link href="/share">Back to Share Hub</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <ShareClient shareId={id} />;
}
