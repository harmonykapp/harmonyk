"use client";

import useScrollEvents from "@/components/share/useScrollEvents";


type Props =
  | { shareId: string; title: string; html: string; markdown?: never }
  | { shareId: string; title: string; html?: never; markdown: string };

/**
 * Client-only shell that:
 * - fires share_open on mount and scroll events at 33/66/95%
 * - renders your content with clean typography (prose classes)
 *
 * Pass EITHER `html` OR `markdown` (not both).
 */
export default function ShareClient(props: Props) {
  const { shareId } = props;
  useScrollEvents({ shareId });

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">{props.title}</h1>

        {/* If you already have HTML (preferred), render it directly */}
        {"html" in props && typeof props.html === "string" ? (
          // eslint-disable-next-line react/no-danger
          <article
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: props.html }}
          />
        ) : null}

        {/* If you only have Markdown (no HTML), render a basic <pre> fallback for now.
            Keep your existing Markdown renderer if you have one, and replace this block. */}
        {"markdown" in props && typeof props.markdown === "string" ? (
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap break-words">{props.markdown}</pre>
          </article>
        ) : null}
      </div>
    </div>
  );
}
