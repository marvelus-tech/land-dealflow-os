# Vacant Land Comps Confidence Engine

This is the first repeatable LandFlip OS underwriting engine for vacant-land lot comps.

It implements the Wiener Bros comping method as a zero-fabrication JSON-in/JSON-out workflow:

- prefer verified builder/buyer buy prices;
- use Redfin/estimate ÷ 2 only as a conservative offer anchor;
- validate exits with active, pending, and sold lot comps;
- treat active listings as unsold competition, not proof of value;
- subtract target spread, closing-cost buffer, and risk buffer before offer ceilings;
- expose blockers instead of making weak lots look offer-ready.

## Command

```bash
python3 scripts/land_comps_confidence.py \
  --input tests/fixtures/land-comps-confidence-input.json \
  --output /tmp/land-comps-output.json
```

Optional assumptions:

```bash
python3 scripts/land_comps_confidence.py \
  --input data/real/<market>/land_comp_inputs.json \
  --output data/real/<market>/land_comp_outputs.json \
  --target-spread 10000 \
  --closing-cost-buffer 2000 \
  --risk-buffer 2500 \
  --active-sale-factor 0.90 \
  --realtor-fee-pct 0.06
```

## Input shape

```json
{
  "market": "Lehigh Acres",
  "state": "FL",
  "targetSpread": 10000,
  "closingCostBuffer": 2000,
  "riskBuffer": 2500,
  "parcels": [
    {
      "parcelId": "LEHIGH-001",
      "address": "612 S Sheldon Ave, Lehigh Acres, FL",
      "buyerBuyBox": {
        "buyerName": "Example Builder",
        "maxPrice": 25000,
        "quoteSource": "call-note",
        "matchesParcel": true
      },
      "estimateSignals": {
        "redfinEstimate": 29000
      },
      "comps": {
        "active": [{"price": 28000}],
        "pending": [{"price": 25000}],
        "sold": [{"price": 24000}, {"price": 25000}, {"price": 26000}]
      },
      "parcelRisk": {
        "roadAccess": "pass",
        "utilities": "pass",
        "flood": "pass",
        "zoning": "pass"
      }
    }
  ]
}
```

## Output fields

Each row returns:

- `methodUsed`: `builder-backed`, `redfin-half`, `hybrid`, or `manual-review`
- `underwritingConfidence`: `high`, `medium`, `low`, or `manual-review`
- `suggestedInitialOffer`
- `walkUpCeiling`
- `safeExitLow`
- `expectedExitRange`
- `targetSpread`
- `expectedSpreadAtInitialOffer`
- `redfinOfferAnchor`
- `buyerBuyPrice`
- `diagnostics`
- `reasons`
- `blockers`
- `sellerPitch`
- `buyerPitch`
- `nextAction`

## LandFlip guardrails

This script never fetches or invents missing data.

If no comps or buyer price are supplied, the row becomes `collect-comps` or `manual-review`.
If a hard parcel risk is supplied, such as `roadAccess: landlocked`, the row cannot become `make-offer` automatically.

## Test

```bash
node tests/land-comps-confidence.test.mjs
npm test
```
