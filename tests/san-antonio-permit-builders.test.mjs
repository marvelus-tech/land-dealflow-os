import assert from 'node:assert/strict';
import fs from 'node:fs';

const signals = JSON.parse(fs.readFileSync('data/real/san-antonio/builder_signals.json', 'utf8'));
const evidence = JSON.parse(fs.readFileSync('data/real/san-antonio/market_evidence.json', 'utf8'));
const adapterSource = fs.readFileSync('scripts/adapters/san-antonio-ckan-permit-builders.mjs', 'utf8');

assert.ok(signals.length >= 20, 'San Antonio permit-builder pull must never regress below 20 unique builders');
assert.equal(evidence.summary.minimumUniqueBuilders, 20);
assert.ok(evidence.summary.uniqueBuilders >= 20, 'San Antonio evidence summary must report the batch floor');
assert.equal(evidence.summary.uniqueBuilders, signals.length);
assert.equal(new Set(signals.map(row => row.id)).size, signals.length, 'San Antonio builders must be deduped by stable ID');
assert.equal(new Set(signals.map(row => row.name.toLowerCase())).size, signals.length, 'San Antonio builders must be deduped by normalized name');
assert.ok(evidence.summary.permitRowsSampled >= 5000, 'San Antonio pull should sample enough public permit rows to avoid a thin queue');
assert.ok(evidence.summary.totalRecentBuildSignals >= 1000, 'San Antonio pull should represent real permit-backed volume');
assert.match(evidence.source.sourceUrl, /data\.sanantonio\.gov\/dataset\/building-permits\/resource\/c21106f9/);
assert.match(evidence.source.where, /Res New Building Permit/);
assert.match(evidence.source.where, /"WORK TYPE" = 'New'/);
assert.doesNotMatch(evidence.source.where, /Garage Sale|Swimming Pool|Fence|Repair|Re-Roof|Mechanical|Electrical|Plumbing/i, 'San Antonio source query must exclude trade/accessory permit types');
assert.match(adapterSource, /groups\.has\(key\)/, 'San Antonio adapter must group by normalized builder key before applying the floor');
assert.match(adapterSource, /builderSignals\.length < minimumUniqueBuilders/, 'San Antonio adapter must fail loudly below the batch floor');

for (const builder of signals) {
  assert.equal(builder.market, 'san-antonio-tx');
  assert.equal(builder.state, 'TX');
  assert.ok(builder.id.startsWith('san-antonio-builder-'));
  assert.ok(builder.recentBuilds >= 2, `${builder.name} needs at least two permit rows to be a builder signal`);
  assert.ok(builder.recentPermits?.length, `${builder.name} missing permit evidence`);
  assert.equal(builder.evidenceType, 'permitVerified active-builder signal');
  assert.match(builder.buyBox, /permit signal only/i);
  assert.match(builder.acquisitionNotes, /San Antonio public residential new-building permit rows/i);
  assert.doesNotMatch(builder.name, /pool|spa|garage sale|roof|fence|irrigation|mechanical|plumb|electric/i, `${builder.name} looks like a trade/accessory contractor, not a land buyer`);
  for (const permit of builder.recentPermits) {
    assert.equal(permit.permitType, 'Res New Building Permit');
    assert.equal(permit.workType, 'New');
    assert.ok(permit.permitNumber, `${builder.name} permit missing permit number`);
    assert.ok(permit.address, `${builder.name} permit missing address`);
    assert.ok(permit.sourceUrl, `${builder.name} permit missing source URL`);
  }
}

console.log('san antonio permit-builder tests passed');
