# Dallas Buyer-Backed Vacant Land / Teardown List — 752xx

Generated: 2026-06-22  
Market key: `dallas-buyer-752xx`  
Buyer signal: active builder ready to buy now via user network.

## Buyer criteria

- ZIPs: 75230, 75229, 75220, 75218, 75214, 75206, 75225, 75212
- Product: single-family teardown or vacant lot
- Minimum lot: 8,000+ sq ft
- Budget: $350K–$450K
- ARV target: $1.8M flexible
- Must meet: utilities in place, outside flood zone, platted valid address, Dallas city limits preferred

## Files

- `buyer_buy_box.json` — normalized buyer criteria.
- `seller_source_plan.json` — multi-phase source/verification workflow.
- `dcad_phase1_candidates_raw.json` — DCAD source-backed candidate pool; stores top 250 scored rows from the full screen.
- `dallas_752xx_phase2_screened_candidates.csv/json` — 75 scored candidates checked against City parcel layer, FEMA flood layer, and City zoning; qualifying passes are carried forward completely.
- `dallas_752xx_top25_buyer_fit.csv` — priority view only, not a cap.
- `land_recon_import_packet.json` / `.csv` — complete Land Recon import packet: every current qualifying source-backed row, no guessed contacts.

## Current counts

- DCAD Phase 1 candidates found from target ZIPs: 16,516
- Phase 2 candidates checked with public APIs: 75
- Phase 2 city + flood public-record passes: 68
- Complete Phase 3 qualifying rows queued for utility/plat verification: 68
- Complete Phase 4 rows held for utility/plat proof: 68
- Rows promoted to owner contact enrichment: 0

## Gate status

These are **not seller-call-ready**. They are source-backed Land rows. Next gate is utilities/tap + recorded plat + owner contact enrichment.

## Phase 3 execution

Created:

- `phase3_utility_plat_verification_queue.json`
- `phase3_utility_plat_verification_queue.csv`
- `phase3_all_qualifying_manual_verification.json`
- `phase3_all_qualifying_manual_verification.csv`
- `phase3_top10_manual_verification_shortlist.json` — priority view only, not a cap
- `phase3_top10_manual_verification_shortlist.csv` — priority view only, not a cap

Phase 3 result:

- All 68 Phase 2 public-record pass rows address-checked with City of Dallas geocoder.
- 68 / 68 returned high-confidence address matches.
- 68 qualifying rows are in the complete manual utility + recorded-plat verification queue.
- 10 non-PD/high-priority rows remain available as a priority view only, not a cap.

Still not call-ready. The correct next gate is **manual proof of utilities/taps and recorded plat/legal-lot status**, then skip-trace only the survivors.

## Phase 4 utility / plat proof gate

Created by `npm run dallas:phase4` / `python3 scripts/dallas_phase4_utility_plat_gate.py`:

- `phase4_utility_plat_gate.json`
- `phase4_utility_plat_gate.csv`
- `phase4_operator_decisions_template.csv`
- `owner_contact_enrichment_queue.json`
- `owner_contact_enrichment_queue.csv`

Phase 4 keeps all 68 qualifying Dallas rows app-visible in Land while locked. Rows promote to owner contact enrichment only when all proof fields pass:

- water/sewer or prior active service proof;
- electric/gas service or provider/meter proof;
- recorded plat/legal lot proof;
- builder acceptance of zoning/lot constraints;
- operator decision = `pass`.

Current result: 68 rows held for proof, 0 rows promoted to contact enrichment. This is intentional zero-fabrication behavior.

## Phase 4.5 proof sprint

Created by `npm run dallas:phase45` / `python3 scripts/dallas_phase45_proof_sprint.py`:

- `phase45_top12_proof_sprint.json`
- `phase45_top12_proof_sprint.csv`
- `phase45_top12_proof_sprint.md`
- `phase45_builder_zoning_acceptance_draft.md`

Phase 4.5 is the operator sprint view: 12 rows selected from the complete 68-row queue for simplest proof execution. Selection favors high-confidence city parcel matches, outside-SFHA rows, standard residential zoning, present owner names, existing-improvement signals, and large lots. It is not a cap; all 68 remain app-visible and locked.

## Complete-data policy

Top-N files are convenience/priority views only. LandFlip OS must preserve and expose **every** row that meets the buyer-backed criteria. If more than 10 parcels qualify, all qualifying parcels stay in the complete queue and app-loadable Land artifacts; Top 10/Top 25 labels are only sorting aids, never hard caps.
