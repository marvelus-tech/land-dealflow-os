#!/usr/bin/env python3
"""Vacant land comp confidence engine for LandFlip OS.

JSON-in / JSON-out underwriting pass built from the Wiener Bros vacant-land
comping method plus LandFlip zero-fabrication guardrails.

This script does not fetch Zillow, Redfin, owner contacts, buyer prices, or comps.
It consumes operator/source-provided values and marks missing evidence as unknown
or manual-review instead of inventing numbers.
"""

from __future__ import annotations

import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from typing import Any

CONFIDENCE_ORDER = {"manual-review": 0, "low": 1, "medium": 2, "high": 3}
HARD_RISK_VALUES = {"fail", "failed", "landlocked", "no-access", "no road access", "blocked", "reject"}
PASS_RISK_VALUES = {"pass", "passed", "verified", "ok", "clear", "yes"}
MANUAL_NEXT_ACTIONS = {"manual-review", "reject", "collect-comps", "capture-buyer-price"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def money(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if math.isfinite(float(value)) and float(value) >= 0:
            return float(value)
        return None
    if isinstance(value, str):
        cleaned = re.sub(r"[^0-9.\-]", "", value)
        if not cleaned or cleaned in {"-", "."}:
            return None
        try:
            parsed = float(cleaned)
        except ValueError:
            return None
        if math.isfinite(parsed) and parsed >= 0:
            return parsed
    return None


def round_to(value: float | None, step: int = 500) -> int | None:
    if value is None or not math.isfinite(value):
        return None
    if value <= 0:
        return None
    return int(round(value / step) * step)


def pctile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    rank = (len(ordered) - 1) * percentile
    low = math.floor(rank)
    high = math.ceil(rank)
    if low == high:
        return ordered[low]
    return ordered[low] + (ordered[high] - ordered[low]) * (rank - low)


def comp_prices(parcel: dict[str, Any], bucket: str) -> list[float]:
    comps = (parcel.get("comps") or {}).get(bucket) or []
    prices: list[float] = []
    for comp in comps:
        if isinstance(comp, dict):
            parsed = money(comp.get("price") or comp.get("soldPrice") or comp.get("ask") or comp.get("listPrice"))
        else:
            parsed = money(comp)
        if parsed is not None:
            prices.append(parsed)
    return prices


def verified_buyer_price(parcel: dict[str, Any]) -> tuple[float | None, str]:
    buy_box = parcel.get("buyerBuyBox") or parcel.get("buyer") or {}
    price = money(
        buy_box.get("maxPrice")
        or buy_box.get("maxLotPrice")
        or buy_box.get("buyerMaxPrice")
        or parcel.get("buyerMaxPrice")
    )
    quote_source = str(buy_box.get("quoteSource") or buy_box.get("source") or parcel.get("buyerQuoteSource") or "").strip().lower()
    verified_flag = buy_box.get("verified")
    if isinstance(verified_flag, bool):
        verified = verified_flag
    else:
        verified = quote_source in {"call-note", "call", "email", "text", "public-page", "operator-verified", "verified-record"}
    matches = buy_box.get("matchesParcel")
    if matches is False:
        return None, "Buyer quote exists but is marked as not matching this parcel."
    if price is None:
        return None, "No verified buyer/builder price supplied."
    if not verified:
        return None, "Buyer/builder price supplied but quote source is not verified."
    return price, "Verified buyer/builder buy price supplied."


def estimate_value(parcel: dict[str, Any]) -> float | None:
    signals = parcel.get("estimateSignals") or parcel.get("estimates") or {}
    return money(signals.get("redfinEstimate") or signals.get("estimateValue") or parcel.get("redfinEstimate"))


def parcel_risk_blockers(parcel: dict[str, Any]) -> tuple[list[str], list[str]]:
    risks = parcel.get("parcelRisk") or {}
    blockers: list[str] = []
    unknowns: list[str] = []
    for key in ["roadAccess", "utilities", "flood", "wetlands", "zoning", "buildability", "recordedPlat", "title"]:
        raw = risks.get(key)
        if raw is None or raw == "":
            continue
        value = str(raw).strip().lower()
        if value in HARD_RISK_VALUES or any(token in value for token in ["landlocked", "no access", "fail", "blocked"]):
            blockers.append(f"{key}: {raw}")
        elif value in {"unknown", "needed", "needs-proof", "partial", "review"}:
            unknowns.append(f"{key}: {raw}")
    return blockers, unknowns


def build_exit_candidates(
    parcel: dict[str, Any],
    closing_cost_buffer: float,
    active_sale_factor: float,
    realtor_fee_pct: float,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    diagnostics: dict[str, Any] = {}

    buyer_price, buyer_reason = verified_buyer_price(parcel)
    diagnostics["buyerPriceReason"] = buyer_reason
    if buyer_price is not None:
        candidates.append({"source": "verified-buyer-price", "value": buyer_price, "weight": "strong"})

    active = comp_prices(parcel, "active")
    pending = comp_prices(parcel, "pending")
    sold = comp_prices(parcel, "sold")
    diagnostics["compCounts"] = {"active": len(active), "pending": len(pending), "sold": len(sold)}

    if active:
        active_low = min(active)
        active_adjusted = active_low * active_sale_factor
        active_seller_net = active_adjusted - (active_low * realtor_fee_pct) - closing_cost_buffer
        diagnostics["activeLowestAsk"] = round(active_low, 2)
        diagnostics["activeAdjustedExitLow"] = round(active_adjusted, 2)
        diagnostics["activeSellerNetEstimate"] = round(max(active_seller_net, 0), 2)
        candidates.append({"source": "active-adjusted-low", "value": active_adjusted, "weight": "medium"})

    if pending:
        pending_low = min(pending)
        diagnostics["pendingLow"] = round(pending_low, 2)
        candidates.append({"source": "pending-low", "value": pending_low, "weight": "medium"})

    if sold:
        sold_p10 = pctile(sold, 0.10)
        sold_low = min(sold)
        sold_median = median(sold)
        diagnostics["soldLow"] = round(sold_low, 2)
        diagnostics["soldP10"] = round(sold_p10 or sold_low, 2)
        diagnostics["soldMedian"] = round(sold_median, 2)
        candidates.append({"source": "sold-p10", "value": sold_p10 or sold_low, "weight": "medium"})

    return candidates, diagnostics


def choose_confidence(
    buyer_price: float | None,
    estimate: float | None,
    comp_counts: dict[str, int],
    blockers: list[str],
    safe_exit: float | None,
    max_offer: int | None,
) -> str:
    if blockers or safe_exit is None or max_offer is None or max_offer <= 0:
        return "manual-review"
    comp_strength = comp_counts.get("active", 0) + comp_counts.get("pending", 0) + comp_counts.get("sold", 0)
    has_market_depth = comp_counts.get("sold", 0) >= 3 or (comp_counts.get("pending", 0) >= 1 and comp_counts.get("active", 0) >= 1)
    if buyer_price is not None and has_market_depth:
        return "high"
    if buyer_price is not None or (estimate is not None and comp_strength >= 3):
        return "medium"
    return "low"


def seller_pitch(diagnostics: dict[str, Any], output: dict[str, Any]) -> list[str]:
    pitch = [
        "We specialize in vacant land and close through title.",
        "This is a clean net-cash path without waiting on a retail MLS buyer.",
    ]
    if diagnostics.get("activeSellerNetEstimate"):
        pitch.append(
            f"Lowest active competition nets roughly ${int(diagnostics['activeSellerNetEstimate']):,} after sale discount, fees, and closing-cost assumptions."
        )
    if output.get("suggestedInitialOffer"):
        pitch.append(f"Initial offer target: ${int(output['suggestedInitialOffer']):,} net, subject to proof/title review.")
    return pitch


def buyer_pitch(output: dict[str, Any], diagnostics: dict[str, Any]) -> list[str]:
    pitch = []
    if output.get("safeExitLow"):
        pitch.append(f"Conservative exit support begins around ${int(output['safeExitLow']):,}.")
    if diagnostics.get("activeLowestAsk"):
        pitch.append(f"Offer can be positioned below the lowest active listing of ${int(diagnostics['activeLowestAsk']):,}.")
    if output.get("expectedSpreadAtInitialOffer") is not None:
        pitch.append(f"Projected spread at initial offer: ${int(output['expectedSpreadAtInitialOffer']):,} before final title/risk adjustments.")
    if output.get("methodUsed") in {"builder-backed", "hybrid"}:
        pitch.append("Parcel is priced from a verified buyer/builder buy number, not a hopeful retail comp.")
    return pitch


def analyze_parcel(
    parcel: dict[str, Any],
    target_spread: float,
    closing_cost_buffer: float,
    risk_buffer: float,
    active_sale_factor: float,
    realtor_fee_pct: float,
) -> dict[str, Any]:
    parcel_id = parcel.get("parcelId") or parcel.get("apn") or parcel.get("id") or "unknown"
    address = parcel.get("address") or parcel.get("propertyAddress") or "unknown"
    reasons: list[str] = []
    blockers, unknowns = parcel_risk_blockers(parcel)

    buyer_price, buyer_reason = verified_buyer_price(parcel)
    if buyer_price is not None:
        reasons.append(buyer_reason)

    est = estimate_value(parcel)
    redfin_anchor = round_to(est * 0.5) if est is not None else None
    if redfin_anchor is not None:
        reasons.append(f"Estimate half-anchor generated from supplied estimate: ${redfin_anchor:,}.")
    else:
        reasons.append("No estimate anchor supplied; output depends on buyer price and comp set.")

    candidates, diagnostics = build_exit_candidates(parcel, closing_cost_buffer, active_sale_factor, realtor_fee_pct)
    safe_exit_raw = min((c["value"] for c in candidates), default=None)
    safe_exit = round_to(safe_exit_raw, 500) if safe_exit_raw is not None else None

    if candidates:
        reasons.append("Safe exit uses conservative low of verified buyer price, active-adjusted low, pending low, and sold P10/low.")
    else:
        blockers.append("No usable buyer price, active comps, pending comps, or sold comps supplied.")

    max_offer = round_to(safe_exit - target_spread - closing_cost_buffer - risk_buffer) if safe_exit is not None else None

    offer_candidates = [v for v in [redfin_anchor, max_offer] if v is not None and v > 0]
    if buyer_price is not None:
        buyer_backed_offer = round_to(buyer_price - target_spread - closing_cost_buffer - risk_buffer)
        if buyer_backed_offer is not None:
            offer_candidates.append(buyer_backed_offer)
    suggested_initial = min(offer_candidates) if offer_candidates else None
    walk_up = max_offer

    if max_offer is not None and max_offer <= 0:
        blockers.append("No spread remains after target spread, closing-cost buffer, and risk buffer.")
    if suggested_initial is not None and walk_up is not None and suggested_initial > walk_up:
        suggested_initial = walk_up

    expected_spread = safe_exit - suggested_initial if safe_exit is not None and suggested_initial is not None else None
    comp_counts = diagnostics.get("compCounts", {"active": 0, "pending": 0, "sold": 0})
    confidence = choose_confidence(buyer_price, est, comp_counts, blockers, safe_exit, max_offer)

    if buyer_price is not None and redfin_anchor is not None:
        method = "hybrid"
    elif buyer_price is not None:
        method = "builder-backed"
    elif redfin_anchor is not None:
        method = "redfin-half"
    else:
        method = "manual-review"

    if confidence == "manual-review":
        if blockers and any("No spread" in b for b in blockers):
            next_action = "reject"
        elif blockers:
            next_action = "manual-review"
        elif buyer_price is None and (comp_counts.get("active", 0) + comp_counts.get("pending", 0) + comp_counts.get("sold", 0)) == 0:
            next_action = "collect-comps"
        elif buyer_price is None:
            next_action = "capture-buyer-price"
        else:
            next_action = "manual-review"
    elif confidence == "low":
        next_action = "manual-review"
    else:
        next_action = "make-offer"

    if unknowns:
        reasons.append("Parcel-risk fields still need proof: " + "; ".join(unknowns))

    output: dict[str, Any] = {
        "parcelId": parcel_id,
        "address": address,
        "market": parcel.get("market"),
        "state": parcel.get("state"),
        "methodUsed": method,
        "underwritingConfidence": confidence,
        "suggestedInitialOffer": suggested_initial,
        "walkUpCeiling": walk_up,
        "safeExitLow": safe_exit,
        "expectedExitRange": [safe_exit, max((safe_exit or 0), max((round_to(c["value"]) or 0 for c in candidates), default=0))] if safe_exit else None,
        "targetSpread": int(target_spread),
        "expectedSpreadAtInitialOffer": round_to(expected_spread, 500) if expected_spread is not None else None,
        "redfinEstimate": round_to(est, 500) if est is not None else None,
        "redfinOfferAnchor": redfin_anchor,
        "buyerBuyPrice": round_to(buyer_price, 500) if buyer_price is not None else None,
        "diagnostics": diagnostics | {"exitCandidates": candidates},
        "reasons": reasons,
        "blockers": blockers,
        "sellerPitch": [],
        "buyerPitch": [],
        "nextAction": next_action,
        "zeroFabrication": True,
    }
    output["sellerPitch"] = seller_pitch(diagnostics, output)
    output["buyerPitch"] = buyer_pitch(output, diagnostics)
    return output


def summarize(rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_confidence: dict[str, int] = {}
    by_action: dict[str, int] = {}
    for row in rows:
        by_confidence[row["underwritingConfidence"]] = by_confidence.get(row["underwritingConfidence"], 0) + 1
        by_action[row["nextAction"]] = by_action.get(row["nextAction"], 0) + 1
    offerable = [r for r in rows if r.get("nextAction") == "make-offer"]
    return {
        "rows": len(rows),
        "makeOffer": len(offerable),
        "manualOrBlocked": len(rows) - len(offerable),
        "byConfidence": by_confidence,
        "byNextAction": by_action,
    }


def analyze_payload(args: argparse.Namespace, payload: dict[str, Any]) -> dict[str, Any]:
    target_spread = money(args.target_spread if args.target_spread is not None else payload.get("targetSpread")) or 10000
    closing_cost_buffer = money(args.closing_cost_buffer if args.closing_cost_buffer is not None else payload.get("closingCostBuffer")) or 2000
    risk_buffer = money(args.risk_buffer if args.risk_buffer is not None else payload.get("riskBuffer")) or 2500
    active_sale_factor = float(args.active_sale_factor if args.active_sale_factor is not None else payload.get("activeSaleFactor", 0.90))
    realtor_fee_pct = float(args.realtor_fee_pct if args.realtor_fee_pct is not None else payload.get("realtorFeePct", 0.06))

    parcels = payload.get("parcels") or []
    if not isinstance(parcels, list):
        raise SystemExit("Input JSON must include a parcels[] array.")

    rows = [
        analyze_parcel(parcel, target_spread, closing_cost_buffer, risk_buffer, active_sale_factor, realtor_fee_pct)
        for parcel in parcels
    ]
    return {
        "generatedAt": now_iso(),
        "sourceMethod": payload.get("sourceMethod", "operator-provided-json"),
        "market": payload.get("market"),
        "state": payload.get("state"),
        "zeroFabrication": True,
        "assumptions": {
            "targetSpread": int(target_spread),
            "closingCostBuffer": int(closing_cost_buffer),
            "riskBuffer": int(risk_buffer),
            "activeSaleFactor": active_sale_factor,
            "realtorFeePct": realtor_fee_pct,
            "estimateAnchorRule": "estimate * 0.50",
        },
        "summary": summarize(rows),
        "rows": rows,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Produce vacant-land comp confidence outputs from a JSON packet.")
    parser.add_argument("--input", required=True, help="Path to land comp input JSON.")
    parser.add_argument("--output", required=True, help="Path to write land comp output JSON.")
    parser.add_argument("--target-spread", type=float, default=None, help="Desired assignment/spread buffer.")
    parser.add_argument("--closing-cost-buffer", type=float, default=None, help="Closing-cost buffer subtracted from offer ceiling.")
    parser.add_argument("--risk-buffer", type=float, default=None, help="Risk buffer subtracted from offer ceiling.")
    parser.add_argument("--active-sale-factor", type=float, default=None, help="Active ask adjustment factor, default .90.")
    parser.add_argument("--realtor-fee-pct", type=float, default=None, help="Seller-net realtor fee assumption, default .06.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = read_json(Path(args.input))
    output = analyze_payload(args, payload)
    write_json(Path(args.output), output)
    print(json.dumps({"output": args.output, "summary": output["summary"]}, indent=2))


if __name__ == "__main__":
    main()
