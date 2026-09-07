/**
 * Minimal session auth: scrypt+salt passwords, HMAC httpOnly cookie.
 * Legacy SHA-256 hex hashes still verify once, then upgrade in-place.
 */
import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { getState, saveState } from './pgState';

const COOKIE = 'bp_session';
const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 7;

type ProfileRow = {
  name: string;
  email?: string;
  role: string;
  passwordHash: string;
  createdAt?: string;
  manualRoleOverride?: string;
};

function secret(): string {
  const s = (process.env.AUTH_TOKEN_SECRET || '').trim();
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_TOKEN_SECRET is required in production');
    }
    return 'dev-only-insecure-secret';
  }
  return s;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt:${salt.toString('base64url')}:${hash.toString('base64url')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith('scrypt:')) {
    const [, saltB64, hashB64] = stored.split(':');
    if (!saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, 'base64url');
    const expected = Buffer.from(hashB64, 'base64url');
    const actual = crypto.scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1 });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }
  // Legacy unsalted SHA-256 hex (Sheets era)
  const legacy = crypto.createHash('sha256').update(password).digest('hex');
  const a = Buffer.from(legacy, 'utf8');
  const b = Buffer.from(stored, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function loginId(p: ProfileRow): string {
  return (p.email || p.name.replace(/\s+/g, '').toLowerCase()).trim().toLowerCase();
}

function signSession(username: string): string {
  const exp = Date.now() + SESSION_DAYS * DAY_MS;
  const payload = Buffer.from(JSON.stringify({ u: username, exp }), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function readSession(req: Request): string | null {
  const raw = req.headers.cookie || '';
  const match = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expect = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u?: string; exp?: number };
    if (!data.u || !data.exp || data.exp < Date.now()) return null;
    return data.u;
  } catch {
    return null;
  }
}

function setSessionCookie(res: Response, username: string) {
  const token = signSession(username);
  const secure = process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true';
  const parts = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response) {
  const secure = process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true';
  const parts = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function publicProfile(p: ProfileRow) {
  return {
    name: p.name,
    email: p.email,
    role: p.role,
    createdAt: p.createdAt,
    manualRoleOverride: p.manualRoleOverride,
    passwordHash: '',
  };
}

async function findProfile(username: string): Promise<{ key: string; profile: ProfileRow } | null> {
  const state = await getState();
  const profiles = (state.profiles || {}) as Record<string, ProfileRow>;
  const want = username.trim().toLowerCase();
  for (const [key, profile] of Object.entries(profiles)) {
    if (!profile) continue;
    if (key === want || loginId(profile) === want) return { key, profile };
  }
  return null;
}

async function upgradePasswordHash(key: string, profile: ProfileRow, password: string) {
  const nextHash = hashPassword(password);
  const state = await getState();
  const profiles = { ...((state.profiles || {}) as Record<string, ProfileRow>) };
  profiles[key] = { ...profile, passwordHash: nextHash };
  await saveState({ profiles });
}

/** Simple login throttle: 10 tries / IP / 10 min. */
const loginHits = new Map<string, number[]>();
function allowLogin(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const hits = (loginHits.get(ip) || []).filter((t) => now - t < windowMs);
  if (hits.length >= 10) {
    loginHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  loginHits.set(ip, hits);
  return true;
}

export async function handleLogin(req: Request, res: Response) {
  const ip = String(req.ip || req.socket.remoteAddress || 'unknown');
  if (!allowLogin(ip)) {
    res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.' });
    return;
  }
  const username = String(req.body?.username || req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    res.status(400).json({ ok: false, error: 'Username and password required' });
    return;
  }
  const found = await findProfile(username);
  // Constant-ish failure message (no user enumeration)
  if (!found || !verifyPassword(password, found.profile.passwordHash)) {
    res.status(401).json({ ok: false, error: 'Invalid credentials' });
    return;
  }
  if (!found.profile.passwordHash.startsWith('scrypt:')) {
    await upgradePasswordHash(found.key, found.profile, password);
  }
  setSessionCookie(res, found.key);
  res.json({ ok: true, profile: publicProfile(found.profile) });
}

export async function handleLogout(_req: Request, res: Response) {
  clearSessionCookie(res);
  res.json({ ok: true });
}

export async function handleMe(req: Request, res: Response) {
  const user = readSession(req);
  if (!user) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  const found = await findProfile(user);
  if (!found) {
    clearSessionCookie(res);
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  res.json({ ok: true, profile: publicProfile(found.profile) });
}

export function requireSession(req: Request, res: Response): string | null {
  const user = readSession(req);
  if (!user) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return null;
  }
  return user;
}

export function redactState(state: Record<string, unknown>): Record<string, unknown> {
  const out = { ...state };
  if (out.profiles && typeof out.profiles === 'object') {
    const profiles: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(out.profiles as Record<string, ProfileRow>)) {
      profiles[k] = v && typeof v === 'object' ? publicProfile(v) : v;
    }
    out.profiles = profiles;
  }
  if (out.profile && typeof out.profile === 'object') {
    out.profile = publicProfile(out.profile as ProfileRow);
  }
  return out;
}
