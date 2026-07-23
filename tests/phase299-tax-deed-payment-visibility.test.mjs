import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { okaloosaCountyTaxDeedOwnerRunway } from '../src/taxDeedOwnerRunwayRows.mjs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.ok(okaloosaCountyTaxDeedOwnerRunway.every(row => Number(row.estimatedOpeningBid) > 0), 'Every Okaloosa tax deed lot must carry the official opening-bid amount when payoff is not published.');
assert.match(app, /function taxDeedRequiredPayment\(row = \{\}\)/, 'Tax-Deed UI must centralize amount-to-pay display logic.');
assert.match(app, /Amount to pay/, 'Owner runway table must add a dedicated Amount to pay column.');
assert.match(app, /tax-deed-payment-cell/, 'Owner rows must render every lot payment signal in a dedicated cell.');
assert.match(app, /Verify payoff/, 'Rows without a published payoff/opening bid must visibly instruct the operator to verify payoff instead of hiding the missing money field.');
assert.match(app, /posted amount-to-pay signals/, 'Tax-Deed hero must surface how many owner rows have amount-to-pay signals.');
assert.match(app, /amounts visible/, 'Tax-Deed telemetry must count visible payment amounts across market filters.');
assert.match(app, /taxDeedRequiredPaymentCount\(ownerRows\)/, 'Market/county filters must recompute amount counts from visible owner rows.');
assert.match(css, /--phase299-tax-deed-payment-visibility: amount-to-pay-column-all-owner-markets/, 'CSS must include the Phase 299 payment visibility marker.');
assert.match(css, /\.tax-deed-payment-cell\.is-known span/, 'Known payment amounts must be visually distinguishable.');
assert.match(html, /amount-to-pay\/payoff signal visible on every owner lot/, 'Static Tax-Deed shell must state the amount-to-pay visibility requirement.');
assert.match(html, /phase299-tax-deed-payment-visibility/, 'Live HTML must cache-bust the Phase 299 Tax-Deed payment update.');
assert.match(pkg.scripts.test, /phase299-tax-deed-payment-visibility\.test\.mjs/, 'Full npm test must include the Phase 299 guard.');

console.log('phase299 tax deed payment visibility guard passed');
