#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-all}"
PULL_ARGS=()
DISCOVER_SOURCES=0
MODE_LABEL="all priority permit markets"

case "$MODE" in
  all|daily|legacy)
    PULL_ARGS=()
    MODE_LABEL="all priority permit markets"
    ;;
  monday-core|monday-tn|tn)
    PULL_ARGS=(--states TN,IN,HI)
    MODE_LABEL="Monday TN/IN/HI permit-signal refresh"
    ;;
  wednesday-growth|wednesday-secondary|secondary)
    PULL_ARGS=(--states FL,AZ,CA,ID)
    MODE_LABEL="Wednesday FL/AZ/CA/ID permit-signal refresh"
    ;;
  friday-west|friday-secondary)
    PULL_ARGS=(--states NC,TX,NV)
    MODE_LABEL="Friday NC/TX/NV permit-signal refresh"
    ;;
  discover|source-discovery)
    PULL_ARGS=()
    DISCOVER_SOURCES=1
    MODE_LABEL="priority permit markets with source discovery"
    ;;
  *)
    printf 'Unknown publish mode: %s\n' "$MODE" >&2
    printf 'Usage: %s [all|monday-core|wednesday-growth|friday-west|discover]\n' "$0" >&2
    exit 2
    ;;
esac

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

NEXT_DIR="$TMP_DIR/generated"
mkdir -p "$NEXT_DIR"

# Generate into a temp directory first. Keep pull logs and full backlog out of
# stdout so no-agent cron delivers only true deltas. Cadence modes reduce token
# and network waste by refreshing only the relevant direct adapters.
printf 'Lead publish mode: %s\n' "$MODE_LABEL" >&2
./scripts/pull-priority-permit-markets.sh "${PULL_ARGS[@]}" > "$TMP_DIR/priority-permit-pulls.log" 2>&1 || true
LEAD_ARGS=(--priority-permit-markets --output "$NEXT_DIR")
if [[ "$DISCOVER_SOURCES" -eq 1 ]]; then LEAD_ARGS+=(--discover-sources); fi
node scripts/lead-engine.mjs "${LEAD_ARGS[@]}" > "$TMP_DIR/full-briefing.md"

DELTA_BRIEFING="$(node scripts/lead-engine-delta.mjs data/generated/latest.json "$NEXT_DIR/latest.json")"

# Silent success is intentional: in no_agent cron mode, empty stdout means no
# Telegram message. This prevents duplicate backlog spam.
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
