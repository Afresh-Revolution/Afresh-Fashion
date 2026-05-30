import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as typeof globalThis & { pgPool?: Pool };

/** Apply server-side defaults without a connect-handler query (avoids pg concurrent-query warning). */
function withPoolDefaults(url: string) {
  if (/[?&]statement_timeout=/i.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}statement_timeout=15000`;
}

export function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForPg.pgPool) {
    const max = Math.min(Math.max(Number(process.env.PG_POOL_MAX) || 8, 2), 20);
    globalForPg.pgPool = new Pool({
      connectionString: withPoolDefaults(url),
      max,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
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
