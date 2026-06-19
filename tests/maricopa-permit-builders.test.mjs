import assert from 'node:assert/strict';
import fs from 'node:fs';

const signals = JSON.parse(fs.readFileSync('data/real/maricopa/builder_signals.json', 'utf8'));
const evidence = JSON.parse(fs.readFileSync('data/real/maricopa/market_evidence.json', 'utf8'));
const adapterSource = fs.readFileSync('scripts/adapters/maricopa-xlsx-permit-builders.py', 'utf8');

assert.ok(signals.length >= 20, 'Phoenix/Maricopa permit-builder pull must never regress below 20 unique builders');
assert.equal(evidence.summary.minimumUniqueBuilders, 20);
assert.equal(evidence.summary.uniqueBuilders, signals.length);
assert.ok(evidence.summary.permitRowsSampled >= 5000, 'Maricopa pull should inspect a real weekly-report batch, not a tiny sample');
assert.ok(evidence.summary.targetPermitRows >= 60, 'Maricopa pull should include enough target residential BLDR permit rows');
assert.ok(evidence.summary.totalRecentBuildSignals >= 60, 'Maricopa pull should represent real permit-backed volume');
assert.equal(new Set(signals.map(row => row.id)).size, signals.length, 'Maricopa builders must be deduped by stable ID');
assert.equal(new Set(signals.map(row => row.name.toLowerCase())).size, signals.length, 'Maricopa builders must be deduped by normalized name');
assert.match(evidence.source.sourceUrl, /maricopa\.gov\/Archive\.aspx\?AMID=128/);
assert.equal(evidence.source.sourceFormat, 'XLSX workbooks from Archive Center');
assert.ok(evidence.source.reportsInspected >= 30, 'Maricopa adapter should inspect enough weekly reports to clear the floor');
assert.match(adapterSource, /MINIMUM_UNIQUE_BUILDERS = 20/);
assert.match(adapterSource, /MAX_WEEKLY_REPORTS = 30/);
assert.match(adapterSource, /Building \(Residential\)/);
assert.match(adapterSource, /BLDR/);
assert.match(adapterSource, /len\(builders\) < MINIMUM_UNIQUE_BUILDERS/, 'Maricopa adapter must fail loudly below the batch floor');

const requiredNames = ['SHALC GC / Shea Homes', 'Soundbuilt Homes Arizona LLC', 'Mattamy Arizona LLC', 'Lennar Arizona LLC'];
for (const name of requiredNames) {
  assert.ok(signals.some(row => row.name === name), `Maricopa evidence should preserve builder brand: ${name}`);
}

for (const builder of signals) {
  assert.equal(builder.market, 'phoenix-maricopa-az');
  assert.equal(builder.state, 'AZ');
  assert.ok(builder.id.startsWith('maricopa-builder-'));
  assert.ok(builder.recentBuilds >= 1, `${builder.name} needs permit rows to be a builder signal`);
  assert.ok(builder.recentPermits?.length, `${builder.name} missing permit evidence`);
  assert.equal(builder.evidenceType, 'permitVerified active-builder signal');
  assert.match(builder.buyBox, /permit signal only/i);
  assert.match(builder.acquisitionNotes, /Maricopa County weekly residential building permit row/i);
  assert.doesNotMatch(builder.name, /\b(PROPANE|POOL|SPA|FENCE|ROOFING|PLUMBING|ELECTRIC|SOLAR|HVAC|MECHANICAL|MOBILE HOME SERVICE)\b/i, `${builder.name} looks like a trade/accessory contractor`);
  for (const permit of builder.recentPermits) {
    assert.equal(permit.recordType, 'Building (Residential)');
    assert.match(permit.permitNumber, /^BLDR/);
    assert.match(permit.sourceUrl, /maricopa\.gov\/Archive\.aspx\?ADID=/);
    assert.match(permit.description, /SINGLE|SFR|RESIDENCE|PLAN/i);
    assert.doesNotMatch(permit.description, /\b(POOL|SPA|FENCE|SOLAR|ROOF|REMODEL|REPAIR|ALTERATION|TOWER|SIGN)\b/i);
    assert.equal(permit.state, 'AZ');
  }
}

console.log('maricopa permit-builder tests passed');
