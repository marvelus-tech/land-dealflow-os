import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildBuyerValidationCommandCenter,
  buildSellerSearchInstructions,
  evaluateBuilderBuyBox,
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
assert.match(appSource, /Phase 5 · saved buyer-call conveyor/, 'execution conveyor headline should reflect Phase 5 buyer-call persistence while preserving Phase 4 gates');
assert.match(appSource, /skip-trace → seller-call → memo\/title → feedback path/, 'Phase 5 copy should retain the full downstream conveyor detail');

console.log('buyer validation command center tests passed');
