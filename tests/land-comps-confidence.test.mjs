import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const tmp = mkdtempSync(join(tmpdir(), 'land-comps-'));
const outputPath = join(tmp, 'outputs.json');

const stdout = execFileSync('python3', [
  'scripts/land_comps_confidence.py',
  '--input', 'tests/fixtures/land-comps-confidence-input.json',
  '--output', outputPath
], { encoding: 'utf8' });

assert.match(stdout, /"makeOffer": 2/, 'Two fixture parcels should clear make-offer logic.');

const payload = JSON.parse(readFileSync(outputPath, 'utf8'));
assert.equal(payload.zeroFabrication, true, 'Comp engine must preserve zero-fabrication accounting.');
assert.equal(payload.summary.rows, 3, 'All input parcels must be preserved.');
assert.equal(payload.summary.makeOffer, 2, 'Two parcels should be offerable.');
assert.equal(payload.summary.manualOrBlocked, 1, 'Blocked parcel must be retained as manual/blocked, not hidden.');
assert.equal(payload.assumptions.estimateAnchorRule, 'estimate * 0.50', 'Estimate half-anchor rule must be explicit.');

const byId = Object.fromEntries(payload.rows.map(row => [row.parcelId, row]));

assert.equal(byId['LEHIGH-001'].methodUsed, 'hybrid', 'Verified builder price plus estimate should use hybrid method.');
assert.equal(byId['LEHIGH-001'].underwritingConfidence, 'high', 'Verified buyer price plus comp depth should be high confidence.');
assert.equal(byId['LEHIGH-001'].redfinOfferAnchor, 14500, 'Redfin half-anchor must round to nearest 500.');
assert.equal(byId['LEHIGH-001'].buyerBuyPrice, 25000, 'Verified buyer buy price must carry into output.');
assert.equal(byId['LEHIGH-001'].nextAction, 'make-offer', 'Clean buyer-backed fixture should be ready for offer action.');
assert.ok(byId['LEHIGH-001'].reasons.some(reason => reason.includes('Verified buyer')), 'Output must explain buyer-backed confidence.');
assert.ok(byId['LEHIGH-001'].buyerPitch.some(line => line.includes('verified buyer/builder')), 'Buyer pitch should identify buyer-backed pricing.');

assert.equal(byId['SW-001'].methodUsed, 'redfin-half', 'No buyer quote with estimate should use redfin-half method.');
assert.equal(byId['SW-001'].redfinOfferAnchor, 27000, '54k estimate should produce 27k anchor.');
assert.equal(byId['SW-001'].suggestedInitialOffer, 27000, 'Estimate anchor should become initial offer when below walk-up ceiling.');
assert.equal(byId['SW-001'].walkUpCeiling, 35000, 'Walk-up ceiling must preserve target spread and buffers.');
assert.equal(byId['SW-001'].nextAction, 'make-offer', 'Estimate-backed fixture with comps should be offerable.');
assert.ok(byId['SW-001'].reasons.some(reason => reason.includes('utilities: unknown')), 'Unknown utility proof should be visible in reasons.');

assert.equal(byId['BLOCKED-001'].underwritingConfidence, 'manual-review', 'Hard parcel risks must force manual review.');
assert.equal(byId['BLOCKED-001'].nextAction, 'manual-review', 'Landlocked parcel should not be made offer-ready automatically.');
assert.ok(byId['BLOCKED-001'].blockers.some(blocker => blocker.includes('landlocked')), 'Landlocked risk must be exposed as a blocker.');

console.log('land comps confidence tests passed');
