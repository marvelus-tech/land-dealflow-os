import assert from 'node:assert/strict';
import { getPermitPortalLandscape } from '../src/core.mjs';

const landscape = getPermitPortalLandscape();

assert.equal(landscape.leadingMarkets[0].state, 'TN');
assert.match(landscape.leadingMarkets[0].market, /Knoxville/);
for (const market of [
  ['FL', /Port Charlotte 33948/],
  ['FL', /Punta Gorda/],
  ['FL', /Port Charlotte 33953/],
  ['AZ', /Maricopa \/ Ak-Chin/],
  ['AZ', /Mohave Valley/],
  ['HI', /Puna \/ East Hawaii/],
  ['NV', /Pahrump 89048/],
  ['CA', /Joshua Tree 92252/],
]) {
  assert.ok(
    landscape.leadingMarkets.some(item => item.state === market[0] && market[1].test(item.market)),
    `specific ZIP sprint must appear in Sources priority landscape: ${market[0]} ${market[1]}`,
  );
}
assert.ok(landscape.leadingMarkets.find(item => item.state === 'NC'));
assert.ok(landscape.leadingMarkets.find(item => item.state === 'TX'));
assert.ok(!JSON.stringify(landscape).match(/Kentucky|\bKY\b/), 'Kentucky must not appear in the priority permit landscape');
assert.ok(landscape.leadingMarkets.some(item => item.state === 'NC'));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'TX'));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'FL'));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'AZ'));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'OH' && /Columbus/.test(item.market)));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'PA' && /Pittsburgh/.test(item.market)));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'GA' && /Hall/.test(item.market)));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'ID' && /Boise/.test(item.market)));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'IN' && /Lafayette/.test(item.market)));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'CA' && /Joshua Tree/.test(item.market)));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'HI' && /Puna|East Hawaii/.test(item.market)));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'NV' && /Pahrump/.test(item.market)));
assert.ok(landscape.states.find(state => state.id === 'tn').platforms.includes('Buildchek'));
assert.ok(landscape.states.find(state => state.id === 'tx').platforms.includes('PermitVector'));
assert.ok(landscape.tiers[0].items.find(item => item.label === 'Buildchek'));
assert.ok(landscape.tiers[0].items.find(item => item.label === 'PermitVector'));

const stateById = Object.fromEntries(landscape.states.map(state => [state.id, state]));
assert.equal(stateById.tn.sequence.status, 'live');
assert.equal(stateById.tx.sequence.status, 'resource');
assert.match(stateById.tx.sequence.label, /Source lane/);
assert.match(stateById.tx.sequence.unlock, /Austin\/San Antonio/);
assert.match(stateById.tx.pipeline[0].source, /PermitVector|Socrata/);
assert.match(stateById.tx.pipeline[1].output, /Austin.*San Antonio.*Houston\/Dallas/s);
for (const id of ['tn', 'tx', 'nc', 'fl', 'az', 'oh', 'pa', 'ga', 'id', 'in']) {
  assert.equal(stateById[id].pipeline.length, 4, `${id} should have a four-step permit-builder pipeline`);
  assert.match(stateById[id].pipeline.at(-1).output, /buy|seller|validation/i, `${id} final step should gate seller work behind buyer validation`);
}

console.log('permit portal landscape tests passed');
