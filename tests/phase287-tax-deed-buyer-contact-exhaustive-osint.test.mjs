import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leeCountyTaxDeedBuyers } from '../src/taxDeedBuyers.mjs';

const app = readFileSync('src/app.mjs', 'utf8');
const html = readFileSync('index.html', 'utf8');
const csv = readFileSync('artifacts/buyer-lists/florida-tax-deed/lee/buyers.csv', 'utf8');
const report = readFileSync('artifacts/buyer-lists/florida-tax-deed/lee/contact-osint-phase287-report.md', 'utf8');

assert.equal(leeCountyTaxDeedBuyers.length, 27, 'Lee County buyer list must preserve all 27 buyers');
assert.match(app, /phase287-contact-exhaustive-osint/, 'app import must cache-bust phase287 contact OSINT data');
assert.match(html, /phase287-contact-exhaustive-osint/, 'index must cache-bust phase287 live bundle');

const phoneRows = leeCountyTaxDeedBuyers.filter(buyer => buyer.phone);
const emailRows = leeCountyTaxDeedBuyers.filter(buyer => buyer.email);
assert.equal(phoneRows.length, 1, 'only source-backed public phone row should be rendered');
assert.equal(emailRows.length, 1, 'only source-backed public email row should be rendered');
assert.equal(phoneRows[0].buyerName, 'MAGALY CRUZ PINEIRO', 'Magaly remains the only verified callable row');
assert.equal(emailRows[0].buyerName, 'MAGALY CRUZ PINEIRO', 'Magaly remains the only verified email row');

const exhaustedRows = leeCountyTaxDeedBuyers.filter(buyer => buyer.confidence.includes('public_contact_osint_exhausted'));
assert.equal(exhaustedRows.length, 26, 'all non-Magaly rows should be marked public-contact exhausted');
for (const buyer of exhaustedRows) {
  assert.equal(buyer.phone, '', `${buyer.buyerName} should not receive unverified phone data`);
  assert.equal(buyer.email, '', `${buyer.buyerName} should not receive unverified email data`);
  assert.match(buyer.notes, /Phase287 contact OSINT/, `${buyer.buyerName} needs visible OSINT exhaustion notes`);
}

for (const requiredSource of [
  'sfranalytics.com/investors/fl/cape-coral-fort-myers-fl/emf-operations-llc-fl',
  'sfranalytics.com/investors/fl/cape-coral-fort-myers-fl/ld-development-llc-fl',
  'sfranalytics.com/investors/fl/ocala-fl/deals-on-lands-llc-fl',
  'sfranalytics.com/investors/fl/punta-gorda-fl/mvp-hub-llc-fl',
  'search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail',
]) {
  assert.match(csv, new RegExp(requiredSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `CSV should retain ${requiredSource} evidence path`);
}

assert.match(report, /people-search snippets/, 'OSINT report must document rejected weak-source classes');
assert.match(report, /public_contact_osint_exhausted/, 'OSINT report must document exhaustion status');

console.log('phase287 exhaustive tax deed buyer contact OSINT guard passed');
