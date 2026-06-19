import assert from 'node:assert/strict';
import fs from 'node:fs';

const signals = JSON.parse(fs.readFileSync('data/real/austin/builder_signals.json', 'utf8'));
const evidence = JSON.parse(fs.readFileSync('data/real/austin/market_evidence.json', 'utf8'));
const adapterSource = fs.readFileSync('scripts/adapters/austin-socrata-permit-builders.mjs', 'utf8');

assert.ok(signals.length >= 20, 'Austin permit-builder pull must never regress below 20 unique builders');
assert.equal(evidence.summary.minimumUniqueBuilders, 20);
assert.ok(evidence.summary.uniqueBuilders >= 20, 'Austin evidence summary must report the batch floor');
assert.equal(evidence.summary.uniqueBuilders, signals.length);
assert.equal(new Set(signals.map(row => row.id)).size, signals.length, 'Austin builders must be deduped by stable ID');
assert.equal(new Set(signals.map(row => row.name.toLowerCase())).size, signals.length, 'Austin builders must be deduped by normalized name');
assert.ok(evidence.summary.permitRowsSampled >= 3000, 'Austin pull should sample enough public permit rows to avoid a thin queue');
assert.ok(evidence.summary.totalRecentBuildSignals >= 1000, 'Austin pull should represent real permit-backed volume');
assert.match(evidence.source.sourceUrl, /data\.austintexas\.gov\/d\/hw8f-smxh/);
assert.match(evidence.source.where, /permit_class='R- 101 Single Family Houses'/);
assert.match(evidence.source.where, /permit_class='R- 103 Two Family Bldgs'/);
assert.doesNotMatch(evidence.source.where, /R- 329|R- 330|Pool|Spa/i, 'Austin source query must not include pool/accessory structure permit classes');
assert.match(adapterSource, /groups\.has\(key\)/, 'Austin adapter must group by normalized builder key before applying the floor');
assert.match(adapterSource, /builderSignals\.length < minimumUniqueBuilders/, 'Austin adapter must fail loudly below the batch floor');

for (const builder of signals) {
  assert.equal(builder.market, 'austin-tx');
  assert.equal(builder.state, 'TX');
  assert.ok(builder.id.startsWith('austin-builder-'));
  assert.ok(builder.recentBuilds >= 2, `${builder.name} needs at least two permit rows to be a builder signal`);
  assert.ok(builder.recentPermits?.length, `${builder.name} missing permit evidence`);
  assert.equal(builder.evidenceType, 'permitVerified active-builder signal');
  assert.match(builder.buyBox, /permit signal only/i);
  assert.match(builder.acquisitionNotes, /Austin public residential new-construction permit rows/i);
  assert.doesNotMatch(builder.name, /pool|spa/i, `${builder.name} looks like a pool contractor, not a land buyer`);
  for (const permit of builder.recentPermits) {
    assert.match(permit.permitClass, /R- 10[123]/, `${builder.name} has non-building permit class ${permit.permitClass}`);
    assert.ok(permit.permitNumber, `${builder.name} permit missing permit number`);
    assert.ok(permit.address, `${builder.name} permit missing address`);
    assert.ok(permit.sourceUrl, `${builder.name} permit missing source URL`);
  }
}

console.log('austin permit-builder tests passed');
