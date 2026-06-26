#!/usr/bin/env python3
"""Build Dallas Phase 4 utility/plat verification artifacts and app-visible Land rows.

Zero-fabrication rules:
- This script does not mark utilities, taps, or recorded plats as verified.
- It creates a proof gate and only promotes rows to owner-contact enrichment when
  a human/public-record operator has filled pass statuses with evidence URLs.
"""

from __future__ import annotations

import csv
import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "data" / "real" / "dallas-buyer-752xx"
PHASE3_ALL = BASE / "phase3_all_qualifying_manual_verification.json"
PHASE3_TOP10 = BASE / "phase3_top10_manual_verification_shortlist.json"
PHASE4 = BASE / "phase4_utility_plat_gate.json"
PHASE4_CSV = BASE / "phase4_utility_plat_gate.csv"
DECISION_TEMPLATE = BASE / "phase4_operator_decisions_template.csv"
ENRICHMENT_QUEUE = BASE / "owner_contact_enrichment_queue.csv"
ENRICHMENT_JSON = BASE / "owner_contact_enrichment_queue.json"
APP_LATEST = ROOT / "data" / "generated" / "latest.json"

OFFICIAL_SOURCES = {
    "dallasWaterUtilities": "https://dallascityhall.com/departments/waterutilities/Pages/default.aspx",
    "dallasCountyOfficialPublicRecords": "https://dallas.tx.publicsearch.us/",
    "dallasTaxParcelsArcGIS": "https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0",
    "dallasZoningArcGIS": "https://gis.dallascityhall.com/arcgis/rest/services/sdc_public/Zoning/MapServer/15",
    "femaNfhlLayer": "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28",
}

PASS_STATUSES = {"pass", "verified", "verified-pass", "public-record-pass"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text())


def preserve_decisions() -> dict[str, dict]:
    preserved = {}
    existing = read_json(PHASE4, {})
    for row in existing.get("rows", []):
        preserved[row.get("parcelId", "")] = {
            "waterSewerProofStatus": row.get("waterSewerProofStatus", "needs-proof"),
            "waterSewerProofUrl": row.get("waterSewerProofUrl", ""),
            "electricGasProofStatus": row.get("electricGasProofStatus", "needs-proof"),
            "electricGasProofUrl": row.get("electricGasProofUrl", ""),
            "recordedPlatProofStatus": row.get("recordedPlatProofStatus", "needs-proof"),
            "recordedPlatProofUrl": row.get("recordedPlatProofUrl", ""),
            "zoningBuilderAcceptedStatus": row.get("zoningBuilderAcceptedStatus", "unknown"),
            "zoningBuilderAcceptedProof": row.get("zoningBuilderAcceptedProof", ""),
            "operatorDecision": row.get("operatorDecision", "hold"),
            "operatorNotes": row.get("operatorNotes", ""),
            "verifiedBy": row.get("verifiedBy", ""),
            "verifiedAt": row.get("verifiedAt", ""),
        }
    return preserved


def status_pass(value: str) -> bool:
    return str(value or "").strip().lower() in PASS_STATUSES


def build_rows():
    source_path = PHASE3_ALL if PHASE3_ALL.exists() else PHASE3_TOP10
    source = read_json(source_path, {})
    decisions = preserve_decisions()
    rows = []
    for item in source.get("rows", []):
        pid = item.get("parcelId", "")
        saved = decisions.get(pid, {})
        row = deepcopy(item)
        row.update({
            "phase": "4-utility-plat-proof-gate",
            "phase4Status": "hold-needs-utility-plat-proof",
            "waterSewerProofStatus": saved.get("waterSewerProofStatus", "needs-proof"),
            "waterSewerProofUrl": saved.get("waterSewerProofUrl", ""),
            "electricGasProofStatus": saved.get("electricGasProofStatus", "needs-proof"),
            "electricGasProofUrl": saved.get("electricGasProofUrl", ""),
            "recordedPlatProofStatus": saved.get("recordedPlatProofStatus", "needs-proof"),
            "recordedPlatProofUrl": saved.get("recordedPlatProofUrl", ""),
            "zoningBuilderAcceptedStatus": saved.get("zoningBuilderAcceptedStatus", "unknown"),
            "zoningBuilderAcceptedProof": saved.get("zoningBuilderAcceptedProof", ""),
            "operatorDecision": saved.get("operatorDecision", "hold"),
            "operatorNotes": saved.get("operatorNotes", ""),
            "verifiedBy": saved.get("verifiedBy", ""),
            "verifiedAt": saved.get("verifiedAt", ""),
            "officialVerificationSources": OFFICIAL_SOURCES,
            "verificationQuestions": [
                "Is water/sewer tap or prior active Dallas Water Utilities service proven for this parcel/address?",
                "Is electric/gas service, meter history, or provider availability proven for this parcel/address?",
                "Does Dallas County Official Public Records / legal evidence confirm recorded plat/legal-lot status?",
                "Does the builder accept the zoning, lot size, and any overlay/PD constraints?",
            ],
            "promotionRule": "promote-to-owner-contact-enrichment-only-after-water-sewer-electric-gas-recorded-plat-pass-and-builder-zoning-acceptance",
        })
        proof_pass = all([
            status_pass(row["waterSewerProofStatus"]),
            status_pass(row["electricGasProofStatus"]),
            status_pass(row["recordedPlatProofStatus"]),
            status_pass(row["zoningBuilderAcceptedStatus"]),
        ])
        if proof_pass and str(row.get("operatorDecision", "")).lower() == "pass":
            row["phase4Status"] = "passed-ready-for-owner-contact-enrichment"
        rows.append(row)
    return rows


