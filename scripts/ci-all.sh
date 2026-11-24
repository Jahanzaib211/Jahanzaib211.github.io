#!/usr/bin/env bash
# Every browser, on this computer. WebKit falls back to the Playwright container when its libraries are missing.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
V=$(node -p "require('playwright-core/package.json').version"); IMG="mcr.microsoft.com/playwright:v$V-noble"; ROOT=$(pwd -P); MOD=$(cd node_modules && pwd -P); fail=0
for b in chromium firefox webkit; do
  if [ "$b" != webkit ] || [ "${WEBKIT_HOST:-}" = 1 ]; then BROWSER=$b node scripts/test.mjs || fail=1
  elif docker image inspect "$IMG" >/dev/null 2>&1; then
    docker run --rm --init --ipc=host --network none -u "$(id -u):$(id -g)" -e HOME=/tmp -e BROWSER=webkit -e SHARDS="${SHARDS:-4}" -v "$ROOT:$ROOT:ro" -v "$MOD:$MOD:ro" -w "$ROOT" "$IMG" node scripts/test.mjs || fail=1
  else echo "webkit: not run. Get $IMG, or set WEBKIT_HOST=1 if this computer can start it."; fail=1; fi
done
exit $fail
