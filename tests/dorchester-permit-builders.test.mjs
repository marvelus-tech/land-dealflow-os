import assert from 'node:assert/strict';
import fs from 'node:fs';

const signals = JSON.parse(fs.readFileSync('data/real/dorchester-sc/builder_signals.json', 'utf8'));
const evidence = JSON.parse(fs.readFileSync('data/real/dorchester-sc/market_evidence.json', 'utf8'));
const adapterSource = fs.readFileSync('scripts/adapters/dorchester-evolve-permit-builders.mjs', 'utf8');
const appSource = fs.readFileSync('src/app.mjs', 'utf8');
const prioritySource = fs.readFileSync('scripts/priority-permit-markets.mjs', 'utf8');
const forsythEvidence = JSON.parse(fs.readFileSync('data/real/forsyth-ga/market_evidence.json', 'utf8'));

assert.equal(evidence.marketId, 'dorchester-sc');
assert.equal(evidence.state, 'SC');
assert.ok(evidence.summary.permitRowsSampled >= 1000, 'Dorchester must be backed by a meaningful public permit sample.');
assert.ok(evidence.summary.residentialRows >= 500, 'Dorchester must expose residential permit rows.');
assert.ok(signals.length >= 20, 'Dorchester must clear the 20-builder floor before entering the UI.');
assert.ok(evidence.summary.uniqueBuilders >= 20, 'Dorchester evidence must record the 20-builder floor.');
assert.ok(signals.some(row => row.name === 'Lennar Carolinas'), 'Expected Lennar Carolinas permit signal.');
assert.ok(signals.some(row => row.name === 'DR Horton'), 'Expected DR Horton permit signal.');
assert.ok(signals.some(row => row.name === 'True Homes'), 'Expected True Homes permit signal.');
assert.ok(signals.every(row => row.validationStatus === 'needs-call-confirmation'), 'Permit builders must remain buyer-validation queue items, not validated demand.');
assert.ok(signals.every(row => row.market === 'dorchester-sc' && row.state === 'SC'), 'Dorchester rows must carry market/state.');
assert.ok(!signals.some(row => /^(LN|RD|AVE|CT|WAY|TRL|RUN|BRIDGE)\s/i.test(row.name)), 'Contractor parser must not leave street-suffix prefixes in builder names.');
assert.ok(!signals.some(row => /^DR\s/i.test(row.name) && row.name !== 'DR Horton'), 'Contractor parser must not leave DR prefix except DR Horton.');
assert.match(adapterSource, /minimumUniqueBuilders = MINIMUM_UNIQUE_BUILDERS/, 'Adapter must retain the 20-builder floor.');
assert.match(appSource, /dorchester-sc/, 'Dorchester must be registered in the builder UI loader.');
assert.match(prioritySource, /Georgia secondary/);
assert.match(prioritySource, /South Carolina secondary/);
assert.match(prioritySource, /dorchester-evolve-permit-builders/);
assert.equal(forsythEvidence.marketId, 'forsyth-ga');
assert.equal(forsythEvidence.summary.uniqueBuilders, 0, 'Forsyth GA must not pretend to have builder names from the open layer.');
assert.match(forsythEvidence.summary.builderQueueStatus, /no-contractor-field/);

console.log('Dorchester SC permit-builder guard passed');
