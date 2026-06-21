# Web App Infusion Plan — Carson/Jackson Business Plan

This plan translates `docs/BUSINESS_PLAN_DISSECTION.md` into concrete LandFlip OS product upgrades.

## North star

Turn the app into a **buyer-first land wholesaling operating cockpit**.

The app should answer one question every morning:

> Which exact buyer-backed seller calls can create assignment spread now, and what must be cleared before we call?

## Current app foundation already aligned

Existing product objects/functions already point in the right direction:

- Markets with new-build/builder/vacant-lot signals.
- Buyers with buy-box fields and validation notes.
- Parcels with seller/risk/economic fields.
- Queues for skip trace, buyer validation, top seller calls, and offer ready.
- Offer engine and deal memo exports.
- Call-first UI direction.
- Contract packet docs already created.

The infusion is not a pivot. It is tightening the app around the PDF’s actual money loop.

## Product architecture shift

### Before

```text
Lead dashboard with markets, buyers, parcels, and CRM actions
```

### After

```text
Buy Box Command Center
→ Seller Match Queue
→ Call/Offer Engine
→ Contract + Title Gate
→ Assignment/Neighbor/Referral Expansion Loop
```

## Data model upgrades

### 1. Buy Box becomes first-class

Add/strengthen fields on buyer records:

```js
exactBuyBox: {
  targetMarkets: [],
  zipCodes: [],
  neighborhoods: [],
  lotSizeMin: null,
  lotSizeMax: null,
  maxPrice: null,
  monthlyLotDemand: null,
  closeSpeedDays: null,
  requiredRoadAccess: true,
  requiredUtilities: null,
  avoidFloodZones: [],
  avoidWetlands: true,
  protectedWildlifePolicy: '',
  slopePolicy: '',
  source: 'phone|email|listing|public-record|unknown',
  capturedAt: '',
  verifiedBy: '',
  confidence: 0
}
```

Derived state:

```text
Buy Box Status:
- missing
- partial
- captured
- validated
- repeat buyer
```

Acceptance criteria:

- A buyer cannot become `validated` without geography, max price, lot size, and kill criteria.
- The UI shows missing buy-box fields as call prompts.

### 2. Seller motivation profile

Add seller-motivation fields to parcel records:

```js
sellerProfile: {
  ownerType: 'out_of_state|inherited|multiple_lot_owner|expired_listing|neighbor|unknown',
  yearsHeld: null,
  originalPurchasePrice: null,
  currentTaxBurdenAnnual: null,
  assessedValue: null,
  listedDaysOnMarket: null,
  linkedParcelCount: null,
  motivationReasons: []
}
```

Derived score:

```text
Motivation Score = out-of-state + long-held + low basis + high tax + expired listing + multi-lot owner
```

Acceptance criteria:

- Seller cards show why this seller might say yes.
- Multiple-lot owners get a package-deal prompt.

### 3. Neighbor strategy fields

Add adjacency/neighbor workflow:

```js
neighborOpportunity: {
  adjacentParcelsFound: false,
  neighborContacts: [],
  firstLookOfferedAt: '',
  neighborInterest: 'unknown|no|maybe|yes',
  premiumPotential: 0,
  notes: ''
}
```

Acceptance criteria:

- Every parcel under contract triggers “Call neighbors before builder close?”
- Neighbor interest can outrank builder assignment when premium potential is high.

### 4. Contract/title readiness gate

Add deal-stage legal ops state:

```js
contractGate: {
  sellerContractStatus: 'missing|draft|sent|signed|terminated',
  assignmentStatus: 'missing|sent|signed',
  attorneyReviewStatus: 'missing|requested|approved|needs_changes',
  titleCompanyStatus: 'missing|candidate|assignment_confirmed|double_close_required|blocked',
  emdTimingApproved: false,
  feasibilityThroughClosingApproved: false,
  assignmentFeeSettlementApproved: false,
  closingAgent: '',
  notes: ''
}
```

