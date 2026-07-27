import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

assert.match(app, /function renderPhase5ProofLedger\(/, 'Phase 5 must define a compact proof ledger renderer.');
assert.match(app, /Permit proof[\s\S]{0,900}Contact proof[\s\S]{0,900}Buy-box proof[\s\S]{0,900}Decision-maker proof/, 'Proof ledger must expose permit, contact, buy-box, and decision-maker proof.');
assert.match(app, /aria-label="Compact proof ledger"/, 'Proof ledger must be labeled for operators and accessibility.');
assert.match(app, /<details class="phase5-source-links"><summary>Source links<\/summary>/, 'Proof source links must remain reachable but secondary.');
assert.match(app, /function renderPhase5SellerSourcingState\(/, 'Phase 5 must define visible seller sourcing state.');
assert.match(app, /Everything stays available\. Work out of order/, 'Seller sourcing copy must explicitly allow out-of-order work.');
assert.match(app, /Seller sourcing can run now; buy-box detail sharpens the target\./, 'Seller sourcing must not be described as locked behind buy-box capture.');
assert.match(app, /data-builder-queue-filter="general-sourcing"/, 'Queue must expose general seller sourcing state.');
assert.match(app, /data-builder-queue-filter="seller-specific"/, 'Queue must expose buyer-specific seller sourcing state.');
assert.match(app, /<span>Source sellers<\/span>/, 'Builder page spine must use source-sellers copy instead of unlock language.');

const buildersSliceStart = app.indexOf('function renderBuyerValidationCommandCenter');
const buildersSliceEnd = app.indexOf('function applyBuilderQueueControls', buildersSliceStart);
const buildersSlice = app.slice(buildersSliceStart, buildersSliceEnd);
assert.doesNotMatch(buildersSlice, />[^<]*(?:Seller unlock|seller unlock|seller gate|locked|blocked|unlock)[^<]*</i, 'Builders Phase 5 visible copy must not use lock/unlock/block/gate language.');
assert.doesNotMatch(buildersSlice, /Capture the buy box first|before parcel work|before seller outreach/, 'Builders Phase 5 must not block seller work behind a prerequisite.');

assert.match(css, /v1\.99\.13 - Phase 5 proof ledger \+ out-of-order seller sourcing/, 'Phase 5 CSS marker must be present.');
assert.match(css, /--phase5-proof-seller-flow: proof-ledger-seller-sourcing-no-locks/, 'Phase 5 CSS must encode the no-lock proof/seller contract.');
assert.match(css, /\.phase5-proof-ledger-grid[\s\S]{0,160}repeat\(2, minmax\(0,1fr\)\)/, 'Proof ledger must render compactly on desktop.');
assert.match(css, /\.seller-sourcing-card\.is-general/, 'Seller sourcing must have visible general/parallel state styling.');
assert.match(css, /\.seller-sourcing-card\.is-specific/, 'Seller sourcing must have visible buyer-specific state styling.');
assert.match(html, /phase5-proof-seller-flow[\s\S]*phase5-proof-seller-flow/, 'index.html must cache-bust Phase 5 proof/seller flow CSS and module assets.');
assert.match(html, /Seller sourcing stays accessible and labeled by confidence\./, 'Builders header must say seller sourcing remains accessible.');

console.log('phase306 Builders proof + out-of-order seller sourcing guard passed');
