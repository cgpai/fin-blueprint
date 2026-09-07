import {
  ImprovementItem,
  NotificationLog,
  Process,
  SystemItem,
  UserNotification,
  UserProfile,
} from '../types';

export interface AppSnapshot {
  profile: UserProfile | null;
  profiles?: Record<string, UserProfile>;
  phase: string | null;
  processes: Process[];
  systems: SystemItem[];
  notifications: UserNotification[];
  adminBroadcastLogs: NotificationLog[];
  improvementItems: ImprovementItem[];
}

const rawEndpoint = (import.meta.env.VITE_SHEETS_ENDPOINT as string | undefined)?.trim();
/** Absolute Sheets/Apps Script URL, or same-origin Postgres API path (e.g. `/api/state`). */
const endpoint =
  rawEndpoint &&
  rawEndpoint !== '[SENSITIVE]' &&
  (/^https?:\/\//i.test(rawEndpoint) || rawEndpoint.startsWith('/'))
    ? rawEndpoint
    : undefined;

const stateApiToken = (import.meta.env.VITE_STATE_API_TOKEN as string | undefined)?.trim() || '';

function stateHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {};
  if (stateApiToken) headers['X-Blueprint-Token'] = stateApiToken;
  if (extra) Object.assign(headers, extra);
  return headers;
}

export const spreadsheetEnabled = Boolean(endpoint);

export function getSheetsEndpoint(): string | undefined {
  return endpoint;
}

/** Stay under Google Sheets' 50_000 char/cell hard limit. */
const CELL_SAFE_CHARS = 45000;
const CHUNK_PREFIX = 'processes__chunk__';

function profileKey(profile: UserProfile | null): string | null {
  if (!profile) return null;
  return (profile.email || profile.name).trim().toLowerCase();
}

function byId<T extends { id: string }>(a: T[] = [], b: T[] = []): T[] {
  return Array.from(new Map([...a, ...b].map((item) => [item.id, item])).values());
}

function mergeSnapshots(remote: Partial<AppSnapshot> | null, local: AppSnapshot): AppSnapshot {
  const key = profileKey(local.profile);
  return {
    profile: local.profile,
    profiles: {
      ...(remote?.profiles || {}),
      ...(key && local.profile ? { [key]: local.profile } : {}),
    },
    phase: local.phase,
    processes: byId(remote?.processes, local.processes),
    systems: byId(remote?.systems, local.systems),
    notifications: byId(remote?.notifications, local.notifications),
    adminBroadcastLogs: byId(remote?.adminBroadcastLogs, local.adminBroadcastLogs),
    improvementItems: byId(remote?.improvementItems, local.improvementItems),
  };
}

function chunkProcesses(processes: Process[]): Process[][] {
  const chunks: Process[][] = [];
  let current: Process[] = [];
  let size = 2; // []
  for (const item of processes) {
    const piece = JSON.stringify(item);
    const extra = (current.length ? 1 : 0) + piece.length;
    if (current.length > 0 && size + extra > CELL_SAFE_CHARS) {
      chunks.push(current);
      current = [];
      size = 2;
    }
    current.push(item);
    size += extra;
  }
  chunks.push(current.length ? current : []);
  return chunks;
}

/** Prefer chunk keys when present — legacy `processes` cell is already over the write limit. */
export function assembleProcessesFromState(data: Record<string, unknown>): Process[] {
  const chunkKeys = Object.keys(data)
    .filter((k) => k.startsWith(CHUNK_PREFIX))
    .sort((a, b) => {
      const na = Number(a.slice(CHUNK_PREFIX.length)) || 0;
      const nb = Number(b.slice(CHUNK_PREFIX.length)) || 0;
      return na - nb;
    });

  if (chunkKeys.length > 0) {
    const merged: Process[] = [];
    for (const key of chunkKeys) {
      const val = data[key];
      if (Array.isArray(val)) merged.push(...(val as Process[]));
    }
    return byId([], merged.filter((p) => p && p.id));
  }

  return Array.isArray(data.processes) ? (data.processes as Process[]) : [];
}

async function parseSheetsJson(res: Response): Promise<Record<string, unknown>> {
  const data = (await res.json()) as Record<string, unknown> & { ok?: boolean; error?: string };
  if (data && data.ok === false) {
    throw new Error(data.error || 'Spreadsheet request failed');
  }
  return data;
}

export async function loadSnapshot(): Promise<Partial<AppSnapshot> | null> {
  if (!endpoint) return null;
  const res = await fetch(`${endpoint}?action=getState`, {
    method: 'GET',
    headers: stateHeaders(),
  });
  if (!res.ok) throw new Error(`Spreadsheet load failed (${res.status})`);
  const data = await parseSheetsJson(res);
  const processes = assembleProcessesFromState(data);
  return { ...(data as Partial<AppSnapshot>), processes };
}

/**
 * Persist snapshot. Processes are written as `processes__chunk__N` cells so we
 * never hit Sheets' 50k/cell cap (the root cause of "capture hilang setelah relogin").
 */
export async function saveSnapshot(snapshot: AppSnapshot): Promise<void> {
  if (!endpoint) return;
  const remote = await loadSnapshot().catch(() => null);
  const merged = mergeSnapshots(remote, snapshot);
  const chunks = chunkProcesses(merged.processes || []);

  // Do not send a monolithic `processes` array — writing that cell already fails.
  const { processes: _drop, ...rest } = merged;
  const body: Record<string, unknown> = { ...rest };
  // Always rewrite a fixed window of chunk slots so stale trailing chunks clear.
  const MAX_CHUNKS = 20;
  if (chunks.length > MAX_CHUNKS) {
    throw new Error(`Process catalogue needs ${chunks.length} chunks (max ${MAX_CHUNKS}). Contact admin.`);
  }
  for (let i = 0; i < MAX_CHUNKS; i++) {
    body[`${CHUNK_PREFIX}${i}`] = chunks[i] || [];
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: stateHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'saveState', snapshot: body }),
  });
  if (!res.ok) throw new Error(`Spreadsheet save failed (${res.status})`);
  await parseSheetsJson(res);
}