Acceptance criteria:

- `offerReady` cannot mean “transaction ready” unless title/contract gate is clear.
- UI distinguishes:
  - opportunity ready;
  - call ready;
  - contract ready;
  - close ready.

### 5. Outreach channel + ROI tracking

Add lightweight channel metrics:

```js
outreach: {
  channel: 'cold_call|direct_mail|sms|neighbor_call|referral',
  attempts: [],
  responseStatus: 'not_contacted|no_answer|declined|maybe|accepted|contract_sent',
  costCents: 0,
  complianceNotes: '',
  nextFollowUp: ''
}
```

Acceptance criteria:

- The app can show profit/channel after enough data.
- SMS/direct mail actions display compliance and cost warnings.

## Feature roadmap

## Phase 1 — Business Plan Brain Transplant into Existing UI

Goal: make the current app reflect the PDF’s operational truth without large rewrites.

### Feature 1.1 — Buy Box Completeness Meter

Where:

- Buyer cards.
- Buyer-first board.
- Deal fit matrix.

Show:

- max price captured?
- lot-size range captured?
- zip/neighborhood captured?
- monthly demand captured?
- buildability killers captured?
- close speed captured?

User action:

```text
Call builder to fill missing buy-box fields.
```

### Feature 1.2 — Seller Net Offer Script Generator

Extend existing `generateOwnerCallScript` and `computeOffer` to include:

- seller net vs listed sale math;
- realtor-fee avoidance talking point;
- closing-cost paid-by-buyer talking point;
- fast-close timeline;
- transparent builder/assignment disclosure.

Output example:

```text
“I can give you $33,500 net, cover normal closing costs, and close in 2–3 weeks. A listed sale at $35,000 may net similar after fees but could take months.”
```

### Feature 1.3 — Risk Kill-Gate Checklist

Parcel card displays:

- wetlands;
- flood zone;
- road access;
- utilities;
- slope;
- protected wildlife;
- city/county confirmation;
- builder-specific kill criteria.

CTA:

```text
Clear risk before contract
```

### Feature 1.4 — Contract Gate Panel

Add a compact panel to parcel/deal cards:

```text
Seller contract: draft/sent/signed
Assignment: missing/sent/signed
Title company: not confirmed/assignment accepted/double close required
Attorney: not reviewed/reviewed
```

Link to templates:

- seller contract custom terms;
- builder assignment;
- attorney/title brief;
- termination notice.

### Feature 1.5 — Neighbor Call Prompt

On any parcel with seller acceptance/contract status:

```text
Before assigning to builder: call adjacent owners for first look.
```

Add CTA:

```text
Generate neighbor call script
```

## Phase 2 — The Money Queue

Goal: make the Today screen rank work by expected money, not generic lead freshness.

### Ranking formula v1

```text
Money Queue Score =
  buyer confidence
+ projected spread
+ seller motivation
+ contactability
+ buildability confidence
+ contract readiness
- compliance/legal risk
- missing-data penalty
```

Queues:

1. Buyer validations to make now.
2. Seller calls worth making now.
3. Risk checks blocking money.
4. Contracts/title tasks blocking close.
5. Referral/neighbor expansion tasks.

Acceptance criteria:

- Today screen answers “what should I do now?” in under 5 seconds.
- Each task has exactly one next action.

## Phase 3 — Market Scanner from the Plan

Goal: automate the free Zillow-style method using legitimate public/source-derived substitutes where possible.

Inputs:

- selected market/county;
- current-year new build indicators;
- builder names/websites/listings where available;
- vacant residential parcel inventory;
- lot standardization;
- public assessor/GIS availability.

Output:

```text
Market: Lehigh Acres
New build signal: high
Cookie-cutter lot signal: high
Builder discovery: 18 candidate builders
Seller parcel inventory: high
Compliance caveats: Florida wildlife/wetlands/title review
Recommendation: start buyer calls
```

Acceptance criteria:

