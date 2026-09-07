#!/usr/bin/env bash
# Semi-auto deploy on VPS: git pull (HTTPS) + rebuild container.
# Origin on VPS: https://github.com/cgpai/fin-blueprint.git (mirror).
# After pushing to panparci/fin-blueprint, also: git push git@github.com:cgpai/fin-blueprint.git main
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only origin main
docker compose up -d --build
docker compose ps
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT:-3020}/" >/dev/null; then
    code=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT:-3020}/api/state?action=getState" || true)
    echo "ok home=200 state=${code} (401 expected when logged out)"
    exit 0
  fi
  sleep 2
done
echo 'health check failed' >&2
exit 1
