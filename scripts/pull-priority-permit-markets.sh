#!/usr/bin/env bash
set -u -o pipefail
cd "$(dirname "$0")/.."

LOG_DIR="artifacts/priority-permit-pulls"
mkdir -p "$LOG_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$LOG_DIR/$STAMP.log"
REQUESTED_STATES=""
DRY_RUN=0

usage() {
  cat >&2 <<'EOF'
Usage: scripts/pull-priority-permit-markets.sh [--state TN|--states TN,FL,IN] [--dry-run]

Default pulls all direct priority permit adapters in stack order.
Examples:
  scripts/pull-priority-permit-markets.sh --state TN
  scripts/pull-priority-permit-markets.sh --states FL,AZ,NC,TX
  scripts/pull-priority-permit-markets.sh --states TN,IN,HI
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --state|--states)
      REQUESTED_STATES="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n' "$1" >&2
      usage
      exit 2
      ;;
  esac
done

normalize_states() {
  printf '%s' "$1" | tr '[:lower:]' '[:upper:]' | tr ',' ' '
}

state_enabled() {
  local state="$1"
  if [[ -z "$REQUESTED_STATES" ]]; then return 0; fi
  local requested
  requested=" $(normalize_states "$REQUESTED_STATES") "
  [[ "$requested" == *" $state "* ]]
}

run_pull() {
  local state="$1"
  local label="$2"
  shift 2
  if ! state_enabled "$state"; then
    printf 'skip %s (%s not requested)\n' "$label" "$state" | tee -a "$LOG" >&2
    return 0
  fi
  printf '== %s ==\n' "$label" | tee -a "$LOG" >&2
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf 'dry-run %s: %s\n' "$label" "$*" | tee -a "$LOG" >&2
    return 0
  fi
  if "$@" >> "$LOG" 2>&1; then
    printf 'ok %s\n' "$label" | tee -a "$LOG" >&2
    return 0
  fi
  local code=$?
  printf 'warn %s failed with exit %s; continuing priority stack\n' "$label" "$code" | tee -a "$LOG" >&2
  return 0
}

# Pull order follows Okeito's permit priority stack plus active buyer-signal sprints.
# States with loaded static/source-review lanes (CA/HI/ID/NV) are included by the lead engine;
# only states with direct adapters perform network refreshes here.
run_pull "TN" "TN Knoxville KGIS permits/parcels" node scripts/adapters/knoxville-kgis-public-leads.mjs
run_pull "TN" "TN Nashville/Davidson ArcGIS builders" node scripts/adapters/nashville-arcgis-permit-builders.mjs
run_pull "FL" "FL inland Polk Accela builders" python3 scripts/adapters/polk-accela-permit-builders.py
run_pull "AZ" "AZ Maricopa weekly permit builders" python3 scripts/adapters/maricopa-xlsx-permit-builders.py
run_pull "NC" "NC Raleigh/Wake ArcGIS builders" node scripts/adapters/raleigh-arcgis-permit-builders.mjs
run_pull "TX" "TX Austin Socrata builders" node scripts/adapters/austin-socrata-permit-builders.mjs
run_pull "TX" "TX San Antonio CKAN builders" node scripts/adapters/san-antonio-ckan-permit-builders.mjs
run_pull "IN" "IN Lafayette/Tippecanoe ArcGIS owner-developer permit signals" node scripts/adapters/lafayette-tippecanoe-arcgis-permit-builders.mjs

printf 'Priority permit pull log: %s\n' "$LOG" >&2
