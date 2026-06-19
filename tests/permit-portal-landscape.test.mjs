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

console.log('permit portal landscape tests passed');
