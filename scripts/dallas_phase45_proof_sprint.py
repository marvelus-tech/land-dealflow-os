#!/usr/bin/env python3
"""Create a Dallas Phase 4.5 proof sprint packet for the strongest rows.

This does not mark utility, electric/gas, plat, or builder-zoning proof as passed.
It packages exact evidence tasks and source URLs so an operator can verify the
buyer's hard criteria before any owner contact enrichment.
"""

from __future__ import annotations

import csv
import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "data" / "real" / "dallas-buyer-752xx"
PHASE4 = BASE / "phase4_utility_plat_gate.json"
OUT_JSON = BASE / "phase45_top12_proof_sprint.json"
OUT_CSV = BASE / "phase45_top12_proof_sprint.csv"
OUT_MD = BASE / "phase45_top12_proof_sprint.md"
BUYER_DRAFT = BASE / "phase45_builder_zoning_acceptance_draft.md"
PROOF_LOG = BASE / "phase45_proof_collection_log.json"

CITY_PARCEL_QUERY = "https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query"
ZONING_LAYER = "https://gis.dallascityhall.com/arcgis/rest/services/sdc_public/Zoning/MapServer/15"
FEMA_LAYER = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28"
DC_PUBLIC_SEARCH = "https://dallas.tx.publicsearch.us/"
DWU = "https://dallascityhall.com/departments/waterutilities/Pages/default.aspx"
ONCOR_SERVICE = "https://www.oncor.com/"
ATMOS_SERVICE = "https://www.atmosenergy.com/"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get_json(url: str, params: dict) -> dict:
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params), headers={"User-Agent": "LandFlipOS/0.1 phase45-proof-sprint"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def parcel_query_url(acct: str) -> str:
    return CITY_PARCEL_QUERY + "?" + urllib.parse.urlencode({
        "f": "json",
        "where": f"ACCT = '{acct}'",
        "outFields": "*",
        "returnGeometry": "false",
    })


def dcad_url(acct: str) -> str:
    return f"https://www.dallascad.org/AcctDetail.aspx?ID={acct}"


def public_search_hint(row: dict) -> str:
    # Dallas County site does not expose a stable simple direct-search URL; keep base + exact terms.
    terms = [row.get("legalDescription", "").split("|")[0].strip(), row.get("propertyAddress", ""), row.get("ownerName", "")]
    return " | ".join(t for t in terms if t)


def sprint_score(row: dict) -> tuple:
    zoning = str(row.get("zoning") or "")
    owner = str(row.get("ownerName") or "").strip()
    standard_zoning = zoning.startswith(("R-", "R-10", "R-7.5", "R-5"))
    not_pd_or_th = "PD" not in zoning and not zoning.startswith("TH")
    has_owner = bool(owner)
    has_improvement = float(row.get("improvementValue") or 0) > 0
    individual_owner = not any(token in owner.upper() for token in [" LLC", " INC", " FUND", " BORROWER", " BUILDERS"])
    # sort descending on clean-proof factors, then lot size and original rank
    return (
        standard_zoning,
        not_pd_or_th,
        has_owner,
        has_improvement,
        individual_owner,
        float(row.get("lotSqft") or 0),
        -int(row.get("rank") or 9999),
    )


def load_rows() -> list[dict]:
    rows = json.loads(PHASE4.read_text())["rows"]
    eligible = [r for r in rows if r.get("floodStatus") == "pass-outside-sfha" and r.get("addressValidationStatus") == "valid-address-geocoder-high-confidence"]
    return sorted(eligible, key=sprint_score, reverse=True)[:12]


def load_proof_overlay() -> dict[str, dict]:
    if not PROOF_LOG.exists():
        return {}
    data = json.loads(PROOF_LOG.read_text())
    return {str(row.get("parcelId") or ""): row for row in data.get("rows", []) if row.get("parcelId")}


def enrich_row(row: dict, sprint_rank: int, proof_overlay: dict[str, dict] | None = None) -> dict:
    acct = row.get("parcelId", "")
    city_attrs = {}
    try:
        data = get_json(CITY_PARCEL_QUERY, {"f": "json", "where": f"ACCT = '{acct}'", "outFields": "*", "returnGeometry": "false"})
        city_attrs = data.get("features", [{}])[0].get("attributes", {}) if data.get("features") else {}
    except Exception as exc:
        city_attrs = {"queryError": repr(exc)}
    row = dict(row)
    row.update({
        "sprintRank": sprint_rank,
        "phase45Status": "proof-sprint-needs-operator-verification",
        "phase45Decision": "hold",
        "cityParcelQueryUrl": parcel_query_url(acct),
        "dcadAccountUrl": dcad_url(acct),
        "dallasCountyPublicSearchUrl": DC_PUBLIC_SEARCH,
        "dallasCountySearchTerms": public_search_hint(row),
        "dallasWaterUtilitiesUrl": DWU,
        "oncorServiceUrl": ONCOR_SERVICE,
        "atmosServiceUrl": ATMOS_SERVICE,
        "zoningLayerUrl": ZONING_LAYER,
        "femaLayerUrl": FEMA_LAYER,
        "cityParcelProofStatus": "public-api-pass" if city_attrs.get("ACCT") == acct else "needs-review",
        "cityParcelAreaFeet": city_attrs.get("AREA_FEET"),
        "cityParcelPropertyClass": city_attrs.get("PROP_CL"),
        "cityParcelLegal1": city_attrs.get("LEGAL_1"),
        "cityParcelLegal2": city_attrs.get("LEGAL_2"),
        "proofTasks": [
            "Open City parcel/DCAD links and confirm parcel, owner, lot size, Dallas city parcel, and legal description match.",
            "Use Dallas County Official Public Records; search subdivision/legal terms and owner/address; capture recorded plat/replat or legal-lot evidence URL/document reference.",
            "Confirm Dallas Water Utilities water/sewer tap, prior active service, or official availability; capture URL/record reference/name/date. Do not pass from CCN/service-area alone.",
            "Confirm electric/gas service or provider/meter/availability via Oncor/Atmos or official provider source; capture URL/record reference/name/date.",
            "Ask buyer to accept this zoning/lot profile before owner enrichment; capture written/call-note proof.",
        ],
        "doNotPromoteUntil": [
            "waterSewerProofStatus = pass",
            "electricGasProofStatus = pass",
            "recordedPlatProofStatus = pass",
            "zoningBuilderAcceptedStatus = pass",
            "operatorDecision = pass",
        ],
    })
    overlay = (proof_overlay or {}).get(str(acct), {})
    if overlay:
        row.update({key: value for key, value in overlay.items() if key != "parcelId"})
    return row


def write_csv(rows: list[dict]):
    fields = [
        "sprintRank", "rank", "phase45Status", "propertyAddress", "propertyZip", "parcelId", "ownerName", "lotSqft", "zoning", "floodStatus",
        "cityParcelProofStatus", "cityParcelAreaFeet", "cityParcelPropertyClass", "cityParcelLegal1", "cityParcelLegal2",
        "waterSewerProofStatus", "waterSewerProofUrl", "electricGasProofStatus", "electricGasProofUrl", "recordedPlatProofStatus", "recordedPlatProofUrl",
        "publicZoningProofStatus", "publicZoningProofUrl", "publicZoningProofSummary", "zoningBuilderAcceptedStatus", "zoningBuilderAcceptedProof", "operatorDecision", "operatorNotes", "dcadAccountUrl", "cityParcelQueryUrl", "dallasCountyPublicSearchUrl", "dallasCountySearchTerms",
    ]
    with OUT_CSV.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def write_md(rows: list[dict], generated_at: str):
    lines = [
        "# Phase 4.5 Top-12 Proof Sprint — Dallas 752xx",
        "",
        f"Generated: {generated_at}",
        "",
        "Purpose: verify the buyer's hard criteria before skip-tracing any owner.",
        "",
        "## Zero-fabrication rules",
        "",
        "- Do not mark utilities/taps verified from old structures, CCN/service-area context, or assumptions.",
        "- Do not mark recorded plat/legal-lot verified from DCAD legal text alone; capture Dallas County Official Public Records or equivalent legal proof.",
        "- Do not enrich/call owners until a row passes water/sewer, electric/gas, recorded plat, builder zoning acceptance, and operator decision.",
        "- Top 12 is a sprint view only. The complete Phase 4 queue remains 68 rows.",
        "",
        "## Pass fields to fill",
        "",
        "- `waterSewerProofStatus` + `waterSewerProofUrl`",
        "- `electricGasProofStatus` + `electricGasProofUrl`",
        "- `recordedPlatProofStatus` + `recordedPlatProofUrl`",
        "- `zoningBuilderAcceptedStatus` + `zoningBuilderAcceptedProof`",
        "- `operatorDecision` + `operatorNotes`",
        "",
        "## Sprint rows",
        "",
    ]
    for row in rows:
        lines.extend([
            f"### {row['sprintRank']}. {row.get('propertyAddress')}, {row.get('propertyZip')}",
            "",
            f"- APN: `{row.get('parcelId')}`",
            f"- Owner of record: {row.get('ownerName') or 'unknown'}",
            f"- Lot: {float(row.get('lotSqft') or 0):,.0f} sq ft",
            f"- Zoning: `{row.get('zoning')}`",
            f"- Flood: {row.get('floodStatus')}",
            f"- City parcel proof: {row.get('cityParcelProofStatus')} / {row.get('cityParcelPropertyClass')}",
            f"- Public zoning proof: {row.get('publicZoningProofStatus') or 'needs-proof'} — {row.get('publicZoningProofSummary') or ''}",
            f"- Recorded plat/legal-lot proof: {row.get('recordedPlatProofStatus') or 'needs-proof'} — {row.get('recordedPlatProofSummary') or ''}",
            f"- Water/sewer proof: {row.get('waterSewerProofStatus')}",
            f"- Electric/gas proof: {row.get('electricGasProofStatus')}",
            f"- Legal: {row.get('legalDescription')}",
            f"- DCAD: {row.get('dcadAccountUrl')}",
            f"- City parcel API: {row.get('cityParcelQueryUrl')}",
            f"- Dallas County records: {row.get('dallasCountyPublicSearchUrl')}",
            f"- Search terms: `{row.get('dallasCountySearchTerms')}`",
            f"- DWU: {row.get('dallasWaterUtilitiesUrl')}",
            f"- Oncor: {row.get('oncorServiceUrl')}",
            f"- Atmos: {row.get('atmosServiceUrl')}",
            "- Decision: `pass / fail / hold`",
            "- Proof notes:",
            "",
        ])
    OUT_MD.write_text("\n".join(lines) + "\n")


def write_buyer_draft(rows: list[dict]):
    lines = [
        "# Builder zoning / lot acceptance draft — Dallas proof sprint",
        "",
        "Subject: Quick fit check — Dallas 752xx lots before I contact owners",
        "",
        "Hi [Name],",
        "",
        "I have a short Dallas 752xx batch that appears to match the public-record side of your criteria: 8,000+ sq ft, outside mapped SFHA, Dallas city parcel match, and standard residential zoning shown below. Before I spend time verifying utility/tap + plat details and then contacting owners, can you confirm which zoning/lot profiles are acceptable?",
        "",
        "Rows for quick acceptance:",
        "",
    ]
    for row in rows:
        lines.append(f"- {row.get('propertyAddress')}, {row.get('propertyZip')} — {float(row.get('lotSqft') or 0):,.0f} sf — {row.get('zoning')} — APN {row.get('parcelId')}")
    lines.extend([
        "",
        "Questions:",
        "",
        "1. Are R-10(A) and R-5(A) lots acceptable for your current Dallas buy box?",
        "2. Any minimum frontage/depth or lot-shape deal killers?",
        "3. Should I exclude LLC/investor-owned records or are those still worth approaching?",
        "4. If utilities and recorded plat check out, should I send you the first verified 5-pack before owner outreach or after seller pricing?",
        "",
        "I will not represent these as verified until utility/tap and recorded plat proof are attached.",
    ])
    BUYER_DRAFT.write_text("\n".join(lines) + "\n")


def main():
    generated_at = now_iso()
    proof_overlay = load_proof_overlay()
    rows = [enrich_row(row, idx, proof_overlay) for idx, row in enumerate(load_rows(), 1)]
    OUT_JSON.write_text(json.dumps({
        "generatedAt": generated_at,
        "market": "dallas-buyer-752xx",
        "phase": "4.5-top12-proof-sprint",
        "completePhase4Count": 68,
        "sprintCount": len(rows),
        "status": "operator-proof-needed-before-owner-enrichment",
        "rows": rows,
    }, indent=2, ensure_ascii=False))
    write_csv(rows)
    write_md(rows, generated_at)
    write_buyer_draft(rows)
    print(json.dumps({"sprintRows": len(rows), "wrote": [str(p.relative_to(ROOT)) for p in [OUT_JSON, OUT_CSV, OUT_MD, BUYER_DRAFT]]}, indent=2))


if __name__ == "__main__":
    main()
