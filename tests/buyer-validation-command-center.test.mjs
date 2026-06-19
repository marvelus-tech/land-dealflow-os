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
assert.doesNotMatch(appSource, /class="validation-queue-item[\s\S]{0,220}data-select-builder=/, 'validation rows must not use the permit-builder selector or they reset to the top row');
assert.match(appSource, /data-copy-validation-email/, 'validation focus card must expose a Copy email action next to Draft email');
assert.match(appSource, /class="contact-state-toggle[\s\S]{0,260}data-toggle-validation-contact="phone"/, 'selected builder phone state badge must be the toggle');
assert.match(appSource, /class="contact-state-toggle[\s\S]{0,260}data-toggle-validation-contact="email"/, 'selected builder email state badge must be the toggle');
assert.match(appSource, /class="contact-icon-toggle[\s\S]{0,260}data-toggle-validation-contact="phone"/, 'queue phone state must be a compact icon toggle');
assert.match(appSource, /class="contact-icon-toggle[\s\S]{0,260}data-toggle-validation-contact="email"/, 'queue email state must be a compact icon toggle');
assert.match(appSource, /<svg class="outreach-svg"[\s\S]{0,220}<path fill="currentColor"/, 'outreach controls should use solid currentColor SVG icons, not text glyphs or bordered icon boxes');
assert.doesNotMatch(appSource, /contact-action/, 'selected builder must not duplicate outreach state with separate logged buttons');
assert.doesNotMatch(appSource, />Mark called<|>Mark emailed<|>I called them<|>I contacted them by email</, 'outreach controls should be compressed into state badges/icons');
assert.match(appSource, /scoreBreakdownRows/, 'validation score must expose progressive-disclosure breakdown rows');
assert.match(appSource, /queue-source-link/, 'call queue rows must carry source-proof links from the old call-sheet list');
assert.match(appSource, /queue-csv-link[\s\S]{0,160}buyer_call_sheet\.csv/, 'call queue header must preserve call-sheet CSV export');
assert.match(appSource, /validation-source-proof/, 'selected builder card must preserve source type, contact status, confidence, and top permit proof');
assert.match(appSource, /selected-permit-proof/, 'selected builder proof drawer must preserve permit evidence rows');
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
assert.match(appSource, /20 unique builders per pull/, 'Builders UX should explain the 20-builder minimum pull');
assert.match(appSource, /minimum per pull/, 'Builders market summary should expose the batch floor without a duplicate stat band');
assert.doesNotMatch(appSource, />Next money action<|NEXT MONEY ACTION/, 'Builders page must not repeat selected-builder guidance in a separate Next Money Action card');
assert.doesNotMatch(appSource, /validation-next-card/, 'redundant next-action card component should stay removed');
assert.doesNotMatch(appSource, /Call queue first\. Seller search second\./, 'second hero headline should stay removed; the page needs one top command header');
assert.match(appSource, /builder-market-workbench/, 'top Builders IA should be a market workbench, not a static metric strip');
assert.match(appSource, /market-toggle-grid/, 'priority states should be exposed as top-level market toggles');
assert.match(appSource, /stateOrder = \['TN', 'NC', 'TX', 'FL', 'AZ'\]/, 'market toggles should expose all prioritized states in order');
assert.match(appSource, /market-state-\$\{h\(state\.stateCode\.toLowerCase\(\)\)\}/, 'state lanes must generate addressable anchors from state codes');
assert.match(appSource, /state-market-list/, 'each state lane should carry its own priority market list');
assert.doesNotMatch(appSource, /top-10 demo list|top 10 Knoxville/, 'Builders pipeline must not frame itself as a top-10 pull');

assert.match(appSource, /mailto:\$\{h\(selected\.email\)\}\?subject=\$\{encodeURIComponent\(validationEmailSubject\)\}&body=\$\{encodeURIComponent\(validationEmailBody\)\}/, 'Draft email mailto must prefill subject and body');

console.log('buyer validation command center tests passed');
