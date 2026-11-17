import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

const globalForPool = globalThis as unknown as {
  _postgresPool: Pool | undefined;
};

const pool =
  globalForPool._postgresPool ??
  new Pool({
    host: process.env.SQL_HOST,
    port: Number(process.env.SQL_PORT || 5432),
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    allowExitOnIdle: false,
  });

pool.on("error", (err: NodeJS.ErrnoException & { code?: string }) => {
  const msg = String(err?.message || "");
  const code = String(err?.code || "");
  const isExpectedIdleDrop =
    msg.includes("Connection terminated unexpectedly") ||
    msg.includes("Client has encountered a connection error") ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "57P01" ||
    code === "57P02" ||
    code === "57P03";

  if (isExpectedIdleDrop) {
    console.warn("[PostgreSQL Pool] Recycled idle/scale-to-zero connection; pool will reconnect on next query.");
    return;
  }
  console.warn("[PostgreSQL Pool] Transient pool notice:", msg || err);
});

if (process.env.NODE_ENV !== "production") {
  globalForPool._postgresPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
