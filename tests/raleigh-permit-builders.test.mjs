import assert from 'node:assert/strict';
import fs from 'node:fs';

const signals = JSON.parse(fs.readFileSync('data/real/raleigh/builder_signals.json', 'utf8'));
const evidence = JSON.parse(fs.readFileSync('data/real/raleigh/market_evidence.json', 'utf8'));
const adapterSource = fs.readFileSync('scripts/adapters/raleigh-arcgis-permit-builders.mjs', 'utf8');

assert.ok(signals.length >= 20, 'Raleigh/Wake permit-builder pull must never regress below 20 unique builders');
assert.equal(evidence.summary.minimumUniqueBuilders, 20);
assert.ok(evidence.summary.uniqueBuilders >= 20);
assert.equal(evidence.summary.uniqueBuilders, signals.length);
assert.equal(new Set(signals.map(row => row.id)).size, signals.length, 'Raleigh builders must be deduped by stable ID');
assert.equal(new Set(signals.map(row => row.name.toLowerCase())).size, signals.length, 'Raleigh builders must be deduped by normalized name');
assert.ok(evidence.summary.permitRowsSampled >= 500, 'Raleigh pull should sample enough public permit rows to avoid a thin queue');
assert.ok(evidence.summary.totalRecentBuildSignals >= 300, 'Raleigh pull should represent real permit-backed volume');
assert.match(evidence.source.sourceUrl, /data\.wake\.gov\/maps\/ral::building-permits/);
assert.match(evidence.source.where, /permitclassmapped='Residential'/);
assert.match(evidence.source.where, /DETACHED SINGLE FAMILY DWELLING/);
assert.match(evidence.source.where, /RESIDENTIAL TOWNHOUSE/);
assert.doesNotMatch(evidence.source.where, /ADDITION\/ALTERATION|MISCELLANEOUS|Retaining|Pool|Repair/i);
assert.match(adapterSource, /groups\.has\(key\)/, 'Raleigh adapter must group by normalized builder key before applying the floor');
assert.match(adapterSource, /builderSignals\.length < minimumUniqueBuilders/, 'Raleigh adapter must fail loudly below the batch floor');

for (const builder of signals) {
  assert.equal(builder.market, 'raleigh-nc');
  assert.equal(builder.state, 'NC');
  assert.ok(builder.id.startsWith('raleigh-builder-'));
  assert.ok(builder.recentBuilds >= 2, `${builder.name} needs at least two permit rows to be a builder signal`);
  assert.ok(builder.recentPermits?.length, `${builder.name} missing permit evidence`);
  assert.equal(builder.evidenceType, 'permitVerified active-builder signal');
  assert.match(builder.buyBox, /permit signal only/i);
  assert.match(builder.acquisitionNotes, /Raleigh\/Wake public residential new-building permit rows/i);
  assert.doesNotMatch(builder.name, /pool|spa|roof|plumb|electric|mechanical|fence|retaining/i, `${builder.name} looks like a trade/accessory contractor, not a land buyer`);
  for (const permit of builder.recentPermits) {
    assert.equal(permit.permitClass, 'Residential');
    assert.match(permit.landUse, /DETACHED SINGLE FAMILY|RESIDENTIAL TOWNHOUSE|TWO FAMILY/i);
    assert.ok(permit.permitNumber, `${builder.name} permit missing permit number`);
    assert.ok(permit.address, `${builder.name} permit missing address`);
    assert.ok(permit.sourceUrl, `${builder.name} permit missing source URL`);
  }
}

console.log('raleigh permit-builder tests passed');
