#!/usr/bin/env python3
"""Land offer calculator for LandFlip OS.

Phase 1 static calculator engine: file-in / file-out only. No UI, no texting,
no lead promotion. It consumes operator/source-provided parcel rows plus a buy-box
reference and returns offer packet JSON with explicit blockers instead of
fabricating missing values.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

RISK_ADJUSTMENTS = [
    ("flood-zone", "Flood zone", 0.15, ("floodZone", "inFloodZone", "femaFloodZone", "flood"), "Flood-zone discount from calculator guardrail."),
    ("steep-slope", "Steep slope", 0.10, ("steepSlope", "slope", "slopeRisk"), "Slope discount from calculator guardrail."),
    ("busy-street", "Busy street", 0.08, ("busyStreet", "mainRoad", "trafficExposure"), "Street-exposure discount from calculator guardrail."),
    ("no-park-nearby", "No park nearby", 0.03, ("parkNearby", "nearPark"), "Minor location discount from calculator guardrail."),
]

TRUE_VALUES = {"yes", "y", "true", "1", "present", "high", "major", "on"}
FALSE_VALUES = {"no", "n", "false", "0", "none", "low", "clear", "off"}
ACCESS_BLOCKER_RE = re.compile(r"landlocked|no\s+road|no\s+access|access\s+blocked", re.I)
ZIP_RE = re.compile(r"\b\d{5}\b")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def money(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        parsed = float(value)
        return parsed if math.isfinite(parsed) and parsed >= 0 else None
    if isinstance(value, str):
        cleaned = re.sub(r"[^0-9.\-]", "", value)
        if not cleaned or cleaned in {"-", "."}:
            return None
        try:
            parsed = float(cleaned)
        except ValueError:
            return None
        return parsed if math.isfinite(parsed) and parsed >= 0 else None
    return None


def first_present(row: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return row[key]
    return None


def boolish(value: Any) -> bool | None:
    if value is True:
        return True
    if value is False or value is None or value == "":
        return False if value is False else None
    normalized = str(value).strip().lower()
    if normalized in TRUE_VALUES:
        return True
    if normalized in FALSE_VALUES:
        return False
    return None


def number(value: Any) -> float | None:
    parsed = money(value)
    return parsed


def round_to_nearest(value: float | None, increment: int) -> int | None:
    if value is None or not math.isfinite(value) or value <= 0:
        return None
    return int(round(value / increment) * increment)


def normalize_zip(row: dict[str, Any]) -> str:
    direct = first_present(row, "zip", "propertyZip", "postalCode", "addressZip")
    if direct:
        match = ZIP_RE.search(str(direct))
        if match:
            return match.group(0)
    address = first_present(row, "address", "propertyAddress", "siteAddress") or ""
    match = ZIP_RE.search(str(address))
    return match.group(0) if match else ""


def normalize_parcels(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        for key in ("parcels", "rows", "items"):
            rows = payload.get(key)
            if isinstance(rows, list):
                return [row for row in rows if isinstance(row, dict)]
        return [payload]
    raise ValueError("Parcel JSON must be an object, a list, or an object with parcels/rows/items.")


def load_parcels(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".csv":
        with path.open(newline="") as handle:
            return [dict(row) for row in csv.DictReader(handle)]
    return normalize_parcels(read_json(path))


def normalize_buy_boxes(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        rows = payload.get("buyBoxes") or payload.get("buyBoxReference") or payload.get("rows")
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]
    raise ValueError("Buy-box reference JSON must be a list or an object with buyBoxes/buyBoxReference/rows.")


def load_buy_boxes(path: Path) -> list[dict[str, Any]]:
    return normalize_buy_boxes(read_json(path))


def match_buy_box(parcel: dict[str, Any], buy_boxes: list[dict[str, Any]]) -> dict[str, Any] | None:
    parcel_zip = normalize_zip(parcel)
    for box in buy_boxes:
        if str(box.get("zip") or box.get("postalCode") or "") == parcel_zip:
            return box
    return None


def adjustment_applies(parcel: dict[str, Any], key: str, field_names: tuple[str, ...]) -> bool:
    if key == "steep-slope":
        raw = first_present(parcel, *field_names)
        if raw is None:
            return False
        parsed = boolish(raw)
        if parsed is not None:
            return parsed
        return bool(re.search(r"steep|severe|major|high", str(raw), re.I))
    if key == "no-park-nearby":
        raw = first_present(parcel, *field_names)
        parsed = boolish(raw)
        return parsed is False
    raw = first_present(parcel, *field_names)
    parsed = boolish(raw)
    return parsed is True


def build_offer_packet(
    parcel: dict[str, Any],
    buy_boxes: list[dict[str, Any]],
    *,
    offer_ratio: float,
    fee_ratio: float,
    sms_rounding: int,
) -> dict[str, Any]:
    matched = match_buy_box(parcel, buy_boxes)
    parcel_zip = normalize_zip(parcel)
    acres = number(first_present(parcel, "acres", "acreage", "lotAcres", "lotSizeAcres"))
    manual_target = money(first_present(parcel, "manualBuilderTarget", "builderTargetOverride", "builderTarget"))
    buyer_target = money(first_present(parcel, "buyerMaxPrice", "buyerTarget", "buyerPrice"))

    reference_acres = number(first_present(matched or {}, "referenceAcres", "referenceAcreage")) or 0.25
    base_target = money(first_present(matched or {}, "builderTarget", "builderTargetPerReferenceAcreage", "targetPrice"))
    builder_target: float | None = manual_target or buyer_target
    if builder_target is None and matched and acres and base_target:
        builder_target = round(base_target * (acres / reference_acres))

    adjustments: list[dict[str, Any]] = []
    for key, label, percent, fields, reason in RISK_ADJUSTMENTS:
        if adjustment_applies(parcel, key, fields):
            adjustments.append({"key": key, "label": label, "percent": percent, "reason": reason})

    total_adjustment_pct = sum(float(row["percent"]) for row in adjustments)
    risk_adjusted_target: int | None = None
    suggested_offer: int | None = None
    assignment_price: int | None = None
    projected_fee: int | None = None
    sms_price: int | None = None
    if builder_target:
        risk_adjusted_target = int(round(builder_target * max(0, 1 - total_adjustment_pct)))
        suggested_offer = int(round(risk_adjusted_target * offer_ratio))
        assignment_price = risk_adjusted_target
        projected_fee = int(round(assignment_price * fee_ratio))
        sms_price = round_to_nearest(suggested_offer, sms_rounding)

    blockers: list[str] = []
    if not matched and manual_target is None and buyer_target is None:
        blockers.append("No matching ZIP buy box or builder target.")
    if acres is None and manual_target is None and buyer_target is None:
        blockers.append("Acreage missing, so ZIP math cannot scale.")
    access_value = str(first_present(parcel, "roadAccess", "access", "accessNotes", "flags") or "")
    if ACCESS_BLOCKER_RE.search(access_value):
        blockers.append("Access blocker requires manual review.")

    confidence = "manual-review" if blockers else ("medium-high" if manual_target or buyer_target else "medium")
    next_action = "manual-review" if blockers else "review-offer-math"

    parcel_id = str(first_present(parcel, "parcelId", "apn", "id", "propertyId") or "").strip()
    address = str(first_present(parcel, "address", "propertyAddress", "siteAddress") or "").strip()
    packet = {
        "parcelId": parcel_id or None,
        "address": address or None,
        "zip": parcel_zip or None,
        "acres": acres,
        "mode": str(first_present(matched or {}, "mode") or first_present(parcel, "dealType") or "infill-builder-lot"),
        "buyBox": {
            "matched": bool(matched),
            "key": first_present(matched or {}, "key", "id", "zip"),
            "label": first_present(matched or {}, "label", "name"),
            "referenceAcres": reference_acres if matched else None,
            "builderTargetPerReferenceAcreage": base_target if matched else None,
            "source": first_present(matched or {}, "source") if matched else None,
        },
        "numbers": {
            "builderTarget": int(round(builder_target)) if builder_target else None,
            "riskAdjustedBuilderTarget": risk_adjusted_target,
            "suggestedSellerOffer": suggested_offer,
            "assignmentPrice": assignment_price,
            "projectedAssignmentFee": projected_fee,
            "smsPrice": sms_price,
            "offerRatio": offer_ratio,
            "feeRatio": fee_ratio,
            "totalAdjustmentPercent": round(total_adjustment_pct, 4),
        },
        "adjustments": adjustments,
        "confidence": confidence,
        "blockers": blockers,
        "nextAction": next_action,
        "sms": {
            "price": sms_price,
            "manualCopyOnly": True,
            "compliance": "No texting/blasting. Manual copy only until opt-out/compliance workflow exists.",
        },
        "zeroFabrication": True,
    }
    return packet


def run(args: argparse.Namespace) -> dict[str, Any]:
    parcels = load_parcels(Path(args.parcels))
    buy_boxes = load_buy_boxes(Path(args.buy_box_reference))
    packets = [
        build_offer_packet(
            parcel,
            buy_boxes,
            offer_ratio=args.offer_ratio,
            fee_ratio=args.fee_ratio,
            sms_rounding=args.sms_rounding,
        )
        for parcel in parcels
    ]
    payload = {
        "schema": "landflip.landOfferCalculator.v1",
        "generatedAt": now_iso(),
        "inputs": {
            "parcelCount": len(parcels),
            "buyBoxCount": len(buy_boxes),
            "offerRatio": args.offer_ratio,
            "feeRatio": args.fee_ratio,
            "smsRounding": args.sms_rounding,
        },
        "offerPackets": packets,
    }
    if args.output:
        write_json(Path(args.output), payload)
    return payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Calculate static LandFlip land offer packets from parcel JSON/CSV plus buy-box JSON.")
    parser.add_argument("--parcels", required=True, help="Parcel input JSON or CSV path.")
    parser.add_argument("--buy-box-reference", required=True, help="Buy-box reference JSON path.")
    parser.add_argument("--output", help="Offer packet JSON output path. Prints JSON to stdout when omitted.")
    parser.add_argument("--offer-ratio", type=float, default=0.85, help="Seller-offer ratio of risk-adjusted builder target. Default: 0.85")
    parser.add_argument("--fee-ratio", type=float, default=0.15, help="Assignment-fee ratio of assignment price. Default: 0.15")
    parser.add_argument("--sms-rounding", type=int, default=1000, help="SMS price rounding increment. Default: 1000")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    payload = run(args)
    if not args.output:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
