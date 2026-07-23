import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pennsylvaniaYorkUpsetSaleOwnerRunway } from '../src/taxDeedOwnerRunwayRows.mjs';
import { buildTaxDeedOwnerRunway, exportTaxDeedOwnerRunwayCsv } from '../src/core.mjs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const scripts = readFileSync(new URL('../src/outreachScripts.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const importCsv = readFileSync(new URL('../artifacts/seller-lists/pa-upset-sale/york-county/york-pa-tax-deed-page-owner-runway-import.csv', import.meta.url), 'utf8');

assert.equal(pennsylvaniaYorkUpsetSaleOwnerRunway.length, 20, 'Tax-Deed Owners tab must carry the 20-row PA/York owner runway.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.every(row => row.state === 'PA' && row.county === 'York'), 'Every loaded owner row must be York County PA.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.every(row => row.lotSize && /ac$/.test(row.lotSize)), 'Every owner row must include lot size in acres.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.every(row => !row.ownerPhone && !row.ownerEmail), 'Owner phone/email must stay blank until verified skip trace/contact enrichment.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.every(row => /yorkcountypa\.gov/.test(row.sourceUrl) && /arcweb1\.ycpc\.org/.test(row.countyPageUrl)), 'Owner rows must keep official Tax Claim and official parcel/GIS sources.');

const runway = buildTaxDeedOwnerRunway(pennsylvaniaYorkUpsetSaleOwnerRunway, { limit: 25 });
assert.equal(runway.stats.total, 20, 'Runway builder must accept all 20 vacant/no-building PA rows.');
assert.equal(runway.stats.rejectedNonLand, 0, 'PA owner runway must not include improved/non-land rows.');
assert.match(exportTaxDeedOwnerRunwayCsv(runway.rows).split('\n')[0], /propertyUse,lotSize,auctionDate/, 'Tax deed runway export must include lotSize next to propertyUse.');

assert.match(app, /pennsylvaniaYorkUpsetSaleOwnerRunway/, 'Tax-Deed page must import the PA/York owner runway.');
assert.match(app, /Lot size \/ use/, 'Tax-Deed Owners table must expose lot size.');
assert.match(app, /skip-trace/, 'Tax-Deed Owners table must show skip-trace status for unverified contacts.');
assert.match(app, /Upset-sale risk: mortgages, municipal claims, judgments, liens/, 'Tax-Deed page must show PA-specific upset-sale risk language.');
assert.match(scripts, /pa-upset-sale-owner-sms-straightforward-risk-aware/, 'Script drawer must include PA upset-sale SMS copy.');
assert.match(scripts, /pa-upset-sale-owner-email-simple-review/, 'Script drawer must include PA upset-sale email copy.');
assert.match(scripts, /subject to mortgages, municipal claims, judgments, liens/, 'PA scripts must warn about upset-sale encumbrance risk.');
assert.match(css, /--phase294-pa-upset-sale-owner-runway: lot-size-skiptrace-risk-script/, 'CSS must include the Phase 294 PA owner runway marker.');
assert.match(html, /phase294-pa-upset-sale-owner-runway/, 'Live HTML must cache-bust the Phase 294 Tax-Deed page update.');
assert.match(pkg.scripts.test, /phase294-pa-upset-sale-owner-runway\.test\.mjs/, 'Full npm test must include the Phase 294 guard.');
assert.match(importCsv.split('\n')[0], /propertyUse,lotSize,auctionDate/, 'Export artifact must be compatible with the owner runway import and include lotSize.');

console.log('phase294 PA upset-sale owner runway/tax-deed page guard passed');
