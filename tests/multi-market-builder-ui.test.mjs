import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/app.mjs', 'utf8');
const markets = [
  ['knoxville', 'TN', 'data/real/knoxville/builder_signals.json'],
  ['austin', 'TX', 'data/real/austin/builder_signals.json'],
  ['san-antonio', 'TX', 'data/real/san-antonio/builder_signals.json'],
  ['raleigh', 'NC', 'data/real/raleigh/builder_signals.json'],
  ['polk', 'FL', 'data/real/polk/builder_signals.json'],
  ['maricopa', 'AZ', 'data/real/maricopa/builder_signals.json'],
  ['dorchester-sc', 'SC', 'data/real/dorchester-sc/builder_signals.json'],
];

assert.match(app, /const builderMarketSources = \[/, 'UI must declare deployed builder market sources');
assert.match(app, /async function loadBuilderMarketData\(\)/, 'UI must load multi-market builder JSON');
assert.match(app, /loadBuilderMarketData\(\)\.then\(renderAll\)/, 'UI must render after multi-market data loads');
assert.match(app, /getStateBuilderRows\(stateCode\)/, 'UI must select builders by active state');
assert.match(app, /Array\.isArray\(data\) \? data : data\.rows/, 'UI loader must accept bare-array builder signal artifacts as well as { rows } payloads');
assert.match(app, /renderBuyerValidationCommandCenter\(activeState, activeBuilders, activeSummary\)/, 'Buyer validation command center must receive active market rows');
assert.match(app, /Suggested order, not a lock/, 'Visitor copy should frame market order as a recommendation, not a hardcoded path');
assert.match(app, /const builderMarketRegistry = \[/, 'Builders page must expose a market registry, not only a state rail');
assert.match(app, /data-builder-market-key/, 'Builders switchboard must switch individual markets on demand');
assert.match(app, /0 builders · needs source work/, 'Low/no-count markets must remain visible with source-work copy');
for (const key of ['forsyth-ga', 'hall-ga', 'jackson-ga', 'douglas-ga']) {
  assert.match(app, new RegExp(`key: '${key}'`), `New Georgia market must remain visible on Builders: ${key}`);
}
for (const key of ['dorchester-sc', 'berkeley-sc', 'greenville-sc']) {
  assert.match(app, new RegExp(`key: '${key}'`), `New South Carolina market must remain visible on Builders: ${key}`);
}
assert.doesNotMatch(app, /const isLive = stateCode === 'TN'/, 'UI must not hard-code only Tennessee as live');
assert.doesNotMatch(app, /non-live states stay empty until real permit pulls are loaded/, 'UI must not tell visitors deployed markets are empty');
assert.doesNotMatch(app, /const stateOrder = \[/, 'Builders switchboard must not use a hardcoded state-only order');
assert.doesNotMatch(app, /id="builder-evidence-desk"/, 'legacy duplicate evidence desk must not render');
assert.doesNotMatch(app, /class="builder-two-col builder-support-tools"/, 'legacy support-tools block must not render');
assert.doesNotMatch(app, /class="builder-table-panel"/, 'duplicate builder table panel must not render');
assert.doesNotMatch(app, /class="builder-script-panel"/, 'duplicate script panel must not render');
assert.match(app, /<summary><span>Intro email<\/span>\$\{solidIndustryIcon\('chevron'\)\}<\/summary>/, 'unique marketing template should be retained inside the main command center with short Phase 26 copy');

for (const [key, state, url] of markets) {
  assert.ok(app.includes(`key: '${key}'`), `missing builder source key ${key}`);
  assert.ok(app.includes(`state: '${state}'`), `missing state ${state} for ${key}`);
  assert.ok(app.includes(url), `missing builder signals URL ${url}`);
  const rows = JSON.parse(fs.readFileSync(url, 'utf8'));
  assert.ok(rows.length >= 20, `${key} must have at least 20 deployed builder rows`);
}

for (const key of ['forsyth-ga', 'hall-ga', 'jackson-ga', 'douglas-ga', 'dorchester-sc', 'berkeley-sc', 'greenville-sc']) {
  assert.ok(app.includes(`key: '${key}'`), `missing visible market key ${key}`);
}

console.log('multi-market builder UI tests passed');
