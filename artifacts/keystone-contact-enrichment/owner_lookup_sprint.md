# Keystone Heights Owner Contact Enrichment Sprint Packet

Purpose: manually/provider skip-trace the 823 Keystone Heights owner rows without scraping people-search sites or fabricating contact data.

## Inputs and outputs

- Input queue: `data/real/duval-keystone-fl/keystone_heights_owner_contact_enrichment_queue.csv`
- Batch packet: `artifacts/keystone-contact-enrichment/owner_lookup_batches.csv`
- Paste-back target: update the original queue fields or an import sheet with the schema below.

## Batch plan

Every owner row is assigned exactly once. Work in CSV order by `rank`.

- Batch 1: ranks 1-103, 103 rows
- Batch 2: ranks 104-206, 103 rows
- Batch 3: ranks 207-309, 103 rows
- Batch 4: ranks 310-412, 103 rows
- Batch 5: ranks 413-515, 103 rows
- Batch 6: ranks 516-618, 103 rows
- Batch 7: ranks 619-721, 103 rows
- Batch 8: ranks 722-823, 102 rows

## Hard rules

- Do not fabricate phones, emails, addresses, aliases, or confidence values.
- Do not scrape people-search websites. Use only permitted/manual sources, licensed providers, official public records, direct owner-provided callbacks, or approved data vendors.
- Do not call, text, or email a candidate contact until identity is verified to the confidence threshold below.
- Preserve `parcel_id` exactly. It is the join key for paste-back/import.
- If a lookup produces no verified contact, leave `candidate_phone` and `candidate_email` blank and set `confidence_band=unverified`.
- Respect DNC/opt-out indicators immediately. Mark and exclude from outreach.

## Lookup workflow

For each row:

1. Copy `manual_lookup_search_terms` from the batch CSV.
2. Check official parcel/property context first: owner name, parcel id, situs/property address, county, and acreage.
3. Run the query through an approved manual lookup/provider workflow.
4. Compare candidate results against at least two identity anchors where possible:
   - exact or near-exact owner name;
   - Keystone Heights / Clay County / nearby Florida address link;
   - parcel/property address link;
   - mailing address or public-record association;
   - age/relative/co-owner clues only as secondary support.
5. Record only the best verified phone/email candidates. If several are plausible but unresolved, do not guess; mark low/unverified and explain `match_basis`.
6. Paste back using the row-specific `paste_back_format` or the import schema below.

## Confidence bands

- `high`: strong identity match with multiple anchors, e.g. owner name plus current/previous address link to the parcel/mailing record, or provider result explicitly tied to the parcel owner. Suitable for outreach after DNC/opt-out checks.
- `medium`: likely owner with name match and one supporting location/public-record anchor, but not enough for highest confidence. Human review required before outbound calls.
- `low`: possible match only; weak, stale, conflicting, or single-anchor evidence. Do not call; queue for additional verification.
- `unverified`: no reliable candidate, conflicting candidates, or only unpermitted/unusable source found. Leave contact fields blank.

Recommended numeric `contact_confidence` values:

- high: 90-100
- medium: 70-89
- low: 40-69
- unverified: 0-39, with 0 for no candidate

## Verification-first call boundary

Before any phone call or SMS:

- `confidence_band` must be `high`, or a manager must approve a `medium` record after reviewing `match_basis`.
- `do_not_contact_status` must be `clear` or `unknown` with no DNC evidence from the approved workflow. If DNC is found, set `do_not_contact_status=dnc` and do not call.
- `opt_out_status` must not be `opted_out`.
- The operator must verify they are contacting the parcel owner or authorized party at the start of any live conversation.
- If the reached person says wrong party or asks not to be contacted, end politely and update `do_not_contact_status=wrong_party` or `opt_out_status=opted_out`.

## Paste-back/import schema

Required columns for import/paste-back:

- `parcel_id`: exact parcel id from batch CSV; required join key.
- `owner_name`: owner name as supplied; do not overwrite with guessed aliases.
- `candidate_phone`: E.164 or provider-exported phone; blank if unverified.
- `candidate_email`: verified/provider-exported email; blank if unverified.
- `contact_confidence`: integer 0-100.
- `confidence_band`: one of `unverified`, `low`, `medium`, `high`.
- `contact_source`: one of `manual_public_record`, `licensed_provider`, `owner_callback`, `none`, or another approved internal source label.
- `match_basis`: concise evidence, e.g. `name+mailing address`, `name+parcel address+provider`, `no verified match`.
- `do_not_contact_status`: one of `unknown`, `clear`, `dnc`, `wrong_party`.
- `opt_out_status`: one of `unknown`, `clear`, `opted_out`.
- `reviewer_initials`: operator initials.
- `reviewed_at`: review date in `YYYY-MM-DD` format.

Row-level template embedded in `owner_lookup_batches.csv`:

```text
parcel_id=<parcel>; owner_name=<owner>; candidate_phone=; candidate_email=; contact_confidence=0; confidence_band=unverified|low|medium|high; contact_source=manual_public_record|licensed_provider|owner_callback|none; match_basis=; do_not_contact_status=unknown|clear|dnc|wrong_party; opt_out_status=unknown|clear|opted_out; reviewer_initials=; reviewed_at=YYYY-MM-DD
```

## QA checklist

- Confirm total completed rows equals 823.
- Confirm each `parcel_id` appears once in the paste-back/import file.
- Confirm no contacts are entered without a documented `contact_source` and `match_basis`.
- Confirm all low/unverified rows have blank phone/email unless a provider supplied a candidate explicitly marked not-for-outreach.
- Spot-check 10 rows per batch for source policy compliance and identity anchors.
- Reconcile DNC/opt-out statuses before exporting any outreach list.

## Batch counts generated

- Batch 1: 103 rows
- Batch 2: 103 rows
- Batch 3: 103 rows
- Batch 4: 103 rows
- Batch 5: 103 rows
- Batch 6: 103 rows
- Batch 7: 103 rows
- Batch 8: 103 rows
