"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="mb-2 text-2xl font-semibold">Something went wrong</h1>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              An unexpected error occurred. You can try again or go back to the Vault.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-md bg-slate-900 px-4 py-2 text-white shadow dark:bg-slate-100 dark:text-slate-900"
              >
                Try again
              </button>
              <Link
                href="/vault"
                className="rounded-md border border-slate-300 px-4 py-2 text-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                Back to Vault
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
