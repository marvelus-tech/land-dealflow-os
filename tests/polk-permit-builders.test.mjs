import assert from 'node:assert/strict';
import fs from 'node:fs';

const signals = JSON.parse(fs.readFileSync('data/real/polk/builder_signals.json', 'utf8'));
const evidence = JSON.parse(fs.readFileSync('data/real/polk/market_evidence.json', 'utf8'));
const adapterSource = fs.readFileSync('scripts/adapters/polk-accela-permit-builders.py', 'utf8');

assert.ok(signals.length >= 20, 'Polk/Lakeland permit-builder pull must never regress below 20 unique builders');
assert.equal(evidence.summary.minimumUniqueBuilders, 20);
assert.equal(evidence.summary.uniqueBuilders, signals.length);
assert.ok(evidence.summary.permitRowsSampled >= 90, 'Polk pull should inspect enough public Accela residential-new permit rows');
assert.ok(evidence.summary.detailPagesInspected >= 90, 'Polk pull should verify records from public detail pages');
assert.ok(evidence.summary.totalRecentBuildSignals >= 80, 'Polk pull should represent real permit-backed volume');
assert.equal(new Set(signals.map(row => row.id)).size, signals.length, 'Polk builders must be deduped by stable ID');
assert.equal(new Set(signals.map(row => row.name.toLowerCase())).size, signals.length, 'Polk builders must be deduped by normalized name');
assert.match(evidence.source.sourceUrl, /aca-prod\.accela\.com\/POLKCO\/Cap\/CapHome\.aspx/);
assert.equal(evidence.source.permitType, 'Residential New Permit - Ex: New House');
assert.match(adapterSource, /PERMIT_TYPE_LABEL = 'Residential New Permit - Ex: New House'/);
assert.match(adapterSource, /permitRowsSampled/);
assert.match(adapterSource, /len\(builders\) < MINIMUM_UNIQUE_BUILDERS/, 'Polk adapter must fail loudly below the batch floor');

const requiredNames = ['LENNAR HOMES LLC', 'D. R. HORTON, INC.', 'HIGHLAND HOMES', 'MARONDA HOMES, LLC OF FLORIDA'];
for (const name of requiredNames) {
  assert.ok(signals.some(row => row.name === name), `Polk evidence should preserve builder brand: ${name}`);
}

for (const builder of signals) {
  assert.equal(builder.market, 'polk-lakeland-fl');
  assert.equal(builder.state, 'FL');
  assert.ok(builder.id.startsWith('polk-builder-'));
  assert.ok(builder.recentBuilds >= 1, `${builder.name} needs permit rows to be a builder signal`);
  assert.ok(builder.recentPermits?.length, `${builder.name} missing permit evidence`);
  assert.equal(builder.evidenceType, 'permitVerified active-builder signal');
  assert.match(builder.buyBox, /permit signal only/i);
  assert.match(builder.acquisitionNotes, /Polk County public Accela Residential New permit/i);
  assert.doesNotMatch(builder.name, /\b(AIR|A\/C|CONDITION|ROOFING|PLUMBING|ELECTRIC|FENCE|POOL|SPA|SOLAR|GARAGE DOOR|MECHANICAL|ALUMINUM|SCREEN|FIRE|FOUNDATION|HANDYMAN|HVAC|IRRIGATION)\b/i, `${builder.name} looks like a trade/accessory contractor`);
  assert.doesNotMatch(builder.name, /^(HOMES|GROUP|FLORIDA|CONSTRUCTION|CONTRACTORS|1)\s*(LLC|INC|CORP)?(?:\s+OF\s+FLORIDA)?$/i, `${builder.name} is over-normalized/generic`);
  for (const permit of builder.recentPermits) {
    assert.equal(permit.recordType, 'Residential New Permit - Ex: New House');
    assert.match(permit.permitNumber, /^BR-/);
    assert.ok(permit.permitNumber, `${builder.name} permit missing permit number`);
    assert.match(permit.sourceUrl, /CapDetail\.aspx/);
    if (permit.address) assert.match(permit.address, /FL|LAKELAND|DAVENPORT|POINCIANA|WINTER HAVEN|EAGLE LAKE|HAINES CITY|BARTOW|AUBURNDALE/i);
  }
}

console.log('polk permit-builder tests passed');
