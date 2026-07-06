import assert from 'node:assert/strict';
import fs from 'node:fs';

const signals = JSON.parse(fs.readFileSync('data/real/nashville/builder_signals.json', 'utf8'));
const evidence = JSON.parse(fs.readFileSync('data/real/nashville/market_evidence.json', 'utf8'));
const adapterSource = fs.readFileSync('scripts/adapters/nashville-arcgis-permit-builders.mjs', 'utf8');
const prioritySource = fs.readFileSync('scripts/priority-permit-markets.mjs', 'utf8');
const pullScript = fs.readFileSync('scripts/pull-priority-permit-markets.sh', 'utf8');

assert.ok(signals.length >= 20, 'Nashville/Davidson permit-builder pull must never regress below 20 unique builders');
assert.equal(evidence.marketId, 'nashville-edge-tn');
assert.equal(evidence.summary.minimumUniqueBuilders, 20);
assert.ok(evidence.summary.uniqueBuilders >= 20);
assert.equal(evidence.summary.uniqueBuilders, signals.length);
assert.equal(new Set(signals.map(row => row.id)).size, signals.length, 'Nashville builders must be deduped by stable ID');
assert.equal(new Set(signals.map(row => row.name.toLowerCase())).size, signals.length, 'Nashville builders must be deduped by normalized name');
assert.ok(evidence.summary.permitRowsSampled >= 1000, 'Nashville pull should sample enough public permit rows to avoid a thin queue');
assert.ok(evidence.summary.totalRecentBuildSignals >= 100, 'Nashville pull should represent real permit-backed volume');
assert.match(evidence.source.serviceUrl, /services2\.arcgis\.com\/HdTo6HJqh92wn4D8\/arcgis\/rest\/services\/Building_Permits_Issued_2\/FeatureServer\/0/);
assert.match(evidence.source.sourceUrl, /nashville\.gov\/departments\/codes\/codes-administration\/public-records-and-data\/daily-reports/);
assert.match(evidence.source.experienceUrl, /experience\.arcgis\.com\/experience\/4aa2856cf64e412e812fda2a893291d7/);
assert.match(evidence.source.where, /Permit_Type_Description='Building Residential - New'/);
assert.match(evidence.source.where, /Date_Issued >= DATE '2025-01-01'/);
assert.doesNotMatch(evidence.source.where, /Zillow/i);
assert.match(adapterSource, /groups\.has\(key\)/, 'Nashville adapter must group by normalized builder key before applying the floor');
assert.match(adapterSource, /builderSignals\.length < minimumUniqueBuilders/, 'Nashville adapter must fail loudly below the batch floor');
assert.match(adapterSource, /group\.rows\.length >= 3/, 'Nashville active-builder signals must require 3+ permit rows');
assert.match(prioritySource, /nashville-arcgis-permit-builders/);
assert.match(pullScript, /TN Nashville\/Davidson ArcGIS builders/);

for (const builder of signals) {
  assert.equal(builder.market, 'nashville-edge-tn');
  assert.equal(builder.state, 'TN');
  assert.ok(builder.id.startsWith('nashville-builder-'));
  assert.ok(builder.recentBuilds >= 3, `${builder.name} needs at least three permit rows to be a builder signal`);
  assert.ok(builder.recentPermits?.length, `${builder.name} missing permit evidence`);
  assert.equal(builder.evidenceType, 'permitVerified active-builder signal');
  assert.match(builder.buyBox, /permit signal only/i);
  assert.match(builder.acquisitionNotes, /Metro Nashville public residential new-building permit rows/i);
  assert.doesNotMatch(builder.name, /\b(pool|spa|shed|roof|plumb|electric|mechanical|fence|solar|landscape|irrigation)\b/i, `${builder.name} looks like a trade/accessory contractor, not a land buyer`);
  for (const permit of builder.recentPermits) {
    assert.equal(permit.permitType, 'Building Residential - New');
    assert.ok(permit.permitNumber, `${builder.name} permit missing permit number`);
    assert.ok(permit.address, `${builder.name} permit missing address`);
    assert.match(decodeURIComponent(permit.sourceUrl).replaceAll('+', ' '), /Permit__ = '/, `${builder.name} permit missing direct ArcGIS query URL`);
  }
}

console.log('nashville permit-builder tests passed');
