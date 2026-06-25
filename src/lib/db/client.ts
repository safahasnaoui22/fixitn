import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

// We talk to SQLite directly through @libsql/client rather than through the
// Prisma CLI/runtime. prisma/schema.prisma still defines the canonical data
// model (and is what `npx prisma generate` + a Postgres `DATABASE_URL` would
// use in a normal environment) — see the README for why this project's local
// dev DB is wired up this way.

declare global {
  // eslint-disable-next-line no-var
  var __fixitnDb: Client | undefined;
  // eslint-disable-next-line no-var
  var __fixitnDbReady: Promise<void> | undefined;
}

function createDb(): Client {
  const url = process.env.DATABASE_URL?.startsWith("file:")
    ? process.env.DATABASE_URL
    : "file:./dev.db";
  return createClient({ url });
}

export const db: Client = globalThis.__fixitnDb ?? createDb();

export const dbReady: Promise<void> =
  globalThis.__fixitnDbReady ??
  (async () => {
    const schemaPath = path.join(process.cwd(), "src/lib/db/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await db.executeMultiple(schema);
  })();

if (process.env.NODE_ENV !== "production") {
  globalThis.__fixitnDb = db;
  globalThis.__fixitnDbReady = dbReady;
}

/** Generates a cuid-ish unique id, good enough as a Prisma `@default(cuid())` stand-in. */
export function genId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}