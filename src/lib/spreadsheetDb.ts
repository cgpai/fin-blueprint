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
/** Reject redacted/placeholder values (e.g. Vercel "sensitive" env pulled as `[SENSITIVE]`). */
const endpoint =
  rawEndpoint &&
  rawEndpoint !== '[SENSITIVE]' &&
  /^https?:\/\//i.test(rawEndpoint)
    ? rawEndpoint
    : undefined;

export const spreadsheetEnabled = Boolean(endpoint);

export function getSheetsEndpoint(): string | undefined {
  return endpoint;
}

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

export async function loadSnapshot(): Promise<Partial<AppSnapshot> | null> {
  if (!endpoint) return null;
  const res = await fetch(`${endpoint}?action=getState`, { method: 'GET' });
  if (!res.ok) throw new Error(`Spreadsheet load failed (${res.status})`);
  const data = (await res.json()) as Partial<AppSnapshot> & { ok?: boolean; error?: string };
  if (data && data.ok === false) {
    throw new Error(data.error || 'Spreadsheet getState failed');
  }
  return data;
}

export async function saveSnapshot(snapshot: AppSnapshot): Promise<void> {
  if (!endpoint) return;
  const merged = mergeSnapshots(await loadSnapshot().catch(() => null), snapshot);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'saveState', snapshot: merged }),
  });
  if (!res.ok) throw new Error(`Spreadsheet save failed (${res.status})`);
}
