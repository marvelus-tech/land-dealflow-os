import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyCallOutcome,
  applySkipTraceImport,
  buildBuyerValidationCommandCenter,
  buildExecutionConveyor,
  buildOperatorSessionMode,
  buildSellerSearchInstructions,
  evaluateBuilderBuyBox,
  exportMatchedSellerBatchCsv,
  scoreBuyerValidation,
} from '../src/core.mjs';

const callSheet = JSON.parse(fs.readFileSync('data/real/knoxville/buyer_call_sheet.json', 'utf8'));
const rows = callSheet.rows;
const appSource = fs.readFileSync('src/app.mjs', 'utf8');
const coreSource = fs.readFileSync('src/core.mjs', 'utf8');
const stylesSource = fs.readFileSync('src/styles.css', 'utf8');

const center = buildBuyerValidationCommandCenter(rows, []);
assert.ok(center.summary.total >= 20, 'buyer validation command center should render at least a 20-builder batch');
assert.equal(center.summary.validated, 0, 'permit signals alone must not validate a buyer');
assert.equal(center.summary.callReady, 8, 'human-review rows stay out of the call-ready count');
assert.ok(center.summary.averageCompleteness < 20, 'empty buy boxes should be visibly incomplete');
assert.equal(center.next.name, 'BALL HOMES');

const ball = rows.find(row => row.builderId === 'knoxville-builder-ball-homes');
const permitOnly = scoreBuyerValidation({ ...ball, callStatus: 'validated_buy_box' });
assert.equal(permitOnly.sellerEligible, false, 'validated status without required buy-box fields cannot unlock seller search');
assert.ok(permitOnly.buyBox.missing.includes('Target geography'));
assert.ok(permitOnly.buyBox.missing.includes('Max acquisition price'));

const partialBuyBox = evaluateBuilderBuyBox({
  geography: 'West Knoxville',
  lotSize: '0.25–1 ac',
  maxPrice: 65000,
});
assert.equal(partialBuyBox.complete, false);
assert.ok(partialBuyBox.missing.includes('Close speed'));
assert.ok(partialBuyBox.missing.includes('Package recipient'));
assert.ok(partialBuyBox.missing.includes('Deal-killer criteria'));

const saved = [{
  builderId: ball.builderId,
  callStatus: 'validated_buy_box',
  lastContacted: '2026-06-18',
  outreach: {
    phone: { contacted: true, at: '2026-06-18' },
    email: { contacted: true, at: '2026-06-18' },
  },
  buyBox: {
    geography: 'West Knoxville / Karns / Hardin Valley',
    lotSize: '0.25–1.0 acres',
    maxPrice: 65000,
    closeSpeed: '14–30 days',
    packageRecipient: 'Land acquisitions desk via customerservice@ballhomes.com',
    utilitiesAccess: 'paved road, water/electric nearby, sewer preferred',
    productType: 'single-family residential lots',
    dealKillers: ['steep slope', 'flood zone', 'no road frontage', 'title defects'],
  },
}];
const validated = buildBuyerValidationCommandCenter(rows, saved);
assert.equal(validated.summary.validated, 1);
const validatedBall = validated.items.find(item => item.builderId === ball.builderId);
assert.equal(validatedBall.validation.sellerEligible, true);
assert.equal(validatedBall.validation.buyBox.complete, true);
assert.equal(validatedBall.outreach.phone.contacted, true, 'phone outreach state should persist independently from buy-box validation');
assert.equal(validatedBall.outreach.email.contacted, true, 'email outreach state should persist independently from buy-box validation');
assert.ok(validatedBall.validation.breakdown.some(item => item.label === 'Outreach logged' && item.value === 4), 'validation score tooltip needs outreach math');
assert.match(validatedBall.validation.tier, /Tier 1/);
assert.equal(validatedBall.sellerSearch.eligible, true);
assert.ok(validatedBall.sellerSearch.criteria.some(item => item.includes('West Knoxville')));
assert.ok(validatedBall.sellerSearch.criteria.some(item => item.includes('$65,000')));
assert.equal(validatedBall.sellerSearch.offerCeiling, 53300);

const lockedSearch = buildSellerSearchInstructions({ ...ball, buyBox: saved[0].buyBox, callStatus: 'spoke_to_decision_maker' });
assert.equal(lockedSearch.eligible, false, 'complete fields still require explicit validated_buy_box call status');

