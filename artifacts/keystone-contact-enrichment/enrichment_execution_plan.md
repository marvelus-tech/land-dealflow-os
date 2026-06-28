# Keystone Heights Owner-Contact Enrichment Execution Plan

Market: Keystone Heights / Clay County, FL  
Input queue: `data/real/duval-keystone-fl/keystone_heights_owner_contact_enrichment_queue.csv` and `.json`  
Rows in scope: 823 app-visible human-owner rows after corporation/trust/institution removal  
Plan status: execution-ready, compliance-first, no fabricated contacts

## 1. Objective and hard rules

Enrich the 823 Keystone Heights human-owner parcel rows with usable owner phone/email candidates while preserving LandFlip OS zero-fabrication provenance.

Non-negotiable rules:

- Do not fabricate phones or emails.
- Do not automate TruePeopleSearch, similar people-search pages, captcha flows, anti-bot challenges, or rate-limit bypasses.
- Do not conduct outreach during enrichment. Enrichment only identifies and scores candidates.
- Treat relatives, associates, neighbors, and household members as context-only unless independently verified as the parcel owner, legal representative, or documented heir contact.
- Anchor every lookup to the official parcel record first: Clay County parcel/APN, owner name, property address, legal description, and source detail URL.
- Do not import a contact into call-ready fields unless it passes the confidence/compliance gates below.
- Maintain opt-out/do-not-contact, bad-number, wrong-owner, deceased/estate, and heirs notes as suppressive or review flags.

## 2. Recommended workflow

### Phase A — Freeze and normalize the working queue

1. Copy the current 823-row queue to a dated working file before enrichment:
   - `artifacts/keystone-contact-enrichment/keystone_owner_contact_working_YYYYMMDD.csv`
2. Preserve these immutable input keys for matching:
   - `parcel_id`
   - `parcel_id_display`
   - `owner_name`
   - `property_address`
   - `property_city`
   - `property_zip`
   - `source_detail_url`
3. Add reviewer-facing operational fields if not already present:
   - `batch_id`
   - `lookup_status`
   - `reviewer`
   - `reviewed_at`
   - `enrichment_notes`
   - `suppression_reason`
4. Deduplicate by normalized owner + property/address context only for work assignment. Do not delete parcel rows. If one owner controls multiple parcels, enrich once, then apply the same verified contact only to parcels where the ownership identity is clearly the same.

### Phase B — Segment and prioritize

Prioritize batches in this order:

1. Large-acreage or most deal-relevant parcels from the existing queue rank/order.
2. Clear individual names with full first/last name and property address.
3. Estate/heirs rows, but route to a special probate/heirs review lane because a found relative is not automatically the owner contact.
4. Ambiguous names, initials-only, suffix conflicts, common-name matches, and missing street addresses.

Suggested operational queues:

- `provider_batch_ready`: clean individual-owner rows suitable for a compliant skip-trace provider.
- `manual_high_value`: top acreage/high-priority rows needing human verification.
- `estate_heirs_review`: rows with `HEIRS`, estate indicators, or possible deceased owner.
- `ambiguous_review`: name-only/common-name/address-conflict rows.
- `suppressed`: opt-out, DNC, bad number, wrong owner, deceased-only with no legal representative, or provider no-match.

### Phase C — Public parcel anchor check

For every row before accepting a contact:

1. Open or verify the official Clay County/QPublic parcel detail URL in `source_detail_url`.
2. Confirm APN/parcel ID and owner name still match the queue.
3. Record the anchor in `match_basis`, for example:
   - `Official Clay parcel APN 004655-000-00 owner HOGAN WILLIAM E JR matched to provider record by full name + Keystone Heights/Clay address history.`
4. If the parcel owner has changed, do not enrich against the stale owner. Mark `lookup_status=stale_public_owner_review` and route back to source refresh.

### Phase D — Provider-first enrichment for scale

