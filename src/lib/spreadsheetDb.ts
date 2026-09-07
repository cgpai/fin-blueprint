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

/** Same-origin Postgres API (Google Sheets removed). */
const endpoint = '/api/state';

export const spreadsheetEnabled = true;

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

async function parseStateJson(res: Response): Promise<Record<string, unknown>> {
  const data = (await res.json()) as Record<string, unknown> & { ok?: boolean; error?: string };
  if (res.status === 401) throw new Error('Unauthorized');
  if (data && data.ok === false) {
    throw new Error(data.error || 'State request failed');
  }
  return data;
}

export async function loadSnapshot(): Promise<Partial<AppSnapshot> | null> {
  const res = await fetch(`${endpoint}?action=getState`, {
    method: 'GET',
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`State load failed (${res.status})`);
  const data = await parseStateJson(res);
  const processes = Array.isArray(data.processes) ? (data.processes as Process[]) : [];
  return { ...(data as Partial<AppSnapshot>), processes };
}

export async function saveSnapshot(snapshot: AppSnapshot): Promise<void> {
  const remote = await loadSnapshot().catch(() => null);
  const merged = mergeSnapshots(remote, snapshot);
  const res = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveState', snapshot: merged }),
  });
  if (!res.ok) throw new Error(`State save failed (${res.status})`);
  await parseStateJson(res);
}

export async function loginRequest(username: string, password: string): Promise<UserProfile> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string; profile?: UserProfile };
  if (!res.ok || !data.ok || !data.profile) {
    throw new Error(data.error || 'Invalid credentials');
  }
  return data.profile;
}

export async function logoutRequest(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function meRequest(): Promise<UserProfile | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { ok?: boolean; profile?: UserProfile };
  return data.ok && data.profile ? data.profile : null;
}