assert.match(appSource, /let selectedValidationBuilderId = '';/, 'validation queue must not share the permit-builder selection state');
assert.match(appSource, /data-select-validation-builder/, 'validation queue rows need their own click target');
assert.match(appSource, /dataset\.selectValidationBuilder/, 'validation queue click handler must persist the selected validation row');
assert.match(appSource, /function captureBuilderInteractionViewport\(\)[\s\S]{0,260}queueScrollTop: queue\?\.scrollTop \|\| 0/, 'selecting a builder must capture the current page and queue scroll position');
assert.match(appSource, /function restoreBuilderInteractionViewport\(viewport = \{\}\)[\s\S]{0,420}window\.scrollTo\(viewport\.scrollX \|\| 0, viewport\.scrollY \|\| 0\)[\s\S]{0,220}queue\.scrollTop = viewport\.queueScrollTop \|\| 0/, 'selecting a builder must restore the operator viewport instead of snapping to the top');
assert.match(appSource, /selectedButton\?\.focus\?\.\(\{ preventScroll: true \}\)/, 'selected validation row focus should be restored without causing browser auto-scroll');
assert.match(appSource, /renderBuilderListEnginePanel\(\{ preserveViewport: true \}\);/, 'builder queue interactions should rerender in place with viewport preservation');
assert.match(appSource, /event\.preventDefault\(\);[\s\S]{0,120}selectedValidationBuilderId = validationBuilderButton\.dataset\.selectValidationBuilder/, 'builder row selection should be an in-place state update, not browser navigation');
assert.doesNotMatch(appSource, /class="validation-queue-item[\s\S]{0,220}data-select-builder=/, 'validation rows must not use the permit-builder selector or they reset to the top row');
assert.match(appSource, /data-copy-validation-email/, 'validation focus card must expose a Copy email action next to Draft email');
assert.match(appSource, /<a href="#" class="copy-builder-email-address"/, 'selected builder email copy control must render as an inline anchor, not a button');
assert.doesNotMatch(appSource, /<button[^>]+class="copy-builder-email-address"/, 'selected builder email copy control must not be a button because global button CSS adds pill chrome');
assert.match(appSource, /event\.preventDefault\(\);[\s\S]{0,180}dataset\.copyBuilderEmailAddress/, 'copyable email anchor should not jump the page when clicked');
assert.match(appSource, /Email address copied\./, 'clicking selected builder email address should confirm clipboard copy');
assert.match(stylesSource, /main \.copy-builder-email-address[\s\S]{0,360}border-radius: 0 !important;[\s\S]{0,220}background: transparent !important;[\s\S]{0,220}color: #1f5bff !important;[\s\S]{0,220}cursor: copy !important;/, 'copyable email address should look like accent inline copy text, not a pill button');
assert.match(stylesSource, /main \.copy-builder-email-address:hover \{ color: var\(--black\) !important; \}/, 'copyable email address should turn black on hover');
assert.match(appSource, /class="contact-state-toggle[\s\S]{0,260}data-toggle-validation-contact="phone"/, 'selected builder phone state badge must be the toggle');
assert.match(appSource, /class="contact-state-toggle[\s\S]{0,260}data-toggle-validation-contact="email"/, 'selected builder email state badge must be the toggle');
assert.match(appSource, /class="contact-icon-toggle[\s\S]{0,260}data-toggle-validation-contact="phone"/, 'queue phone state must be a compact icon toggle');
assert.match(appSource, /class="contact-icon-toggle[\s\S]{0,260}data-toggle-validation-contact="email"/, 'queue email state must be a compact icon toggle');
assert.match(appSource, /<svg class="outreach-svg"[\s\S]{0,220}<path fill="currentColor"/, 'outreach controls should use solid currentColor SVG icons, not text glyphs or bordered icon boxes');
assert.doesNotMatch(appSource, /contact-action/, 'selected builder must not duplicate outreach state with separate logged buttons');
assert.doesNotMatch(appSource, />Mark called<|>Mark emailed<|>I called them<|>I contacted them by email</, 'outreach controls should be compressed into state badges/icons');
assert.match(appSource, /scoreBreakdownRows/, 'validation score must expose progressive-disclosure breakdown rows');
assert.match(appSource, /queue-source-link/, 'call queue rows must carry source-proof links from the old call-sheet list');
assert.match(appSource, /queue-csv-link[\s\S]{0,220}activeState\.summary\.entries\[0\]\.csvUrl/, 'call queue header must preserve the active market CSV export');
assert.match(appSource, /validation-source-proof/, 'selected builder card must preserve source type, contact status, confidence, and top permit proof');
assert.match(appSource, /selected-permit-proof/, 'selected builder proof drawer must preserve permit evidence rows');
assert.match(appSource, /permitVerificationUrl/, 'permit proof rows should build direct source-verification URLs');
assert.match(appSource, /PERMITNUMBER = '\$\{String\(permitNumber\)/, 'ArcGIS permit proof links should pre-filter by permit number');
assert.match(appSource, /Verify permit/, 'permit proof links should be labeled for operator verification, not generic source');
assert.doesNotMatch(appSource, /class="queue-rank"/, 'call queue must not show duplicate number ranks because sort order already follows validation score');
assert.doesNotMatch(appSource, /Phone not logged|Email not logged/, 'selected outreach labels should not repeat channel names beside channel icons');
assert.doesNotMatch(appSource, /Call office|>Draft email<|Copy email|Source proof/, 'selected builder actions should use restrained icon-led labels and Website for source URL');
assert.match(appSource, /aria-label="Draft email"/, 'draft email action should remain accessible when visually icon-only');
assert.match(appSource, /<span>Call<\/span>/, 'phone CTA should be a concise icon plus Call button');
assert.match(appSource, /<span>Website<\/span>/, 'source URL action should be labelled as a website link, not source proof');
assert.doesNotMatch(appSource, /Landscaper\/vendor sourcing|site-prep network|vendor-chip-grid|builder-vendor-panel/, 'landscaper/vendor sourcing typo section must stay removed');
assert.doesNotMatch(stylesSource, /vendor-chip-grid|builder-vendor-panel/, 'deleted landscaper/vendor surface must not leave dead CSS selectors behind');
assert.doesNotMatch(appSource, /renderKnoxvilleBuyerCallSheet|Source-backed call sheet|buyer-call-sheet-list/, 'duplicate source-backed call sheet section must be removed after consolidation');
assert.match(appSource, /Ranked by validation leverage: permit activity/, 'call queue ranking tooltip must explain validation leverage');
assert.match(appSource, /navigator\.clipboard\?\.writeText\?\.\(payload\)/, 'Copy email must copy the buy-box email payload, not just open mailto');
assert.match(appSource, /const validationEmailBody = fallbackEmail\.body;/, 'Draft email mailto should use the generated bullet-list body rather than stale row emailDraft body');
assert.match(appSource, /const body = fallbackEmail\.body;/, 'Copy draft should always copy the generated bullet-list buy-box questions');
assert.match(appSource, /function hashToView\(hash = location\.hash\)/, 'router should parse only valid app-route hashes');
assert.match(appSource, /function scrollToPageTop\(\)[\s\S]{0,260}root\.style\.scrollBehavior = 'auto';[\s\S]{0,180}window\.scrollTo\(0, 0\)/, 'page transitions should reset visitors immediately to the top of the destination page');
assert.match(appSource, /function navigateToView\(view\)[\s\S]{0,180}setActiveView\(view, \{ scrollToTop: true \}\)/, 'data-view navigation should centralize top-scroll behavior');
assert.match(appSource, /const view = hashToView\(\);\n    if \(view\) setActiveView\(view, \{ scrollToTop: true \}\);/, 'hashchange should only switch panels for valid app routes and leave same-page anchors alone');
assert.match(appSource, /navigateToView\(view\)/, 'clicking app navigation should use the scroll-safe route helper');
assert.match(appSource, /minimum per pull/, 'Builders UX should explain the builder batch floor');
assert.match(appSource, /minimum per pull/, 'Builders market summary should expose the batch floor without a duplicate stat band');
assert.doesNotMatch(appSource, />Next money action<|NEXT MONEY ACTION/, 'Builders page must not repeat selected-builder guidance in a separate Next Money Action card');
assert.doesNotMatch(appSource, /validation-next-card/, 'redundant next-action card component should stay removed');
assert.doesNotMatch(appSource, /Call queue first\. Seller search second\./, 'second hero headline should stay removed; the page needs one top command header');
assert.match(appSource, /builder-market-workbench/, 'top Builders IA should be a market workbench, not a static metric strip');
assert.match(appSource, /market-toggle-grid/, 'priority states should be exposed as top-level market toggles');
assert.match(appSource, /stateOrder = \['TN', 'FL', 'AZ', 'NC', 'TX'\]/, 'market toggles should expose all prioritized states in the user-supplied TN -> inland FL -> AZ -> NC -> TX order');
assert.match(appSource, /Priority is TN → inland FL → AZ → NC → TX/, 'Builders header should frame deployed states by the target priority stack, not as a forced sequence');
assert.match(appSource, /data-builder-market-state/, 'state toggles should be interactive controls that swap the displayed state data');
assert.match(appSource, /selectedBuilderMarketState = stateCode/, 'clicking a state toggle should change the selected Builders market state');
assert.match(appSource, /\[activeState\]\.map\(state =>/, 'the state detail panel should render only the selected state below the toggles');
assert.match(appSource, /Permit-builder pipeline/, 'selected state lane should expose its permit-builder pipeline');
assert.match(appSource, /state-pipeline-list/, 'selected state lane should render source/action/output pipeline steps');
assert.match(appSource, /pipeline-unlock/, 'selected state lane should show the unlock condition before seller sourcing');
assert.match(appSource, /market-state-\$\{h\(state\.stateCode\.toLowerCase\(\)\)\}/, 'state lanes must generate addressable anchors from state codes');
assert.match(appSource, /state-market-list/, 'each state lane should render its priority markets');
assert.match(appSource, /zillow-market-link/, 'priority markets should expose Zillow context links separate from permit evidence');
assert.match(appSource, /Zillow market view/, 'Zillow market links should be labeled as market views, not evidence');
assert.match(coreSource, /zillowUrl: 'https:\/\/www\.zillow\.com\/knoxville-tn\//, 'Knoxville market should include a Zillow context link');
assert.match(coreSource, /zillowUrl: 'https:\/\/www\.zillow\.com\/austin-tx\//, 'Texas market should include a Zillow context link');
assert.match(coreSource, /zillowUrl: 'https:\/\/www\.zillow\.com\/polk-county-fl\//, 'Florida market should include a Zillow context link');
assert.match(appSource, /renderBuyerValidationCommandCenter\(activeState, activeBuilders, activeSummary\)/, 'selected market state must drive the call queue with active rows, not just the hero');
assert.match(appSource, /if \(!rows\.length\)/, 'states with no data must still render an intentional empty call queue state');
assert.match(appSource, /getStateBuilderRows\(stateCode\)/, 'all loaded states should receive live builder rows');
assert.doesNotMatch(appSource, /const isLive = stateCode === 'TN'/, 'the UI must not hard-code Tennessee as the only live state');
assert.doesNotMatch(appSource, /builder-empty-evidence/, 'legacy duplicate evidence section should not render after the command center');
assert.doesNotMatch(appSource, /id="builder-evidence-desk"/, 'legacy evidence desk anchor should not remain in the page flow');
assert.match(appSource, /Optional marketing intro email/, 'marketing template should be retained as a compact drawer inside the command center');
assert.match(stylesSource, /v1\.32 - Builders mobile resource-well selector and empty states/, 'final mobile selector override should live after global button styles');
assert.match(stylesSource, /\.builder-ops-header \.market-toggle[\s\S]{0,260}border-radius: 13px/, 'market toggles should be compact rounded rectangles, not circular pucks');
assert.match(stylesSource, /\.builder-ops-header \.market-toggle[\s\S]{0,260}aspect-ratio: auto/, 'market toggles must not use square/circular aspect ratios on mobile');
assert.match(stylesSource, /\.builder-empty-state/, 'empty builder states need first-class styling');
assert.doesNotMatch(appSource, /top-10 demo list|top 10 Knoxville/, 'Builders pipeline must not frame itself as a top-10 pull');

assert.match(appSource, /mailto:\$\{h\(selected\.email\)\}\?subject=\$\{encodeURIComponent\(validationEmailSubject\)\}&body=\$\{encodeURIComponent\(validationEmailBody\)\}/, 'Draft email mailto must prefill subject and body');
assert.match(appSource, /function buyerFromValidationRow\(row = \{\}\)/, 'saved selected-builder buy boxes should convert into first-class buyer objects');
assert.match(appSource, /evidenceType: 'validated buyer buy-box from selected builder cockpit'/, 'promoted builder buyers need explicit provenance');
assert.match(appSource, /upsertBuyerFromValidation\(centerRow\)/, 'saving a complete selected-builder validation should upsert the workspace buyer object');
assert.match(appSource, /const buyerPool = buyerPoolForState\(activeState\.stateCode\)/, 'Builders downstream seller gate should use state-scoped saved selected-builder buyers');
assert.match(appSource, /const stateCode = selectedBuilderMarketState \|\| 'TN'/, 'matched seller export must use the active Builders state, not an undefined legacy state variable');
assert.match(appSource, /sellerPoolForState\(stateCode\)/, 'matched seller export should use the same state-scoped seller pool as the execution conveyor');
assert.match(appSource, /selected builder is now the buyer object for seller matching and CSV export/, 'save feedback should explain persistence into the buyer-to-seller conveyor');
assert.match(appSource, /Phase 7 · call-to-close control loop/, 'execution conveyor headline should advance to Phase 7 call-to-close loop while preserving inline skip-trace import');
assert.match(appSource, /saved builder buy box → matched seller CSV → inline skip-trace return → seller-call outcome → contract\/title gate → buyer-send memo → buyer feedback rewrite/, 'Phase 7 copy should retain the full downstream conveyor detail');
assert.match(appSource, /id="builder-skip-trace-csv"/, 'Builders execution conveyor should expose inline skip-trace return CSV import');
assert.match(appSource, /#builder-import-skiptrace[\s\S]{0,520}applySkipTraceImport\(workspace, input\?\.value \|\| '', \{ candidateParcels: sellerPoolForState\(stateCode\) \}\)/, 'Builders skip-trace import must reuse the existing applySkipTraceImport path with the state-scoped seller pool');
assert.match(appSource, /Import return \+ recompute cockpit/, 'inline skip-trace import should visibly recompute the seller cockpit after import');
assert.match(appSource, /\['seller_interested', 'Interested'\]/, 'Phase 7 seller cockpit should expose Interested outcome control');
assert.match(appSource, /\['bad_number', 'Bad number'\]/, 'Phase 7 seller cockpit should expose bad-number enrichment rollback control');
assert.match(appSource, /class="phase7-ask"/, 'Phase 7 seller cockpit should capture seller asking price');
assert.match(appSource, /class="phase7-language"/, 'Phase 7 seller cockpit should preserve exact seller language');
assert.match(appSource, /data-download-execution-memo/, 'Phase 7 seller cockpit should export the selected seller buyer-send memo');
assert.match(stylesSource, /v1\.37 - Phase 7 award-grade seller call-to-close cockpit/, 'Phase 7 award-grade visual system should be appended after older conveyor styles');
assert.match(coreSource, /export function buildOperatorSessionMode/, 'Phase 8 should expose a deterministic operator session builder');
assert.match(appSource, /Operator session/, 'Today page should surface the operator sprint without implementation-phase residue');
assert.doesNotMatch(appSource, /Phase 8 · real operator session mode/, 'Today page should not expose implementation-phase residue in visible copy');
assert.match(appSource, /Deal packet assembly gate/, 'Phase 8 should keep deal packet readiness visible in the operator sprint');
assert.match(stylesSource, /v1\.38 - Phase 8 Clay-level operator session mode/, 'Phase 8 should include the premium Clay-level visual system');

const conveyorBuyer = {
  id: 'buyer-phase-6',
  name: 'Phase Six Homes',
  phone: '865-555-0100',
  email: 'land@phasesix.example',
  market: 'knoxville-tn',
  state: 'TN',
  maxPrice: 65000,
  buyBoxCaptured: true,
  validationStatus: 'validated_buy_box',
  buyBox: 'Knoxville 0.25–1 acre buildable residential lots under $65k; paved road; avoid flood/wetlands.',
  exactBuyBox: { targetMarkets: ['knoxville-tn'], lotSizeMin: 0.25, lotSizeMax: 1, maxPrice: 65000, requiredRoadAccess: true, avoidWetlands: true, avoidFloodZones: ['AE'] },
};
const publicSeller = {
  id: 'parcel-phase-6',
  parcelId: 'KGIS-P6-001',
  address: '440 Phase Loop, Knoxville, TN',
  market: 'knoxville-tn',
  state: 'TN',
  lotSize: '0.5 ac',
  lotSizeAcres: 0.5,
  ownerName: 'Public Owner Phase',
  ownerMailingAddress: 'PO Box 440, Knoxville TN',
  askingPrice: 42000,
  lowestActiveListing: 76000,
  roadAccess: true,
  utilities: true,
  wetlands: false,
  floodZone: 'X',
  sourceId: 'kgis-public-test',
  sourceUrl: 'https://example.gov/kgis',
};
const beforeImport = buildExecutionConveyor({ buyers: [conveyorBuyer], sellerCandidates: [publicSeller], limit: 10 });
assert.equal(beforeImport.stats.validatedBuyers, 1);
assert.equal(beforeImport.stats.matchedSellerBatch, 1);
assert.equal(beforeImport.callReadySellers.length, 0, 'matched public owner rows without phone/email must not enter seller cockpit');
assert.match(exportMatchedSellerBatchCsv(beforeImport.matchedSellerBatch), /needs-skip-trace/, 'matched CSV should label the row as needs-skip-trace before import');
const imported = applySkipTraceImport({ buyers: [conveyorBuyer], parcels: [] }, 'parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence\nKGIS-P6-001,Public Owner Phase,865-555-0198,owner@example.com,91', { candidateParcels: [publicSeller], now: '2026-06-20T00:00:00.000Z' });
assert.equal(imported.summary.matched, 1);
assert.equal(imported.workspace.parcels[0].realContact, true, 'skip-trace import should mark only matched contact-bearing rows as real contact');
const afterImport = buildExecutionConveyor({ buyers: [conveyorBuyer], sellerCandidates: imported.workspace.parcels, limit: 10 });
assert.equal(afterImport.stats.contactEnrichedRows, 1);
assert.equal(afterImport.callReadySellers.length, 1, 'imported owner phone/email should promote the row into seller cockpit review');
assert.match(afterImport.stageRows.find(row => row.id === 'skiptrace-return').status, /contact-enriched/);
const afterSellerOutcome = applyCallOutcome(imported.workspace, 'KGIS-P6-001', 'seller_interested', {
  now: '2026-06-20T12:00:00.000Z',
  updates: {
    sellerAskingPrice: 39000,
    sellerTimeline: 'can close this month',
    sellerMotivation: 'inherited lot and wants clean cash exit',
    accessBuildabilityNotes: 'seller says paved road frontage and power nearby',
    exactSellerLanguage: 'If you cover closing costs, I can look at thirty nine.',
  },
});
const outcomeParcel = afterSellerOutcome.parcels.find(item => item.parcelId === 'KGIS-P6-001');
assert.equal(outcomeParcel.callOutcome, 'seller_interested', 'Phase 7 should persist seller outcome against parcelId, not only internal id');
assert.equal(outcomeParcel.crmStatus, 'Negotiating');
assert.equal(outcomeParcel.sellerCallCapture.askingPrice, 39000);
assert.match(outcomeParcel.notes, /thirty nine/, 'exact seller language should be retained for zero-fabrication memo review');
const afterOutcomeConveyor = buildExecutionConveyor({ buyers: [conveyorBuyer], sellerCandidates: afterSellerOutcome.parcels, limit: 10 });
assert.equal(afterOutcomeConveyor.callReadySellers[0].callOutcome, 'seller_interested');
assert.ok(afterOutcomeConveyor.callReadySellers[0].memo?.message.includes('buyer-box-matched'), 'Phase 7 cockpit should carry a buyer-send memo with the seller row');
const phase8Session = buildOperatorSessionMode({ executionConveyor: afterOutcomeConveyor, moneyQueue: { followUps: [], today: [] }, buyerContactQueue: [] });
assert.equal(phase8Session.title, 'Today’s Call Sprint');
assert.match(phase8Session.subtitle, /buyer proof → seller export → skip-trace return → seller outcome → deal packet → feedback rewrite/, 'Phase 8 session should retain the full operating chain');
assert.ok(phase8Session.sprintSteps.some(step => step.id === 'deal-packet' && /Package must carry parcel facts/.test(step.detail)), 'Phase 8 should make deal packet assembly explicit');
assert.ok(phase8Session.packetGate.some(gate => gate.label === 'Buyer memo' && gate.status === 'clear'), 'Phase 8 packet gate should see generated buyer memo readiness');
assert.equal(phase8Session.metrics.contacts, 1, 'Phase 8 metrics should count enriched contact rows from Phase 7 conveyor');

console.log('buyer validation command center tests passed');
