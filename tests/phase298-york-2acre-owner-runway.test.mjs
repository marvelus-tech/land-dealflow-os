import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pennsylvaniaYorkUpsetSaleOwnerRunway } from '../src/taxDeedOwnerRunwayRows.mjs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const acreNumber = row => {
  const direct = Number(row.acreage || row.acres || row.lotSizeAcres);
  if (Number.isFinite(direct)) return direct;
  const match = String(row.lotSize || row.propertyUse || '').match(/([0-9]+(?:\.[0-9]+)?)\s*ac\b/i);
  return match ? Number(match[1]) : 0;
};

assert.equal(pennsylvaniaYorkUpsetSaleOwnerRunway.length, 10, 'York PA public Tax-Deed owner runway must use the 10 qualifying 2+ acre rows, not the older sub-acre shortlist.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.every(row => row.state === 'PA' && row.county === 'York'), 'Every York 2+ acre row must be PA / York.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.every(row => acreNumber(row) >= 2), 'Every York row displayed in this public dataset must be at least 2 acres.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.every(row => row.ownerPhone === '' && row.ownerEmail === ''), 'York phones/emails must stay blank until verified; no skip-trace placeholder strings in app data.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.some(row => row.ownerName === 'U S HOME LLC' && acreNumber(row) >= 30), 'Large-acre York row must be visible.');
assert.ok(pennsylvaniaYorkUpsetSaleOwnerRunway.some(row => row.ownerName === 'MOWERY DANIEL B & HAILEY' && row.parcelId === '38-000-04-0013.00-00000'), 'Mowery 4.7 acre York row must be visible.');
assert.doesNotMatch(app, /let activeTaxDeedTab = 'buyers'/, 'Tax-Deed route should not default to Buyers when the operator is looking for owner leads.');
assert.match(app, /let activeTaxDeedTab = 'owners'/, 'Tax-Deed route should default to Owners so leads display without hunting.');
assert.match(app, /visible 2\+ acre leads/, 'Tax-Deed hero must expose the 2+ acre lead count.');
assert.match(app, /phase298-york-2acre-owner-runway/, 'App module must carry the Phase 298 marker.');
assert.match(css, /--phase298-york-2acre-owner-runway: pa-2acre-leads-visible-default-owners-tab/, 'CSS must include the Phase 298 marker.');
assert.match(html, /phase298-york-2acre-owner-runway/, 'Live HTML must cache-bust the Phase 298 update.');
assert.match(pkg.scripts.test, /phase298-york-2acre-owner-runway\.test\.mjs/, 'Full npm test must include the Phase 298 guard.');

console.log('phase298 York 2+ acre owner runway visibility guard passed');
