import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { okaloosaCountyTaxDeedOwnerRunway } from '../src/taxDeedOwnerRunwayRows.mjs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.equal(okaloosaCountyTaxDeedOwnerRunway.length, 3, 'Okaloosa official owner runway should expose the 3 accepted vacant-owner lot leads.');
assert.ok(okaloosaCountyTaxDeedOwnerRunway.every(row => row.state === 'FL' && row.county === 'Okaloosa'), 'Every Okaloosa row must be FL / Okaloosa.');
assert.ok(okaloosaCountyTaxDeedOwnerRunway.every(row => row.ownerPhone === '' && row.ownerEmail === ''), 'Okaloosa owner phones/emails must stay blank until verified.');
assert.ok(okaloosaCountyTaxDeedOwnerRunway.every(row => /bid4assets/i.test(row.sourceUrl) && /qpublic/i.test(row.countyPageUrl)), 'Every Okaloosa row must keep auction and official appraiser source URLs.');
assert.ok(okaloosaCountyTaxDeedOwnerRunway.some(row => row.ownerName === 'DAVID A LATHAM' && row.parcelId === '27-4N-22-0000-0003-0110'), 'David Latham Okaloosa row must be present.');
assert.match(app, /okaloosaCountyTaxDeedOwnerRunway/, 'Tax-Deed app must import/render the Okaloosa owner runway dataset.');
assert.match(app, /phase297-okaloosa-tax-deed-owner-runway/, 'Tax-Deed route must carry the Phase 297 Okaloosa marker.');
assert.match(app, /FL\/PA runway · skip-trace hold/, 'Owners tab must communicate FL and PA owner runway coverage.');
assert.match(css, /--phase297-okaloosa-tax-deed-owner-runway: official-okaloosa-owner-lots-displayed/, 'CSS must include the Phase 297 marker.');
assert.match(html, /phase297-okaloosa-tax-deed-owner-runway/, 'Live HTML must cache-bust the Phase 297 Okaloosa update.');
assert.match(pkg.scripts.test, /phase297-okaloosa-tax-deed-owner-runway\.test\.mjs/, 'Full npm test must include the Phase 297 guard.');

console.log('phase297 Okaloosa tax deed owner runway guard passed');
