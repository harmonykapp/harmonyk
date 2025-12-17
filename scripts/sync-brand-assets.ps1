# Copy brand assets from /public/brand to /bolt_ui/public/brand (no symlinks).
# Run from repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\sync-brand-assets.ps1

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $root

$src = Join-Path $repo "public\brand"
$dst = Join-Path $repo "bolt_ui\public\brand"

if (!(Test-Path $src)) {
  Write-Host "Missing source folder: $src" -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null

$files = @(
  "harmonyk-logo-horizontal.png",
  "harmonyk-logo-horizontal-dark.png",
  "harmonyk-mark.png"
)

foreach ($f in $files) {
  $from = Join-Path $src $f
  if (Test-Path $from) {
    Copy-Item -Force $from $dst
    Write-Host "Copied: $f"
  }
}

Write-Host "Done. bolt_ui brand assets synced." -ForegroundColor Green

