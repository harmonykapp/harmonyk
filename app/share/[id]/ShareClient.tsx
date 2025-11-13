"use client";

import useScrollEvents from "@/components/share/useScrollEvents";

type Props =
  | { shareId: string; title: string; html: string; markdown?: never }
  | { shareId: string; title: string; html?: never; markdown: string };

export default function ShareClient(props: Props) {
  const { shareId, title } = props;

  useScrollEvents({ shareId });

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">{title}</h1>

        {"html" in props && typeof props.html === "string" ? (
          // eslint-disable-next-line react/no-danger
          <article
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: props.html }}
          />
        ) : null}

        {"markdown" in props && typeof props.markdown === "string" ? (
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap break-words">{props.markdown}</pre>
          </article>
        ) : null}
      </div>
    </div>
  );
}
