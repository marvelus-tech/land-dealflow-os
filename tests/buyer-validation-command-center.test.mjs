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

const center = buildBuyerValidationCommandCenter(rows, []);
assert.equal(center.summary.total, 10);
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
assert.match(appSource, /data-toggle-validation-contact="phone"/, 'validation rows must expose a called/not-called contact state toggle');
assert.match(appSource, /data-toggle-validation-contact="email"/, 'validation rows must expose an emailed/not-emailed contact state toggle');
assert.match(appSource, /scoreBreakdownRows/, 'validation score must expose progressive-disclosure breakdown rows');
assert.match(appSource, /Ranked by validation leverage: permit activity/, 'call queue ranking tooltip must explain validation leverage');
assert.match(appSource, /navigator\.clipboard\?\.writeText\?\.\(payload\)/, 'Copy email must copy the buy-box email payload, not just open mailto');
assert.match(appSource, /mailto:\$\{h\(selected\.email\)\}\?subject=\$\{encodeURIComponent\(validationEmailSubject\)\}&body=\$\{encodeURIComponent\(validationEmailBody\)\}/, 'Draft email mailto must prefill subject and body');

console.log('buyer validation command center tests passed');
