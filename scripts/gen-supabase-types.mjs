import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Generates Supabase TypeScript types into lib/supabase/database.types.ts
// Uses UTF-8 output and avoids shell redirection issues on Windows.

const OUT_PATH = path.join(process.cwd(), "lib", "supabase", "database.types.ts");

const IS_WIN = process.platform === "win32";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    // Windows: need shell=true so `supabase` (a .cmd shim) can be executed reliably.
    // Non-Windows: keep shell=false.
    const p = spawn(cmd, args, { shell: IS_WIN, windowsHide: true });
    let stdout = "";
    let stderr = "";

    p.stdout.on("data", (d) => (stdout += d.toString("utf8")));
    p.stderr.on("data", (d) => (stderr += d.toString("utf8")));

    p.on("close", (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`Command failed (${code}): ${cmd} ${args.join(" ")}\n${stderr}`));
    });
  });
}

async function main() {
  // Local types are preferred for dev.
  const args = ["gen", "types", "typescript", "--local"];
  let stdout = "";
  try {
    ({ stdout } = await run("supabase", args));
  } catch (err) {
    const msg = String(err?.message ?? err);
    if (msg.toLowerCase().includes("supabase start is not running")) {
      console.error("❌ Supabase local stack is not running.");
      console.error("");
      console.error("Fix:");
      console.error("  supabase start");
      console.error("  npm run supabase:types");
      process.exit(1);
    }
    throw err;
  }

  if (!stdout || stdout.trim().length < 50) {
    throw new Error("Supabase types output was unexpectedly empty.");
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, stdout, { encoding: "utf8" });

  // Tiny sanity check to avoid writing garbage.
  const written = fs.readFileSync(OUT_PATH, "utf8");
  if (!written.includes("export type Database")) {
    throw new Error("Generated file does not look like Supabase TS types (missing 'export type Database').");
  }

  console.log(`✅ Supabase types generated: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("❌ Failed to generate Supabase types");
  console.error(err?.message ?? err);
  process.exit(1);
});