Best practical path for all 823 rows is a compliant paid skip-trace/contact-data provider plus human QA, not manual-only search.

Recommended provider workflow:

1. Export a provider input with only necessary matching fields:
   - `parcel_id`
   - `parcel_id_display`
   - `owner_name`
   - `property_address`
   - `property_city`
   - `property_state`
   - `property_zip`
   - `source_detail_url`
   - optional mailing address if later available from an official county source
2. Use a provider whose terms permit batch contact enrichment for real-estate owner lookup and who supplies source/provenance or confidence indicators. Practical categories:
   - Real-estate skip-trace vendors: BatchSkipTracing, REISkip, PropStream/BatchLeads-style skip trace exports, DataTree/First American, ATTOM/DataTrace-type products.
   - General B2C/identity/contact append vendors with permissible-use controls: TLOxp/TransUnion-style products, LexisNexis/Accurint-type products, Whitepages Pro/Verisk-type products, People Data Labs-style append only if terms allow use case.
   - Direct-mail/phone append bureaus that provide TCPA/DNC hygiene options.
3. Require the provider to return at least:
   - candidate phone(s) with phone type if available
   - candidate email(s) if available
   - match confidence or source confidence
   - match basis/address history when available
   - DNC/wireless flags if available
   - last seen/verified date if available
4. Do not accept provider contacts blindly. Apply the score model and gates below.

### Phase E — Human QA / manual lookup lane

Use manual lookup for:

- Top-value rows where provider returns no match.
- Provider matches under the import threshold but with promising partial evidence.
- Estate/heirs rows requiring identity context.
- Common names with multiple local candidates.

Permitted manual sources/options:

- Official Clay County Property Appraiser / QPublic parcel pages.
- Clay County official records / deed records for owner spelling, mailing address, and recent transfers.
- Florida corporate records only for rows later discovered to be entity-linked; this plan's queue is human-owner focused.
- Obituaries/probate notices for heirs context, with no outreach unless a legal/heir contact is verified and compliant.
- Public social/profile pages only as context; do not scrape or automate.
- People-search sites such as TruePeopleSearch may be used only manually by a human in a browser if allowed by the site terms and without automation, captcha bypass, scraping, or bulk extraction. Record only the evidence needed for verification; relatives/associates remain context-only.

Manual lookup minimum standard:

- Name match plus at least one of: APN/property address overlap, mailing/property address history, Clay County/Keystone Heights location history, or official record link to the parcel owner.
- For common names, require two independent non-conflicting signals before accepting a phone/email.
- For heirs/estate rows, require a documented current owner, personal representative, or directly supported heir link; otherwise leave unenriched/review.

## 3. Batch sizes and cadence

Recommended total execution design:

- Batch size for provider export: 100 rows per file, 9 files total (8 x 100 + 1 x 24). This keeps QA/reconciliation manageable and limits rework if a provider format is wrong.
- Provider pilot: first 25 rows before full run. Validate returned schema, DNC fields, confidence behavior, match quality, and import compatibility.
- Human QA batch size: 25 rows per reviewer per session. Larger manual batches tend to increase false positives.
- High-value manual sprint: first 50 rows by acreage/priority after provider pilot.
- Daily import cadence: import only rows passing gates, then review app-visible unmatched/rejected rows before the next batch.

Suggested batch labels:

- `KH-20260628-PILOT-025`
- `KH-20260628-PROV-001` through `KH-20260628-PROV-009`
- `KH-20260628-MANUAL-HV-001`
- `KH-20260628-HEIRS-001`

## 4. Input schema

### Canonical provider/manual input

```csv
batch_id,parcel_id,parcel_id_display,owner_name,entity_type,property_address,property_city,property_state,property_zip,use_code,use_description,acreage,legal_description,source_detail_url,manual_lookup_search_terms
```

Field rules:

- `parcel_id`: Clay APN from queue, e.g. `004655-000-00`; primary merge key for CSV queue.
- `parcel_id_display`: formatted parcel ID, e.g. `26-08-23-004655-000-00`; secondary/public key.
- `owner_name`: exact queue owner; do not normalize away suffixes in the source field.
- `entity_type`: preserve `individual-owner`, `estate-heirs`, etc.
- `source_detail_url`: public parcel anchor required for every row.
- `manual_lookup_search_terms`: use as reviewer aid, not as evidence by itself.

## 5. Output schema

### Canonical enrichment output for review/import

```csv
batch_id,parcel_id,parcel_id_display,owner_name,candidate_phone,candidate_phone_type,candidate_email,contact_confidence,confidence_band,contact_source,contact_source_url,match_basis,verified_at,reviewer,lookup_status,do_not_contact_status,opt_out_status,suppression_reason,enrichment_notes
```

Required output semantics:

- `candidate_phone`: E.164 or normalized US format. Blank unless actually found.
- `candidate_phone_type`: `mobile`, `landline`, `voip`, `unknown`, or blank.
- `candidate_email`: blank unless actually found.
- `contact_confidence`: integer 0-100.
- `confidence_band`: one of `verified`, `high`, `medium_review`, `low_reject`, `no_match`, `suppressed`.
- `contact_source`: provider name or `manual public lookup`; avoid vague values like `internet`.
- `contact_source_url`: if source terms allow storing it; otherwise store provider batch/report ID.
- `match_basis`: concise evidence chain tying candidate to the parcel owner and Clay parcel anchor.
- `verified_at`: ISO timestamp/date of reviewer/provider validation.
- `lookup_status`: one of `accepted_import_ready`, `needs_second_review`, `provider_no_match`, `manual_no_match`, `rejected_low_confidence`, `suppressed`, `stale_public_owner_review`.
- `do_not_contact_status`: `clear`, `dnc`, `unknown`, or `not_checked`.
- `opt_out_status`: `clear`, `opted_out`, `unknown`, or `not_checked`.
- `suppression_reason`: required when DNC/opt-out/bad/wrong/deceased-only/suppressed.

### LandFlip OS import-compatible minimal columns

For rows that pass acceptance gates, prepare an import CSV with these headers because `applySkipTraceImport` maps them:

```csv
parcel_id,owner_name,candidate_phone,candidate_email,contact_confidence,contact_source,contact_source_url,match_basis,verified_at,do_not_contact_status,opt_out_status,notes
```

Notes:

- `candidate_phone` maps to app `ownerPhone`.
- `candidate_email` maps to app `ownerEmail`.
- `contact_confidence` maps to `skipTraceConfidence` when imported.
- Rows below 70 confidence, DNC/opt-out, bad number, wrong owner, no match, or low/weak status are rejected by the app's positive-enrichment logic and should not be placed in the accepted import file.

## 6. Confidence scoring model

Use a 100-point score. Keep the raw score and the band.

Base identity evidence:

- +30 exact or near-exact owner name match, including suffix/spouse where applicable.
- +20 address-history match to property address or official mailing address.
- +15 Clay County/Keystone Heights geographic tie when address history is incomplete.
- +15 provider high-confidence match or two independent manual sources agreeing.
- +10 recent verification/date quality, e.g. seen/validated in last 24 months.
- +10 phone/email quality: mobile/direct phone, deliverable email, or provider-labeled current contact.

Risk deductions:

- -25 common-name collision without unique address/APN tie.
- -20 suffix/generation conflict, spouse-only mismatch, or middle-initial conflict.
- -20 only relative/associate found, not the owner.
- -25 estate/heirs row with no documented personal representative/heir authority.
- -30 stale official owner or ownership mismatch.
- -100 DNC/opt-out for outreach import, wrong owner, bad number, fabricated/unverifiable source, or captcha/anti-bot bypass involved.

Bands:

