# Brand assets

Source-of-truth folder:

- `public/brand/`

Expected files (minimum):

- `public/brand/harmonyk-logo-horizontal.png`
- `public/brand/harmonyk-logo-horizontal-dark.png`

Favicons (recommended):

- `public/brand/favicon.ico`
- `public/brand/apple-touch-icon.png` (optional but recommended)

Root compatibility copies:

Browsers commonly request these at the web root even if Next.js metadata is set:

- `public/favicon.ico` (copy of `public/brand/favicon.ico`)
- `public/apple-touch-icon.png` (copy of `public/brand/apple-touch-icon.png`)

Bolt UI sync:

We keep Bolt's `bolt_ui/public/brand/` in sync via:

- `scripts/sync-brand-assets.ps1`

Run it after changing anything in `public/brand/`.

