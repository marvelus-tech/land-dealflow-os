---
title: Hawaii Builder Permit and License Verification - Phase 2
created: 2026-07-08
status: manual-official-portal-verification-needed
tags: [landflip, hawaii, builders, permits, licenses]
---
# Hawaii Builder Permit and License Verification — Phase 2

## Verdict
County/State verification paths were identified and attached to every Hawaii builder row in `builder_signals.json`. Automation access was mixed: Honolulu DPP and Maui MAPPS were reachable; State PVL, Hawaii County, and Kauai entry points blocked automated checks or require manual portal review. No row is upgraded beyond `buyerValidation` / `needs-call-confirmation`.

## Official verification resources
- **State of Hawaii DCCA PVL contractor license search** — https://mypvl.dcca.hawaii.gov/public-license-search/ — Search company/qualifying responsible managing employee/license number; automation returned 403, so operator/manual verification required.
- **Honolulu DPP building permit search** — https://dppweb.honolulu.gov/DPPWeb/default.aspx?PossePresentation=BuildingPermitSearch — Search Oahu/Honolulu permits by contractor, address, TMK, or permit number where available.
- **Hawaii County EPIC / building permits** — https://hawaiicounty.ehawaii.gov/epic/ — Search Big Island permits manually; automation returned 403.
- **County of Hawaii Building Division permits page** — https://www.hawaiicounty.gov/departments/public-works/building-division/building-permits — Big Island building permit entry point; automation returned 403.
- **Maui MAPPS permitting portal** — https://www.mauicounty.gov/2479/MAPPS — Search Maui County permit/license/project records; HTTP 200 verified 2026-07-08.
- **Kauai Building Division / permitting** — https://www.kauai.gov/Government/Departments-Agencies/Public-Works/Building-Division — Kauai permit entry point; automation returned 403.

## Operator verification steps
1. Open the DCCA PVL search and search exact legal/company name plus any license number found in source snippets.
2. Open the county portal matching the builder island/county. Search company name, principal if known, permit applicant/contractor, and recent permit keywords.
3. If a permit/license match is found, append the permit/license URL, number, date, permit type, and jurisdiction to that builder row before treating it as permit-backed.
4. Even with permit/license proof, keep the row as `needs-call-confirmation` until the lot buy box is captured.

## County mapping
- Oahu/Honolulu: Honolulu DPP building permit search.
- Hawaii Island/Big Island: Hawaii County EPIC/building permits.
- Maui/Lanai/Molokai: Maui MAPPS.
- Kauai: Kauai Building Division/permitting.

## Guardrail
A directory row, license row, or permit row proves public operating evidence only. It does not prove the builder buys off-market vacant lots.
