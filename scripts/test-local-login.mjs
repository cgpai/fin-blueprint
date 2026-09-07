import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const PSQL = '/opt/homebrew/opt/libpq@17/bin/psql';
const login = process.argv[2] || 'wahyupratama';
const password = process.argv[3] || 'LocalTest123!';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
function profileLoginId(p) {
  return (p.email || p.name.replace(/\s+/g, '').toLowerCase()).trim().toLowerCase();
}

const raw = execFileSync(PSQL, ['-h','127.0.0.1','-d','fin_blueprint','-tAc',
  "SELECT value::text FROM state WHERE key='profiles'"], { encoding: 'utf8' }).trim();
const profiles = Object.values(JSON.parse(raw));
const profile = profiles.find((p) => profileLoginId(p) === login.toLowerCase());
if (!profile) {
  console.error('FAIL: user not found', login);
  process.exit(1);
}
const hash = hashPassword(password);
const ok = profile.passwordHash === hash;
console.log(JSON.stringify({
  ok,
  login,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  passwordCheck: ok ? 'MATCH' : 'MISMATCH',
  processes: Number(execFileSync(PSQL, ['-h','127.0.0.1','-d','fin_blueprint','-tAc',
    "SELECT jsonb_array_length(value) FROM state WHERE key='processes'"], { encoding:'utf8' }).trim()),
  systems: Number(execFileSync(PSQL, ['-h','127.0.0.1','-d','fin_blueprint','-tAc',
    "SELECT jsonb_array_length(value) FROM state WHERE key='systems'"], { encoding:'utf8' }).trim()),
  profileCount: profiles.length,
}, null, 2));
process.exit(ok ? 0 : 2);
