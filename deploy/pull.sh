#!/usr/bin/env bash
# Semi-auto deploy on VPS: git pull (HTTPS) + rebuild container.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only origin main
docker compose up -d --build
docker compose ps
curl -sf "http://127.0.0.1:${PORT:-3020}/api/state?action=getState" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);assert d.get('ok') is not False;print('ok processes',len(d.get('processes')or[]),'profiles',len(d.get('profiles')or{}))"
