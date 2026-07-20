import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

assert.match(css, /v1\.99\.9\.2 - Phase 5 mobile correction: Builder state market rail readable cards/, 'Phase 279 mobile correction marker must be present');
assert.match(css, /--phase279-mobile-builder-market-rail: readable-horizontal-market-cards/, 'Phase 279 token must encode the mobile market rail contract');
assert.match(css, /@media \(max-width: 760px\)[\s\S]{0,900}\.builder-command-market-scroll[\s\S]{0,260}display: flex !important[\s\S]{0,260}overflow-x: auto !important/, 'Mobile builder market rail must remain a horizontal scroller');
assert.match(css, /@media \(max-width: 760px\)[\s\S]{0,1500}\.builder-command-market\s*\{[\s\S]{0,360}flex: 0 0 min\(274px, calc\(100vw - 132px\)\) !important/, 'Mobile builder market cards must have a fixed readable flex basis instead of shrinking into columns');
assert.match(css, /@media \(max-width: 760px\)[\s\S]{0,2100}\.builder-command-market-name[\s\S]{0,240}white-space: normal !important/, 'Mobile builder market names must be allowed to wrap naturally inside a readable card');
assert.match(css, /@media \(max-width: 760px\)[\s\S]{0,2600}\.builder-command-market small[\s\S]{0,240}white-space: normal !important/, 'Mobile builder market metrics must wrap within the readable card instead of overflowing');
assert.match(html, /phase279-mobile-builder-market-rail/, 'index.html must cache-bust the mobile builder market rail correction');
assert.match(pkg.scripts.test, /phase279-mobile-builder-market-rail\.test\.mjs/, 'Full npm test must include the Phase 279 mobile market rail guard');

console.log('phase279 mobile builder market rail guard passed');
