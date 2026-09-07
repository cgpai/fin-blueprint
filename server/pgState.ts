/**
 * Postgres-backed snapshot store — replaces Google Sheets KV.
 * Table: public.state(key text PK, value jsonb, updated_at timestamptz)
 */
import pg from 'pg';

const SNAPSHOT_KEYS = [
  'profile',
  'profiles',
  'phase',
  'processes',
  'systems',
  'notifications',
  'adminBroadcastLogs',
  'improvementItems',
] as const;

const CHUNK_PREFIX = 'processes__chunk__';

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured.');
    pool = new pg.Pool({ connectionString, max: 5 });
  }
  return pool;
}

export function pgStateConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function assembleProcesses(data: Record<string, unknown>): unknown[] {
  const chunkKeys = Object.keys(data)
    .filter((k) => k.startsWith(CHUNK_PREFIX))
    .sort((a, b) => Number(a.slice(CHUNK_PREFIX.length) || 0) - Number(b.slice(CHUNK_PREFIX.length) || 0));

  if (chunkKeys.length > 0) {
    const merged: unknown[] = [];
    const seen = new Set<string>();
    for (const key of chunkKeys) {
      const val = data[key];
      if (!Array.isArray(val)) continue;
      for (const item of val) {
        const id = item && typeof item === 'object' && 'id' in item ? String((item as { id: string }).id) : '';
        if (!id || seen.has(id)) continue;
        seen.add(id);
        merged.push(item);
      }
    }
    return merged;
  }
  return Array.isArray(data.processes) ? data.processes : [];
}

export async function getState(): Promise<Record<string, unknown>> {
  const { rows } = await getPool().query<{ key: string; value: unknown }>(
    'SELECT key, value FROM state',
  );
  const out: Record<string, unknown> = { ok: true };
  for (const row of rows) out[row.key] = row.value;
  return out;
}

export async function saveState(snapshot: Record<string, unknown>): Promise<{ ok: true }> {
  const next: Record<string, unknown> = { ...snapshot };
  const hasChunks = Object.keys(next).some((k) => k.startsWith(CHUNK_PREFIX));
  if (hasChunks || 'processes' in next) {
    next.processes = assembleProcesses(next);
  }
  for (const key of Object.keys(next)) {
    if (key.startsWith(CHUNK_PREFIX) || key === 'action' || key === 'ok') delete next[key];
  }

  const keys = SNAPSHOT_KEYS.filter((key) => key in next);
  if (keys.length === 0) {
    throw new Error('saveState: no snapshot keys provided');
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (const key of keys) {
      await client.query(
        `INSERT INTO state(key, value, updated_at) VALUES ($1, $2::jsonb, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(next[key] ?? null)],
      );
    }
    await client.query(`DELETE FROM state WHERE key LIKE $1`, [`${CHUNK_PREFIX}%`]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return { ok: true };
}