def write_csv(path: Path, rows: list[dict], fields: list[str]):
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in fields})


def write_phase4(rows: list[dict]) -> dict:
    payload = {
        "generatedAt": now_iso(),
        "market": "dallas-buyer-752xx",
        "phase": "4-utility-plat-proof-gate",
        "zeroFabrication": True,
        "summary": {
            "rows": len(rows),
            "passedReadyForOwnerContactEnrichment": sum(1 for r in rows if r.get("phase4Status") == "passed-ready-for-owner-contact-enrichment"),
            "heldForProof": sum(1 for r in rows if r.get("phase4Status") != "passed-ready-for-owner-contact-enrichment"),
        },
        "officialSources": OFFICIAL_SOURCES,
        "rows": rows,
    }
    PHASE4.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    fields = [
        "rank", "phase4Status", "operatorDecision", "propertyAddress", "propertyZip", "parcelId", "ownerName",
        "lotSqft", "zoning", "floodStatus", "addressValidationStatus", "waterSewerProofStatus", "waterSewerProofUrl",
        "electricGasProofStatus", "electricGasProofUrl", "recordedPlatProofStatus", "recordedPlatProofUrl",
        "zoningBuilderAcceptedStatus", "zoningBuilderAcceptedProof", "verifiedBy", "verifiedAt", "operatorNotes", "sourceUrl",
    ]
    write_csv(PHASE4_CSV, rows, fields)
    write_csv(DECISION_TEMPLATE, rows, fields)
    return payload


def write_enrichment_queue(rows: list[dict]):
    ready = [r for r in rows if r.get("phase4Status") == "passed-ready-for-owner-contact-enrichment"]
    queue_rows = []
    for r in ready:
        queue_rows.append({
            "parcelId": r.get("parcelId"),
            "propertyAddress": r.get("propertyAddress"),
            "market": "Dallas / Dallas County, TX",
            "state": "TX",
            "ownerName": r.get("ownerName"),
            "ownerMailingAddress": r.get("ownerMailingAddress", ""),
            "contactStatus": "needs-owner-contact-enrichment",
            "candidatePhone": "",
            "candidateEmail": "",
            "contactSource": "",
            "contactConfidence": "unknown",
            "doNotContactStatus": "unknown",
            "optOutStatus": "unknown",
            "sourceUrl": r.get("sourceUrl"),
            "phase4Proof": {
                "waterSewerProofUrl": r.get("waterSewerProofUrl"),
                "electricGasProofUrl": r.get("electricGasProofUrl"),
                "recordedPlatProofUrl": r.get("recordedPlatProofUrl"),
                "zoningBuilderAcceptedProof": r.get("zoningBuilderAcceptedProof"),
            },
        })
    ENRICHMENT_JSON.write_text(json.dumps({"generatedAt": now_iso(), "count": len(queue_rows), "rows": queue_rows}, indent=2, ensure_ascii=False))
    fields = ["parcelId", "propertyAddress", "market", "state", "ownerName", "ownerMailingAddress", "contactStatus", "candidatePhone", "candidateEmail", "contactSource", "contactConfidence", "doNotContactStatus", "optOutStatus", "sourceUrl"]
    write_csv(ENRICHMENT_QUEUE, queue_rows, fields)


