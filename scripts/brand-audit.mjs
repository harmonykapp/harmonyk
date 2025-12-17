import fs from "node:fs";
import path from "node:path";

/**
 * Brand audit: prevent accidental reintroduction of legacy user-facing names.
 *
 * Policy:
 * - We ONLY block user-facing legacy names:
 *   - "Monolyth" (any case)
 *   - whole-word "Mono" (capital M)
 *
 * - We do NOT block internal identifiers that intentionally remain:
 *   - mono_* (db/event types)
 *   - /api/mono routes
 *   - MONO_* env vars
 *   - font-mono / monospace
 */

const ROOT = process.cwd();

// Only scan user-facing code + metadata surfaces.
const INCLUDE_DIRS = ["app", "components", "lib", "data", "public"];

// Don't scan these directories even if nested (dev sandboxes, db, build output).
const EXCLUDE_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "supabase",
  "bolt_ui",
  "dist",
  "build",
  "coverage",
]);

// Specific files that legitimately mention legacy names (policy notes / migrations).
const EXCLUDE_FILES = new Set([
  path.normalize("lib/legacy-keys.ts"),
  path.normalize("lib/brand.ts"),
  path.normalize("docs/NORTH_STAR.md"), // naming note allowed
]);

const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md"]);

const reMonolyth = /\bMonolyth\b/gi;
const reMonoWholeWord = /\bMono\b/g; // whole-word only, won't match MonoAssistant, MonoPane, etc.

function isExcludedDir(dirName) {
  return EXCLUDE_DIR_NAMES.has(dirName);
}

function isExcludedFile(relPath) {
  return EXCLUDE_FILES.has(path.normalize(relPath));
}

async function walk(dirAbs, baseRel) {
  const entries = await fs.promises.readdir(dirAbs, { withFileTypes: true });
  const files = [];

  for (const ent of entries) {
    const abs = path.join(dirAbs, ent.name);
    const rel = path.join(baseRel, ent.name);

    if (ent.isDirectory()) {
      if (isExcludedDir(ent.name)) continue;
      files.push(...(await walk(abs, rel)));
      continue;
    }

    const ext = path.extname(ent.name);
    if (!ALLOWED_EXT.has(ext)) continue;
    if (isExcludedFile(rel)) continue;

    files.push({ abs, rel });
  }

  return files;
}

function findHitsInText(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (reMonolyth.test(line) || reMonoWholeWord.test(line)) {
      // Reset regex state for global regexes
      reMonolyth.lastIndex = 0;
      reMonoWholeWord.lastIndex = 0;
      hits.push({ lineNo: i + 1, line });
    } else {
      reMonolyth.lastIndex = 0;
      reMonoWholeWord.lastIndex = 0;
    }
  }

  return hits;
}

async function main() {
  const problems = [];

  for (const dir of INCLUDE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;

    const files = await walk(abs, dir);
    for (const f of files) {
      let text = "";
      try {
        text = await fs.promises.readFile(f.abs, "utf8");
      } catch {
        continue;
      }

      const hits = findHitsInText(text);
      for (const h of hits) {
        problems.push({
          file: f.rel,
          line: h.lineNo,
          preview: h.line.trim(),
        });
      }
    }
  }

  if (problems.length) {
    console.error("\n❌ Brand audit failed. Legacy names found:\n");
    for (const p of problems) {
      console.error(`${p.file}:${p.line}  ${p.preview}`);
    }
    console.error("\nFix these occurrences (user-facing only).");
    process.exit(1);
  }

  console.log("✅ Brand audit passed (no legacy user-facing names found).");
}

main().catch((err) => {
  console.error("❌ Brand audit crashed:", err);
  process.exit(1);
});

