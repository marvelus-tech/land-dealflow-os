import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leeCountyTaxDeedBuyers } from '../src/taxDeedBuyers.mjs';

const app = readFileSync('src/app.mjs', 'utf8');
const html = readFileSync('index.html', 'utf8');
const csv = readFileSync('artifacts/buyer-lists/florida-tax-deed/lee/buyers.csv', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

assert.ok(leeCountyTaxDeedBuyers.length >= 25, 'tax deed buyer page must keep the source-backed buyer queue populated');
assert.ok(
  leeCountyTaxDeedBuyers.every(buyer => typeof buyer.lotSize === 'string' && buyer.lotSize.trim()),
  'every live buyer row must carry a lotSize purchase-evidence field'
);
assert.ok(
  leeCountyTaxDeedBuyers.some(buyer => /\d+(\.\d+)?\s*ac/.test(buyer.lotSize)),
  'at least one tax deed purchase row must show acreage from parcel evidence'
);
assert.ok(
  leeCountyTaxDeedBuyers.every(buyer => String(buyer.lotSizeSource || '').includes('Lee County Parcels ArcGIS')),
  'lot size evidence must name the Lee County Parcels ArcGIS source'
);
assert.match(csv.split('\n')[0], /lotSize/, 'source CSV must include the lotSize column');
assert.match(app, /<th>Lot size<\/th>/, 'live buyer table must render a Lot size header');
assert.match(app, /buyer-lot-size-cell/, 'live buyer table must render a dedicated lot size cell');
assert.match(app, /phase285-lot-size-evidence/, 'app import must cache-bust the lot size evidence data module');
assert.match(html, /phase285-lot-size-evidence/, 'index.html must cache-bust the live lot size evidence update');
assert.match(pkg.scripts.test, /phase285-tax-deed-buyer-lot-size\.test\.mjs/, 'full npm test must include the Phase 285 tax deed buyer lot size guard');

console.log('phase285 tax deed buyer lot size evidence guard passed');