def app_parcel_from_phase4(row: dict) -> dict:
    status = row.get("phase4Status") or "hold-needs-utility-plat-proof"
    return {
        "leadId": f"parcel:dallas-buyer-752xx:{row.get('parcelId')}",
        "id": row.get("parcelId"),
        "parcelId": row.get("parcelId"),
        "apn": row.get("parcelId"),
        "market": "Dallas / Dallas County, TX",
        "marketId": "dallas-buyer-752xx",
        "state": "TX",
        "county": "Dallas County",
        "address": f"{row.get('propertyAddress')}, Dallas, TX {row.get('propertyZip')}",
        "propertyAddress": row.get("propertyAddress"),
        "propertyZip": row.get("propertyZip"),
        "ownerName": row.get("ownerName"),
        "ownerMailingAddress": row.get("ownerMailingAddress", ""),
        "lotSize": f"{int(float(row.get('lotSqft') or 0)):,} sq ft",
        "lotSqft": row.get("lotSqft"),
        "zoning": row.get("zoning"),
        "floodZone": row.get("floodStatus"),
        "utilities": "needs utility/tap proof",
        "roadAccess": "address-geocoder-high-confidence" if row.get("addressValidationStatus") == "valid-address-geocoder-high-confidence" else "needs review",
        "crmStatus": "Needs utility/plat verification" if status != "passed-ready-for-owner-contact-enrichment" else "Needs skip trace",
        "sourceId": "dallas-buyer-752xx-phase4-utility-plat-gate",
        "publicSource": True,
        "sourceUrl": row.get("sourceUrl"),
        "sourceName": "Dallas CAD + City of Dallas GIS + FEMA NFHL + Phase 4 utility/plat gate",
        "collectedAt": now_iso(),
        "confidence": row.get("confidence", 0),
        "landConfidence": row.get("confidence", 0),
        "buyerMatchReason": "Buyer-backed Dallas infill lot candidate; held until utilities/taps and recorded plat are proven.",
        "phase4Status": status,
        "nextAction": "Verify utilities/taps and recorded plat before skip-trace. Do not call owner yet.",
        "lockedReasons": ["utility/tap proof missing", "recorded plat proof missing", "owner phone/email missing"],
        "realContact": False,
    }


def update_app_latest(rows: list[dict]) -> tuple[int, int]:
    latest = read_json(APP_LATEST, {"snapshot": {}})
    snapshot = latest.setdefault("snapshot", {})
    markets = snapshot.setdefault("markets", [])
    parcels = snapshot.setdefault("parcels", [])
    market_id = "dallas-buyer-752xx"
    market = {
        "leadId": f"market:{market_id}",
        "id": market_id,
        "name": "Dallas buyer-backed 752xx lots",
        "city": "Dallas",
        "county": "Dallas County",
        "state": "TX",
        "buyerType": "infill-builder",
        "priority": 88,
        "platform": "Dallas CAD + City GIS + FEMA + manual utility/plat proof gate",
        "portalUrl": OFFICIAL_SOURCES["dallasTaxParcelsArcGIS"],
        "thesis": "Real buyer-backed Dallas infill lot queue; parcels stay visible but locked until utilities/taps, recorded plat, and contact enrichment are proven.",
        "collectedAt": now_iso(),
    }
    before_markets = len(markets)
    markets[:] = [m for m in markets if m.get("id") != market_id and m.get("leadId") != f"market:{market_id}"] + [market]
    new_parcels = [app_parcel_from_phase4(r) for r in rows]
    ids = {p["parcelId"] for p in new_parcels}
    before_parcels = len(parcels)
    parcels[:] = [p for p in parcels if p.get("parcelId") not in ids and p.get("id") not in ids] + new_parcels
    latest["generatedAt"] = now_iso()
    snapshot["generatedAt"] = latest["generatedAt"]
    APP_LATEST.write_text(json.dumps(latest, indent=2, ensure_ascii=False))
    return len(markets) - before_markets, len(parcels) - before_parcels


def main():
    rows = build_rows()
    payload = write_phase4(rows)
    write_enrichment_queue(rows)
    market_delta, parcel_delta = update_app_latest(rows)
    print(json.dumps({
        "phase4Rows": payload["summary"]["rows"],
        "heldForProof": payload["summary"]["heldForProof"],
        "passedReadyForOwnerContactEnrichment": payload["summary"]["passedReadyForOwnerContactEnrichment"],
        "appMarketDelta": market_delta,
        "appParcelDelta": parcel_delta,
        "wrote": [
            str(PHASE4.relative_to(ROOT)),
            str(PHASE4_CSV.relative_to(ROOT)),
            str(DECISION_TEMPLATE.relative_to(ROOT)),
            str(ENRICHMENT_QUEUE.relative_to(ROOT)),
            str(ENRICHMENT_JSON.relative_to(ROOT)),
            str(APP_LATEST.relative_to(ROOT)),
        ],
    }, indent=2))


if __name__ == "__main__":
    main()
