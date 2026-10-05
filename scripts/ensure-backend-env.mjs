#!/usr/bin/env node
/**
 * Creates backend/.env from backend/.env.example when it does not exist yet.
 *
 * .env is gitignored, so a fresh clone has none. Prisma's config and the Nest
 * bootstrap both require DATABASE_URL, so a first run would otherwise fail at
 * `prisma generate`. An existing .env is never touched.
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "backend", ".env");
const template = join(root, "backend", ".env.example");

if (existsSync(target)) {
  console.log("ℹ️  backend/.env already exists, leaving it untouched.");
} else if (existsSync(template)) {
  copyFileSync(template, target);
  console.log("✅ Created backend/.env from backend/.env.example");
} else {
  console.warn("⚠️  backend/.env.example not found; skipping .env creation.");
}