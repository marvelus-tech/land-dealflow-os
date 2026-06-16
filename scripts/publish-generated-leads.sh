#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/lead-engine.mjs

git add data/generated
if git diff --cached --quiet -- data/generated; then
  echo "No generated lead changes to publish."
  exit 0
fi

git commit -m "chore: publish generated lead outputs"
env -u GITHUB_TOKEN -u GH_TOKEN git push origin main
