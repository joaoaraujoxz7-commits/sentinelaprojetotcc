import "@tanstack/react-start/server-only";
import { getDatabase } from "@netlify/database";

type Row = Record<string, unknown>;

let database: ReturnType<typeof getDatabase> | null = null;
function pool() {
  database ??= getDatabase();
  return database.pool;
}

/** Converts `?` placeholders into Postgres `$n` placeholders. */
function toPg(text: string) {
  let index = 0;
  return text.replace(/\?/g, () => `$${++index}`);
}

export const NOW_TEXT = "to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')";

export const db = {
  async all<T = Row>(text: string, ...params: unknown[]): Promise<T[]> {
    const result = await pool().query(toPg(text), params);
    return result.rows as T[];
  },
  async get<T = Row>(text: string, ...params: unknown[]): Promise<T | undefined> {
    const result = await pool().query(toPg(text), params);
    return result.rows[0] as T | undefined;
  },
  async run(text: string, ...params: unknown[]) {
    await pool().query(toPg(text), params);
  },
};

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}
