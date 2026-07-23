import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.mjs', 'utf8');
const scripts = fs.readFileSync('src/outreachScripts.mjs', 'utf8');
const artifact = fs.readFileSync('artifacts/video-scripts/YPqUHvSAZrU/extracted-land-and-agent-scripts.txt', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.match(scripts, /agent-land-resale-price-reality-check/, 'YP realtor resale price check must be appended to Agents scripts.');
assert.match(scripts, /agent-is-price-fair-market-check/, 'YP realtor fair-price check must be appended to Agents scripts.');
assert.match(scripts, /agent-offer-presentation-check/, 'YP realtor offer presentation check must be appended to Agents scripts.');
assert.match(scripts, /land-owner-why-not-retail-route/, 'YP land seller retail-vs-direct route must be on Land page.');
assert.match(scripts, /land-owner-other-lots-and-facts/, 'YP land seller other-lots/facts script must be on Land page.');
assert.doesNotMatch(scripts, /land-owner-terms-pivot/, 'Seller-finance terms pivot must be excluded for now.');
assert.doesNotMatch(scripts, /seller financing/i, 'Seller-finance script language must be excluded for now.');
assert.doesNotMatch(scripts, /tell me why should I buy your house/i, 'Home/house-specific seller script language must not be installed.');
assert.match(scripts, /YPqUHvSAZrU/, 'Source video ID must stay traceable on installed script cards.');
assert.match(artifact, /Excluded now:[\s\S]*seller-finance pitch/, 'Extraction artifact must document excluded seller-finance scripts.');
assert.match(app, /phase289-yp-land-agent-scripts/, 'App import must cache-bust the YP land/agent script phase.');
assert.match(html, /phase289-yp-land-agent-scripts/, 'Live HTML module URL must cache-bust the YP land/agent script phase.');
assert.match(app, /agents: 'Agent scripts'/, 'Agent script drawer label must remain available.');
assert.match(app, /deals: 'Land owner scripts'/, 'Land script drawer label must remain available.');
assert.match(pkg.scripts.test, /phase289-yp-land-agent-scripts\.test\.mjs/, 'Full npm test must include the Phase 289 guard.');

console.log('phase289 YP land/agent script extraction guard passed');
