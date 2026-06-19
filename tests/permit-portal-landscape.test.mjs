import assert from 'node:assert/strict';
import { getPermitPortalLandscape } from '../src/core.mjs';

const landscape = getPermitPortalLandscape();

assert.equal(landscape.leadingMarkets[0].state, 'TN');
assert.match(landscape.leadingMarkets[0].market, /Knoxville/);
assert.ok(landscape.leadingMarkets.some(item => item.state === 'NC'));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'TX'));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'FL'));
assert.ok(landscape.leadingMarkets.some(item => item.state === 'AZ'));
assert.ok(landscape.states.find(state => state.id === 'tn').platforms.includes('Buildchek'));
assert.ok(landscape.states.find(state => state.id === 'tx').platforms.includes('PermitVector'));
assert.ok(landscape.tiers[0].items.find(item => item.label === 'Buildchek'));
assert.ok(landscape.tiers[0].items.find(item => item.label === 'PermitVector'));

const stateById = Object.fromEntries(landscape.states.map(state => [state.id, state]));
assert.equal(stateById.tn.sequence.status, 'live');
assert.equal(stateById.tx.sequence.status, 'resource');
assert.match(stateById.tx.sequence.label, /Resource well/);
assert.match(stateById.tx.sequence.unlock, /Austin\/San Antonio/);
assert.match(stateById.tx.pipeline[0].source, /PermitVector|Socrata/);
assert.match(stateById.tx.pipeline[1].output, /Austin.*San Antonio.*Houston\/Dallas/s);
for (const id of ['tn', 'tx', 'nc', 'fl', 'az']) {
  assert.equal(stateById[id].pipeline.length, 4, `${id} should have a four-step permit-builder pipeline`);
  assert.match(stateById[id].pipeline.at(-1).output, /buy|seller|validation/i, `${id} final step should gate seller work behind buyer validation`);
}

console.log('permit portal landscape tests passed');