- `verified` / 90-100: official parcel anchor + exact owner match + direct address/history or provider current-contact evidence. Import-ready if no suppression.
- `high` / 80-89: strong name + location/address evidence; one minor gap. Import-ready if no suppression and reviewer note explains gap.
- `medium_review` / 70-79: plausible but needs second review before import. Import only after second reviewer upgrades/approves.
- `low_reject` / 1-69: do not import to ownerPhone/ownerEmail; keep as research note only if useful.
- `no_match` / 0: no usable contact.
- `suppressed`: contact may exist but cannot be used due to DNC/opt-out/bad/wrong/deceased-only/compliance reason.

Acceptance threshold:

- Default import threshold: `contact_confidence >= 80` and `do_not_contact_status=clear` or acceptable provider-cleared equivalent.
- Conditional second-review threshold: 70-79 only if a reviewer documents exact match evidence and confirms no suppression.
- Never import a row with confidence below 70; LandFlip OS rejects these as non-positive enrichment.

## 7. Compliance gates

Gate 1 — Source legality/terms:

- Provider/manual source must be legally accessible and permitted for the enrichment use case.
- No automated scraping of people-search sites unless the source provides an authorized API/contract permitting it.
- No captcha solving, browser automation against anti-bot pages, or block evasion.

Gate 2 — Parcel anchor:

- Confirm the public Clay parcel record and owner before accepting any contact.
- If public owner changed, route to source refresh rather than enriching stale owner.

Gate 3 — Identity match:

- Require owner-name match plus address/location/official-record support.
- Relatives/associates are not importable owner contacts without independent owner/legal-representative proof.

Gate 4 — Contact usability:

- Normalize phone/email.
- Remove obviously malformed data.
- Prefer mobile/direct numbers; landline acceptable if tied to owner/address.
- Keep disconnected/bad numbers out of accepted imports.

Gate 5 — Suppression/privacy:

- Check provider DNC/wireless/opt-out fields if available.
- Mark `do_not_contact_status` and `opt_out_status` explicitly.
- Suppressed rows stay out of accepted import and call queues.

Gate 6 — Outreach separation:

- Enrichment team does not call/text/email owners.
- Outreach can start only after contacts are imported, buyer proof and parcel screen are ready, and LandFlip OS shows the record as call-ready under the team's operating rules.

Gate 7 — Auditability:

- Every accepted row must include `contact_source`, `match_basis`, `verified_at`, and reviewer/provider batch ID.
- Keep rejected/no-match rows for audit and re-run planning, but do not place unverified contacts in active owner fields.

## 8. Provider/manual option recommendation

Best practical approach for all 823 rows:

1. Run a 25-row pilot with a compliant paid skip-trace provider that returns confidence, phone type, DNC/opt-out or hygiene fields, and match explanation.
2. QA the pilot manually against official Clay parcel anchors.
3. If false positives are acceptable, process the remaining 799 rows in 100-row batches.
4. Apply deterministic scoring and suppression gates.
5. Manually review:
   - all 70-79 confidence rows,
   - all high-value provider no-matches,
   - all estate/heirs rows,
   - all common-name or address-conflict records.
6. Produce two outputs per batch:
   - accepted import file for LandFlip OS,
   - rejected/review file with reasons.

Manual-only fallback:

- If no provider is available, execute 25-row manual sprints with public parcel anchors and permitted manual people-search use. Expect materially slower throughput: roughly 30-60 rows/day per careful reviewer depending on ambiguity. For 823 rows, plan 14-28 reviewer-days plus QA.

## 9. Merge into LandFlip OS

### Accepted contacts

1. Build `artifacts/keystone-contact-enrichment/keystone_skiptrace_accepted_YYYYMMDD.csv` using the import-compatible minimal columns:

```csv
parcel_id,owner_name,candidate_phone,candidate_email,contact_confidence,contact_source,contact_source_url,match_basis,verified_at,do_not_contact_status,opt_out_status,notes
```

