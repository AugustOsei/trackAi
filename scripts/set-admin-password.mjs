/**
 * Set the admin password and write the resulting hash into both env files.
 *
 * The password itself is never stored anywhere — only a scrypt hash, and only
 * the hash is what Vercel needs. Run:
 *
 *   node scripts/set-admin-password.mjs "your new password"
 */
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/set-admin-password.mjs "your new password"');
  process.exit(1);
}
if (password.length < 10) {
  console.error(`Too short (${password.length} chars). Use at least 10 — this guards your review queue.`);
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

/** Replace the key in place if present, otherwise append it. */
function upsert(file, key, value) {
  if (!existsSync(file)) return `${file}: not found, skipped`;
  const body = readFileSync(file, "utf8");
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const next = pattern.test(body)
    ? body.replace(pattern, line)
    : body.replace(/\n*$/, `\n${line}\n`);
  writeFileSync(file, next);
  return `${file}: updated`;
}

console.log(upsert(".env.local", "ADMIN_PASSWORD_HASH", hash));
// .env.vercel is written unquoted, matching how Vercel expects pasted values.
if (existsSync(".env.vercel")) {
  const body = readFileSync(".env.vercel", "utf8");
  writeFileSync(
    ".env.vercel",
    body.replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=${hash}`),
  );
  console.log(".env.vercel: updated");
}

console.log("\nDone. The password itself was not saved — only its hash.");
console.log("Update ADMIN_PASSWORD_HASH in Vercel too, then redeploy.");
