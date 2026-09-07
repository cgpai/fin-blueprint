import http from 'node:http';
import { execFileSync } from 'node:child_process';

const PSQL = '/opt/homebrew/opt/libpq@17/bin/psql';
const PORT = Number(process.env.PORT || 8787);

function q(sql) {
  return execFileSync(PSQL, ['-h', '127.0.0.1', '-d', 'fin_blueprint', '-tAc', sql], { encoding: 'utf8' }).trim();
}

function getState() {
  const keys = ['profile', 'profiles', 'phase', 'processes', 'systems', 'notifications', 'adminBroadcastLogs', 'improvementItems'];
  const out = { ok: true };
  for (const key of keys) {
    const raw = q(`SELECT value::text FROM state WHERE key='${key}'`);
    out[key] = raw ? JSON.parse(raw) : null;
  }
  return out;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const action = url.searchParams.get('action') || '';
  let body = '';
  if (req.method === 'POST') {
    for await (const chunk of req) body += chunk;
  }
  let payload = {};
  try { payload = body ? JSON.parse(body) : {}; } catch {}
  const act = action || payload.action || '';

  if (act === 'getState' || req.method === 'GET') {
    const state = getState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }
  if (act === 'saveState') {
    // read-only local test shim
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, readOnly: true }));
    return;
  }
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'unknown action' }));
});

server.listen(PORT, '127.0.0.1', () => console.log(`local-pg-shim on http://127.0.0.1:${PORT}/exec`));
