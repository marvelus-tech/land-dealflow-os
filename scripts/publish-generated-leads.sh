#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

NEXT_DIR="$TMP_DIR/generated"
mkdir -p "$NEXT_DIR"

# Generate into a temp directory first. The lead engine prints a full backlog
# briefing by default; keep that out of cron stdout so Telegram only receives
# true deltas.
./scripts/pull-priority-permit-markets.sh > "$TMP_DIR/priority-permit-pulls.log" 2>&1 || true
node scripts/lead-engine.mjs --priority-permit-markets --discover-sources --output "$NEXT_DIR" > "$TMP_DIR/full-briefing.md"

DELTA_BRIEFING="$(node scripts/lead-engine-delta.mjs data/generated/latest.json "$NEXT_DIR/latest.json")"

# Silent success is intentional: in no_agent cron mode, empty stdout means no
# Telegram message. This prevents duplicate daily backlog spam.
if [[ -z "${DELTA_BRIEFING//[[:space:]]/}" ]]; then
  git checkout -- data/real >/dev/null 2>&1 || true
  exit 0
fi

mkdir -p data/generated
rm -rf data/generated/areas data/generated/queues
rm -f data/generated/latest.json data/generated/briefing.md data/generated/queues.json data/generated/areas.json data/generated/source_candidates.csv
cp -R "$NEXT_DIR"/. data/generated/

git add data/generated data/real
if git diff --cached --quiet -- data/generated data/real; then
  # Defensive guard: if the delta detector saw something but git has no
  # substantive file changes, still avoid a fake publish.
  git checkout -- data/real >/dev/null 2>&1 || true
  exit 0
fi

git commit -m "chore: publish generated lead deltas" >&2
env -u GITHUB_TOKEN -u GH_TOKEN git push origin main >&2

printf '%s\n' "$DELTA_BRIEFING"
