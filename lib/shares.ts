import crypto from "node:crypto";

export const SHARE_PASSCODE_COOKIE_PREFIX = "share_passcode_";

export function hashPasscode(passcode: string) {
  return crypto.createHash("sha256").update(passcode, "utf8").digest("hex");
}

export function comparePasscodeHashes(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

