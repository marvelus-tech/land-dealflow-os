import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.mjs', 'utf8');
const scripts = fs.readFileSync('src/outreachScripts.mjs', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const landScopeMatches = scripts.match(/"scope": "deals"/g) || [];
assert.ok(landScopeMatches.length >= 10, 'Land page must have a real land-owner script bank in the deals scope.');
assert.match(scripts, /land-owner-complete-call-skeleton/, 'Land owner complete call skeleton must be available.');
assert.match(scripts, /land-tax-deed-auction-owner-opener/, 'Tax deed owner opener from recent video must be available.');
assert.match(scripts, /YPqUHvSAZrU/, 'Joe McCall land-owner script source video must stay traceable.');
assert.match(scripts, /7u4FpBF6ao8/, 'Tax deed auction owner source video must stay traceable.');
assert.match(app, /deals: 'Land owner scripts'/, 'Script drawer label must name the Land owner scope.');
assert.match(app, /scriptButton\('deals', 'Scripts'\)/, 'Land page must expose the same Scripts pull-panel UX.');
assert.match(html, /phase288-land-owner-scripts/, 'Live app module cache token must include the Land owner scripts phase.');
assert.match(pkg.scripts.test, /phase288-land-owner-script-drawer\.test\.mjs/, 'Full npm test must include the Phase 288 Land owner script drawer guard.');

console.log('phase288 land owner script drawer guard passed');
