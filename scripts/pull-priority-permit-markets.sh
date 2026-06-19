#!/usr/bin/env bash
set -u -o pipefail
cd "$(dirname "$0")/.."

LOG_DIR="artifacts/priority-permit-pulls"
mkdir -p "$LOG_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$LOG_DIR/$STAMP.log"

run_pull() {
  local label="$1"
  shift
  printf '== %s ==\n' "$label" | tee -a "$LOG" >&2
  if "$@" >> "$LOG" 2>&1; then
    printf 'ok %s\n' "$label" | tee -a "$LOG" >&2
    return 0
  fi
  local code=$?
  printf 'warn %s failed with exit %s; continuing priority stack\n' "$label" "$code" | tee -a "$LOG" >&2
  return 0
}

# Pull order follows Okeito's permit priority stack: TN → inland FL → AZ → NC → TX.
run_pull "TN Knoxville KGIS permits/parcels" node scripts/adapters/knoxville-kgis-public-leads.mjs
run_pull "FL inland Polk Accela builders" python3 scripts/adapters/polk-accela-permit-builders.py
run_pull "AZ Maricopa weekly permit builders" python3 scripts/adapters/maricopa-xlsx-permit-builders.py
run_pull "NC Raleigh/Wake ArcGIS builders" node scripts/adapters/raleigh-arcgis-permit-builders.mjs
run_pull "TX Austin Socrata builders" node scripts/adapters/austin-socrata-permit-builders.mjs
run_pull "TX San Antonio CKAN builders" node scripts/adapters/san-antonio-ckan-permit-builders.mjs

printf 'Priority permit pull log: %s\n' "$LOG" >&2
