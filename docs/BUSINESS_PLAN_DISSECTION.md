# Land Wholesaling Business Plan Dissection

Source saved in this repo:

- `docs/source-materials/Land Wholesaling Business Plan.pdf`
- `docs/source-materials/Land Wholesaling Business Plan.extracted.txt`

Source context: uploaded PDF titled **Land Wholesaling Business Plan**, based on the Koerner Office podcast episode with Carson and Jackson of `carsonjackson.com`. The PDF itself notes that the revenue figures, deal counts, and practices are sourced from that podcast, and that the brothers are not attorneys.

## Executive read

The plan validates the direction we already moved toward: **buyer-first, builder-backed land wholesaling**.

The core system is not “find cheap land and hope.” It is:

1. Find active spec builders in a market.
2. Extract their buy box: zip codes, lot size, max price, buildability constraints, closing speed, volume appetite.
3. Pull seller parcels that match the buy box.
4. Offer 10–20% below the builder’s known price.
5. Put seller under an assignable contract with strong feasibility/termination protection.
6. Assign the contract to the builder/end-buyer.
7. Close through title and collect the spread.

The highest-leverage product insight: **Land Dealflow OS should behave less like a generic CRM and more like a buyer-demand targeting machine that tells Okeito exactly who to call next and why that call can turn into money.**

## Business model extracted

### The simple equation

```text
Builder max price
- seller acquisition price
- closing/transaction friction
= assignment spread
```

The PDF repeatedly points to a 10–20% seller discount target beneath known builder demand. The stated average assignment profit is approximately **$8,600 per deal** with **90–95% margins**, but revenue is lumpy and should be judged quarterly, not month-to-month.

### Why land beats houses in this model

The PDF’s structural argument:

- Land has fewer variables than houses.
- Comparable lots in cookie-cutter subdivisions are more interchangeable.
- Seller calls are shorter because vacant land is usually less emotional than a home.
- Builders can buy repeatedly; house flippers are more capital-constrained.
- Buildability issues can often be screened online before expensive commitments.

Implication for our app: the product should simplify reality into **fit / risk / money / next call**, not copy residential CRM complexity.

## The operating loop

### 1. Market selection

A good market has:

- more than 5 newly built homes in the target zip code;
- cookie-cutter lots of similar size;
- active builders building spec homes now;
- suburbs/edges near growth cities, not fully built-out cores;
- enough vacant-lot inventory;
- manageable legal/compliance constraints.

Named markets/resources from the PDF:

- Florida: Cape Coral, Lehigh Acres, Bonita Springs, Southwest Florida;
- North Carolina: Wilmington;
- South Carolina;
- Georgia;
- Nevada;
- Washington;
- Hawaii;
- Arkansas: Bentonville / northwest Arkansas;
- Texas is caveated due to texting laws and non-disclosure sold-price limitations.

Our current Lehigh/Cape Coral focus is aligned with the plan.

### 2. Builder discovery

Free method:

- Go to Zillow.
- Search homes for sale.
- Filter year built to current year, e.g. 2025/2026.
- Sort newest first.
- Identify spec builders from listing pages.
- Call builder/listing contact.

Builder call objective:

- Confirm they are building scattered/infill lots.
- Ask what they pay per lot.
- Ask desired lot sizes.
- Ask exact zip codes/neighborhoods.
- Ask volume appetite.
- Ask buildability killers.
- Ask close-speed requirements.

Product implication: every builder record needs a **Buy Box Completeness** score and the UI should refuse to treat a buyer as validated unless the buy box includes price, lot-size range, geography, and kill criteria.

### 3. Seller discovery

Seller types the PDF prioritizes:

- out-of-state owners who bought cheap 5+ years ago;
- inherited owners;
- multiple-lot owners;
- expired/long-stale Zillow lot listings;
- adjacent/neighbor owners who may pay a premium;
- owners carrying a rising tax burden on land they do not use.

Seller list sources:

- Zillow on-market vacant lots;
- county property/tax records;
- PropStream / Land Portal at scale;
- True People Search for one-off contact lookup;
- bulk skip tracing at scale.

Product implication: our seller queue should separate **public owner record exists** from **callable contact enriched**. We already do this with skipTrace queues; the PDF reinforces that this is the correct architecture.

### 4. Offer system

The plan’s offer logic:

- Know the builder’s max before seller outreach.
- Offer sellers 10–20% below the builder’s price.
- Explain seller net, not just sale price.
- Compare against realtor fees, closing costs, and months of waiting.
- Keep seller-facing promise simple: cash, seller pays no closing costs, fast close.

Example logic from the PDF:

```text
Builder pays: $35,000 + closing costs
Seller net target: $33,500
Wholesaler keeps: spread after assignment/closing structure
```

Product implication: the Offer Engine should output three numbers:

- initial offer;
- max safe seller offer;
- minimum spread / kill price.

It should also generate seller-net talking points.

### 5. Contracts and closing

Critical contract controls from the PDF:

- assignable seller purchase contract;
- feasibility contingency;
- ability to terminate during feasibility if builder/buildability fails;
- earnest money not due until closing if attorney/title approves;
- typical EMD mentioned: $250;
- builder/end-buyer deposits EMD under the assignment contract;
- title company coordinates closing and assignment fee.

