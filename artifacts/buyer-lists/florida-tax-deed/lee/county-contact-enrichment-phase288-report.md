# Phase 288 county/city contact enrichment report

Date: 2026-07-22

## Purpose

Follow-up to public web OSINT: try county/city sources that can expose phone/email through permit, business-tax, code-enforcement, Notice of Commencement, planning/development, clerk/legal-notice, and mailing-address routes.

## Methods applied to each Lee buyer row

For all 27 buyer rows, searched exact buyer name plus:

- `permit` + `phone`
- `email` + `permit`
- `business tax receipt`
- `local business tax`
- `notice of commencement`
- `code enforcement`
- `development order`
- `applicant` + `email`
- permit report terms including `Bus Phone`, `Cell Phone`, `Billing Contact On Permit`, and `New Projects Report`
- mailing-address variants where useful

Specific public record classes checked or searched:

- City/county permit and monthly new-project reports
- Local business tax / business tax receipt references
- Code enforcement dockets/agendas
- Clerk/legal notice PDFs
- Notice of Commencement references
- Planning/development-order agenda packets
- Property appraiser parcel evidence where available

## Verified promoted contact

### 001 — ESMER MACEDO

Promoted phone: `+1 239-771-0343`

Source: City of Fort Myers Community Development Department New Projects Reports.

- `https://fortmyers.gov/DocumentCenter/View/23751/202409---New-Projects`
  - Page 33: `Billing Contact On Permit: MACEDO, ESMER / ESMER MACEDO / Bus Phone:239.771.0343 / 512 THOMAS Ave. / FORT MYERS, FL 33905 / BLDR-046589-2024`
  - Page 106: `Billing Contact On Permit: MACEDO, ESMER / ESMER MACEDO / Bus Phone:239.771.0343 / 512 THOMAS Ave. / FORT MYERS, FL 33905 / POOL-046794-2024`
- `https://fortmyers.gov/DocumentCenter/View/17072/202102---new-projects`
  - Page 65: `Billing Contact On Permit: MACEDO, ESMER / ESMER MACEDO / Bus Phone:239.771.0343 / BLDR-003968-2021`
- `https://fl-fortmyers.civicplus.com/DocumentCenter/View/25868/202604---New-Projects`
  - Page 140: `Billing Contact On Permit: MACEDO, ESMER / ESMER MACEDO / Bus Phone:239.771.0343 / SITC-062032-2026`

Reason promoted: official city permit reports tie the phone directly to the buyer name as billing contact on multiple permits.

## Rejected/non-promoted examples

- People-search/Whitepages snippets for Esmer Macedo exposed alternate numbers but were rejected because the source class is people-search, not official/property/business record.
- VVV Investments legal-notice snippets exposed attorney email/phone in foreclosure/legal notice context; rejected as counsel/notice contact, not buyer-owned contact.
- Florida Brothers legal notice snippets exposed attorney/agency/public-notice contacts and Lee County public phone numbers; rejected as third-party/government/counsel contacts.
- LD Development search results exposed Rio Rancho/New Mexico planning agent/government emails; rejected because they do not tie to the Florida Lee buyer entity/contact.
- Daybreak Investments search surfaced Lowndes-law planning counsel email in an unrelated/indirect development file; rejected as attorney/agent context, not buyer-owned callable contact.
- Contractor phones in permit reports were rejected unless the buyer itself was listed as billing contact/applicant/owner.

## Outcome

- Total buyer rows checked: 27
- Existing verified contact retained: Magaly Cruz Pineiro phone/email
- New verified contact promoted: Esmer Macedo phone
- Remaining rows with no verified county/city buyer-owned phone/email: 25

## Next route if more contacts are required

The web-indexed county/city route has mostly exhausted. The next higher-yield route is direct portal querying by parcel/address and document download where portals are not indexed:

1. pull exact parcel/STRAP/property address from RealTDM tax-deed case;
2. query city/county permit portal by parcel/address;
3. download permit application PDFs and Notice of Commencement PDFs;
4. scrape applicant/owner/billing-contact fields;
5. only promote phone/email tied to buyer/entity/manager/owner/applicant.
