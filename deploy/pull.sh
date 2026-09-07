#!/usr/bin/env bash
# Semi-auto deploy on VPS: git pull (HTTPS) + rebuild container.
# Origin on VPS: https://github.com/cgpai/fin-blueprint.git (mirror).
# After pushing to panparci/fin-blueprint, also: git push git@github.com:cgpai/fin-blueprint.git main
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only origin main
docker compose up -d --build
docker compose ps
# wait for app listen
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT:-3020}/api/state?action=getState" >/tmp/fin-bp-state.json; then
    python3 -c "import json;d=json.load(open('/tmp/fin-bp-state.json'));assert d.get('ok') is not False;print('ok processes',len(d.get('processes')or[]),'profiles',len(d.get('profiles')or{}))"
    exit 0
  fi
  sleep 2
done
echo 'health check failed' >&2
exit 1