This matches the contract packet we already created in:

- `docs/templates/SELLER_VACANT_LAND_PURCHASE_CUSTOM_TERMS_FLORIDA.md`
- `docs/templates/BUILDER_ASSIGNMENT_AGREEMENT_TEMPLATE_FLORIDA.md`
- `docs/templates/ATTORNEY_TITLE_REVIEW_BRIEF.md`
- `docs/templates/TERMINATION_NOTICE_TEMPLATE.md`

Brutal legal note: the PDF’s “ChatGPT can write a contract legal in all 50 states” claim is a beginner shortcut, not a production-grade operating policy. For our app, contract readiness must stay gated by state, attorney/title review, and title-company assignment acceptance.

### 6. Risk filter

Deal killers in the plan:

- wetlands;
- gopher tortoises / protected wildlife in Florida;
- scrub jays / protected birds;
- slope;
- utilities availability;
- road access;
- flood zone / buildability constraints.

Risk discovery channels:

- aerial imagery on Zillow/Google style maps;
- county records;
- city/county calls;
- wetlands reports;
- wildlife surveys;
- builder-specific no-go criteria.

Product implication: risk should not be buried. It should be a visible **kill-gate checklist** before seller contract and before builder assignment.

### 7. Outreach channels

PDF channel hierarchy:

- Beginner: cold calls, free, learn the market manually.
- Direct mail: better quality response, scalable, lower ROI than SMS but larger total revenue at scale.
- SMS: high ROI in the episode, but compliance-sensitive; Texas specifically caveated.
- Ringless voicemail: lower priority.
- Neighbor calls: always check before closing; can beat builder price due to unique adjacency value.
- Referral program: handwritten post-close seller thank-you letter with $1,000 referral offer.

Product implication: the app needs channel-level ROI tracking and compliance warnings, but the immediate UI should push **manual calls** because that is where Okeito learns seller objections and buyer appetite fastest.

## Tool/resource inventory

### Free / beginner tools

- Zillow: builder discovery, listing research, on-market lots, rough comps.
- True People Search: one-off owner/neighbor phone lookup.
- County property/tax records: owner, mailing address, purchase history, parcels.
- ChatGPT: scripts, research prompts, contract draft scaffolding — not final legal approval.
- Phone: cold calls.
- Google Sheet: minimum viable buy-box and seller tracking.

### Paid / scale tools named

- Buyer Bridge: land wholesaling CRM built by Carson/Jackson; described as managing buyers, buy boxes, title work, contracts, and partner network.
- Land Portal / PropStream: owner list pulls by geography, ownership duration, purchase price, etc.
- Kind Skip Tracing: bulk phone numbers.
- Reply Smart / Smarter Contact: bulk SMS campaigns.
- REI Print Mail: direct mail campaigns.
- Ready Mode / Batch Dialer: high-volume calling/dialer stack.

### Professional/service layer

- assignment-friendly title company;
- local real-estate attorney;
- tax professional;
- wetlands/wildlife survey vendors when needed;
- city/county planning/building department calls.

## Missing pieces / weaknesses in the PDF

These are gaps our web app can exploit:

1. **No compliance engine.** SMS laws, state wholesaling rules, disclosure, contract assignability, and title-company acceptance are mentioned but not operationalized.
2. **No source-of-truth data model.** The plan describes tools but not the record structure connecting builder demand → parcel → seller → offer → contract → close.
3. **No automated market scanner.** Zillow research is manual. Our app can generate repeatable market/source candidates.
4. **No buyer confidence scoring.** A builder saying “yes” is not the same as proof of recurring close behavior.
5. **No risk-score hierarchy.** Wetlands/wildlife/slope/utilities are listed, but not turned into an ordered kill-gate.
6. **No call prioritization math.** The PDF says call sellers; our app should rank the few seller calls worth making today.
7. **No learning loop.** Builder passes/accepts should update future scoring. Seller objections should update scripts and pricing.
8. **No post-close/referral pipeline.** The referral and neighbor strategy is valuable but currently manual.

## Highest-leverage insights for Land Dealflow OS

1. **Buyer-first is not a preference; it is the whole risk-control mechanism.** Seller calls before buy-box validation are low-quality activity.
2. **The buy box is the product’s central object.** Everything should orbit around buy boxes.
3. **The app should measure certainty, not just opportunity.** Buyer certainty + seller contactability + buildability confidence + contract readiness = call priority.
4. **Neighbor buyers are hidden alpha.** Every contracted lot should trigger a neighbor-call checklist before defaulting to builder assignment.
5. **Referrals are a real acquisition channel.** The post-close workflow should generate referral tasks automatically.
6. **The correct UX is a money queue.** Show today’s top 5 calls, top 3 buyer validations, and top 3 risks to clear — not a giant dashboard.
7. **Contracts/title readiness is an ops gate.** A deal is not real until the title company will close the structure.
8. **Manual learning comes before automation.** In early markets, the app should force call notes and objection capture, not hide Okeito behind automation.

## Proposed product principle

Build Land Dealflow OS as the **operating cockpit for a builder-first land wholesaling desk**:

```text
Market evidence → builder buy box → seller parcel match → risk gate → offer script → contract/title packet → assignment/close → referral/neighbor expansion
```

Not a CRM. A money machine with guardrails.
