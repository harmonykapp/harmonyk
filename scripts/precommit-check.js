/**
 * scripts/precommit-check.js
 * Cross-platform pre-commit checker for forbidden terms in STAGED diff.
 */
/* eslint-disable @typescript-eslint/no-require-imports */


const { execSync } = require("node:child_process");

// 1) Get list of staged files
let files = [];
try {
  const out = execSync("git diff --cached --name-only", { encoding: "utf8" });
  files = out.split(/\r?\n/).filter(Boolean);
} catch (e) {
  console.error("❌ Could not list staged files:", e.message);
  process.exit(1);
}

// 2) If you're only changing hooks/scripts, skip check
const onlyMaintenance = files.every((p) =>
  p.startsWith(".husky/") || p.startsWith("scripts/")
);
if (files.length > 0 && onlyMaintenance) {
  process.exit(0);
}

// 3) Consider only text/source paths (skip binaries/builds/docs)
const TEXT_EXT = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".mjs", ".cjs", ".css",
]);
const includePath = (p) => {
  if (p.match(/^(\.git|node_modules|\.next|dist|build|coverage)\b/)) return false;
  const m = p.match(/(\.[^.]+)$/);
  return m ? TEXT_EXT.has(m[1].toLowerCase()) : false;
};
const stagedTextFiles = files.filter(includePath);

// 4) If nothing relevant staged, allow commit
if (stagedTextFiles.length === 0) {
  process.exit(0);
}

// 5) Forbidden terms (relaxed; no 'token')
const FORBIDDEN = [
  "docsafe",
  "docubit",
  "dbit",
  "diablo",
  "wallet",
  "blockchain",
  "solana",
  "pane of glass",
  "\\bpane\\b",
];
const pattern = new RegExp(FORBIDDEN.join("|"), "i");

// 6) Pull only the staged diff and scan it
let diff = "";
try {
  diff = execSync("git diff --cached -U0", { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
} catch (e) {
  console.error("❌ Could not read staged diff:", e.message);
  process.exit(1);
}

if (pattern.test(diff)) {
  console.error("❌ Commit blocked: forbidden terms detected in staged changes.");
  console.error("   Run `git diff --cached -U0` to see the offending lines.");
  process.exit(1);
}

process.exit(0);
