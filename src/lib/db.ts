import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as typeof globalThis & { pgPool?: Pool };

export function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForPg.pgPool) {
    const max = Math.min(Math.max(Number(process.env.PG_POOL_MAX) || 8, 2), 20);
    globalForPg.pgPool = new Pool({
      connectionString: url,
      max,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
    globalForPg.pgPool.on("connect", (client) => {
      void client.query("SET statement_timeout = 15000");
    });
  }
  return globalForPg.pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result;
}