2. Use `parcel_id` as the primary key because the current CSV queue uses Clay APN in `parcel_id`.
3. Preserve `parcel_id_display` in notes or a supplemental audit file if the import screen does not accept it.
4. Import through LandFlip OS skip-trace import. The app maps:
   - `candidate_phone` / `owner_phone` -> `ownerPhone`
   - `candidate_email` / `owner_email` -> `ownerEmail`
   - `contact_confidence` -> `skipTraceConfidence`
   - `contact_source`, `contact_source_url`, `match_basis`, `verified_at` -> provenance fields/notes
5. After import, verify summary counts:
   - imported rows count
   - matched rows count
   - created rows count should be expected/low if candidate parcels are already loaded
   - unmatched rows count should be reviewed before next batch
6. Spot-check the app for 5-10 accepted rows per batch to confirm contacts appear only on the intended parcel/owner.

### Rejected/review contacts

Write rejected or non-importable records to:

- `artifacts/keystone-contact-enrichment/keystone_skiptrace_rejected_YYYYMMDD.csv`
- `artifacts/keystone-contact-enrichment/keystone_skiptrace_needs_review_YYYYMMDD.csv`

Do not import rejected contacts into ownerPhone/ownerEmail. If useful, preserve low-confidence clues only in an audit/research notes file outside active call fields.

### Queue status update

After accepted import, create an updated enrichment queue snapshot with status fields:

- `contact_confidence`
- `confidence_band`
- `contact_source`
- `match_basis`
- `lookup_status`
- `do_not_contact_status`
- `opt_out_status`
- `routing_queue`
- `next_action`

Recommended status transitions:

- Accepted import-ready -> `routing_queue=ownerContactReady`, `next_action=verify buyer-backed call readiness; no outreach until CRM gate clears`.
- Needs second review -> `routing_queue=contactReview`, `next_action=second reviewer identity/suppression check`.
- No match -> `routing_queue=manualLookup` or `defer`, `next_action=manual lookup or re-run with alternate provider later`.
- Suppressed -> `routing_queue=suppressed`, `next_action=no outreach`.
- Estate/heirs unresolved -> `routing_queue=heirsReview`, `next_action=probate/heir identity verification only`.

## 10. QA checklist per batch

Before accepting/importing a batch:

- Row count matches exported batch count.
- Every accepted row has a phone or email.
- No accepted row has `contact_confidence < 70`.
- Default accepted rows are `>=80`, with documented second review for any 70-79 row.
- No accepted row contains `do_not_contact_status=dnc`, `opt_out_status=opted_out`, bad number, wrong owner, or no-match status.
- Every accepted row has `contact_source`, `match_basis`, and `verified_at`.
- Estate/heirs rows have documented authority/identity basis or remain in review.
- Random 10% sample, minimum 5 rows, checked against Clay parcel source detail URLs.
- Unmatched/rejected files retained.
- LandFlip OS import summary reviewed and unmatched rows reconciled.

## 11. Expected deliverables from execution

For each provider/manual batch:

- Provider/manual raw return file, stored unchanged.
- Scored review file with all rows and reasons.
- Accepted LandFlip OS import CSV.
- Rejected/no-match/suppressed CSV.
- Batch QA notes with sample checks and reviewer initials.

Final campaign-level artifacts:

- `keystone_contact_enrichment_master_scored.csv`
- `keystone_skiptrace_accepted_all.csv`
- `keystone_skiptrace_rejected_all.csv`
- `keystone_contact_enrichment_audit_log.md`
- Updated app-visible queue snapshot, if the team chooses to persist statuses outside the app import.

## 12. Practical operating recommendation

Use a compliant provider for the first pass, not a manual-only sprint. With 823 rows, provider-first plus QA is the best balance of scale, accuracy, and compliance. Manual lookup should be reserved for high-value no-matches, ambiguous matches, and heirs/estate rows. Keep all contacts out of active LandFlip OS owner fields until the public parcel anchor, identity match, confidence threshold, and suppression gates all pass.
