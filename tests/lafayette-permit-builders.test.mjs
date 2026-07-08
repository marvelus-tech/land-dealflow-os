import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['scripts/adapters/lafayette-tippecanoe-arcgis-permit-builders.mjs'], { stdio: 'pipe' });

const signalsPath = 'data/real/lafayette-in/builder_signals.json';
const evidencePath = 'data/real/lafayette-in/market_evidence.json';
const queuePath = 'data/real/lafayette-in/builder_validation_queue.csv';

assert.equal(existsSync(signalsPath), true, 'Lafayette builder signals JSON should exist');
assert.equal(existsSync(evidencePath), true, 'Lafayette market evidence JSON should exist');
assert.equal(existsSync(queuePath), true, 'Lafayette validation CSV should exist');

const rows = JSON.parse(readFileSync(signalsPath, 'utf8'));
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));

assert.ok(rows.length >= 20, `expected 20+ Lafayette permit-backed signals, got ${rows.length}`);
assert.ok(evidence.rawPermitCount >= rows.length, 'raw permit count should cover grouped signal rows');
assert.match(evidence.sourcePath.sourceUrls.join('\n'), /BuildingPermits_Adr\/FeatureServer\/0/);

for (const row of rows.slice(0, 10)) {
  assert.equal(row.market, 'lafayette-in');
  assert.equal(row.state, 'IN');
  assert.ok(row.builderName || row.name);
  assert.ok(row.recentBuilds >= 1);
  assert.match(row.evidenceType, /Tippecanoe County GIS official/);
  assert.match(row.validationStatus, /permit-owner/);
  assert.ok(row.permitEvidence.length >= 1);
  assert.ok(row.sourceUrls.some(url => /FeatureServer\/0/.test(url)));
}

assert.ok(rows.some(row => /Habitat|Homes|LLC|Inc\.?/i.test(row.builderName)), 'should surface company-like owner/developer signals first');

console.log('lafayette permit builder tests passed');
