# LandFlip OS Roadmap

## Filed for next: Business Plan Infusion

Source docs:

- `docs/source-materials/Land Wholesaling Business Plan.pdf`
- `docs/BUSINESS_PLAN_DISSECTION.md`
- `docs/WEB_APP_INFUSION_PLAN.md`

### Priority build order

1. Buy Box Completeness Meter.
2. Seller Motivation Score.
3. Seller Net Offer Script.
4. Contract/Title Gate Panel.
5. Neighbor Call Prompt.
6. Money Queue scoring upgrade.

### Acceptance criteria

- Buyer records visibly show buy-box completeness and missing call questions.
- Seller cards explain motivation: out-of-state, long-held, low basis, tax burden, expired listing, multi-lot owner.
- Offer scripts explain seller net, not just price.
- Contract/title status is a visible deal gate.
- Parcels under contract trigger neighbor-call and linked-parcel prompts.
- Today view ranks by buyer confidence + spread + motivation + contactability + buildability + contract readiness.

## Filed for later: v1.16 Multi-Buyer Parcel Fit Matrix

Goal: make every seller parcel visibly differentiate by buyer demand, not just a generic fit score.

### Required upgrades

- Per-parcel buyer stack: best buyer, backup buyers, weak/no-fit buyers.
- Buyer-specific economics: buyer max price, estimated acquisition basis, projected spread.
- Fit explanation: market, lot size, max price, road/access, utilities, flood, wetland, and other kill criteria.
- Seller card differentiation:
  - multi-buyer demand
  - single-buyer fit
  - weak buyer coverage
  - no validated buyer yet
- Queue priority: parcels with 2–3 validated buyer matches outrank single-buyer parcels.
- Call guidance: show which buyer to call first and which seller parcels deserve skip trace first.

### Acceptance criteria

- A seller parcel can show multiple matched buyers with different fit scores and economics.
- The seller queue sorts by buyer coverage and spread, not only by parcel score.
- Tests cover at least two validated buyers competing for the same parcel.
- UI shows differentiation on Today and Deals without increasing call-screen noise.