- Market score cites source IDs.
- No fake buyer contacts.
- Missing phone/email routes to enrichment queue, not hallucinated data.

## Phase 4 — Outreach Ops Layer

Goal: support the channel strategy without violating compliance or encouraging premature automation.

Features:

- Cold-call daily target tracker.
- Saved “Land Guy” callback tracking.
- Direct-mail export with seller net offer fields.
- SMS export disabled/flagged until compliance rules are configured.
- Referral letter task after close.
- Channel ROI tracker.

Important guardrail:

```text
Do not make SMS automation the default. Beginner mode should push manual cold calls because that is how Okeito learns market truth.
```

## Phase 5 — Learning Loop

Goal: each call improves scoring.

Capture:

- builder accepted/rejected reason;
- seller objection;
- seller counter price;
- deal killer discovered;
- title-company blocker;
- neighbor premium response;
- referral source.

Use to update:

- buyer buy box;
- max offer bands;
- seller motivation scoring;
- market score;
- scripts;
- risk checklist.

## Implementation task breakdown

### Sprint A — Fastest product lift

Files likely touched:

- `src/core.mjs`
- `src/app.mjs`
- `src/styles.css`
- `tests/scoring.test.mjs` or new tests

Tasks:

1. Add `calculateBuyBoxCompleteness(buyer)`.
2. Add `calculateSellerMotivation(parcel)`.
3. Extend call script generation with seller-net math.
4. Add risk kill-gate labels to parcel card.
5. Render contract gate status using existing contract docs links.
6. Add tests for buy-box completeness and seller motivation.

### Sprint B — Money Queue

Tasks:

1. Add `calculateMoneyQueueScore(parcel, buyer)`.
2. Update `buildDailyMoneyQueue` to include buyer confidence, seller motivation, risk confidence, and contract gate blockers.
3. Change Today card copy from generic scoring to “why this call can make money.”
4. Add tests for queue ranking.

### Sprint C — Neighbor/referral workflows

Tasks:

1. Add `generateNeighborCallScript(parcel)`.
2. Add post-close referral task generator.
3. Add linked-parcel prompt for multi-lot owners.
4. Add direct mail/referral letter export fields.

### Sprint D — Market scanner refinement

Tasks:

1. Add market criteria from the PDF: 5+ new builds, lot standardization, suburb-not-core, builder count, parcel inventory.
2. Add Texas/non-disclosure/SMS caveat warnings.
3. Expand docs/source disclosure for public-source confidence.

## UI principles from the PDF

- The product must remain call-first.
- Every visible lead should explain the buyer behind it.
- Hide generic CRM noise.
- Separate missing data from actual opportunity.
- Never present legal/title assumptions as certainty.
- Push unscalable manual learning early; automate only after the call patterns are real.

## Proposed navigation after infusion

```text
Today
- Money Queue
- Buyer calls
- Seller calls
- Risk/title blockers

Deals
- Parcel fit matrix
- Offer math
- Contract gate
- Neighbor/referral prompts

Buy Boxes
- Builders
- Buy-box completeness
- Buyer feedback loop

Sources
- Market/source evidence
- Import/enrichment queues

Machine
- Scoring formulas
- Compliance/title readiness
- Exports
```

## Immediate recommended build order

1. Buy Box Completeness Meter.
2. Seller Motivation Score.
3. Seller Net Offer Script.
4. Contract/Title Gate Panel.
5. Neighbor Call Prompt.
6. Money Queue scoring upgrade.

This is the fastest path because it converts the PDF’s strongest insights into product surface area without requiring a full data-ingestion rebuild.

## Definition of done for the infusion

The app is infused when a user can open it and see:

- which builder buy boxes are real vs incomplete;
- which seller parcels match real buyer demand;
- what the exact seller offer should be;
- what risk/title item blocks the deal;
- what to say on the call;
- whether to call the neighbor before assigning to builder;
- which post-close referral action to trigger.

That is the Carson/Jackson operating system translated into our web app.
