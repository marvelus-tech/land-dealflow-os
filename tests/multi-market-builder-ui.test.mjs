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
];

assert.match(app, /const builderMarketSources = \[/, 'UI must declare deployed builder market sources');
assert.match(app, /async function loadBuilderMarketData\(\)/, 'UI must load multi-market builder JSON');
assert.match(app, /loadBuilderMarketData\(\)\.then\(renderAll\)/, 'UI must render after multi-market data loads');
assert.match(app, /getStateBuilderRows\(stateCode\)/, 'UI must select builders by active state');
assert.match(app, /renderBuyerValidationCommandCenter\(activeState, activeBuilders, activeSummary\)/, 'Buyer validation command center must receive active market rows');
assert.match(app, /TN → inland FL → AZ → NC → TX/, 'Visitor copy should disclose the user-supplied target-state priority stack');
assert.doesNotMatch(app, /const isLive = stateCode === 'TN'/, 'UI must not hard-code only Tennessee as live');
assert.doesNotMatch(app, /non-live states stay empty until real permit pulls are loaded/, 'UI must not tell visitors deployed markets are empty');
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

for (const state of ['TN', 'FL', 'AZ', 'NC', 'TX']) {
  assert.match(app, new RegExp(`\\['TN', 'FL', 'AZ', 'NC', 'TX'\\]`), 'state switcher should follow the target-state priority stack');
  assert.ok(app.includes(`data-builder-market-state`), `state switcher missing for ${state}`);
}

console.log('multi-market builder UI tests passed');
