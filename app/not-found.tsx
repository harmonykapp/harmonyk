import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 px-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-2 text-2xl font-semibold">Page not found</h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          This page doesn&apos;t exist or may have moved. You can return to your documents.
        </p>
        <Link
          href="/vault"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-white shadow dark:bg-slate-100 dark:text-slate-900"
        >
          Back to Vault
        </Link>
      </div>
    </div>
  );
}
