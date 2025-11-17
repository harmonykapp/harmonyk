import Link from "next/link";

export default function SignaturesPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 px-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Documenso
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Signatures coming soon</h1>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Week 4 will introduce Documenso-powered signing flows. For now, prepare documents in the
          Builder and track versions in the Vault.
        </p>
        <Link
          href="/vault"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-white shadow transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Back to Vault
        </Link>
      </div>
    </div>
  );
}

