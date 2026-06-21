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
assert.match(app, /State first, counties as evidence/, 'Visitor copy should frame states as the primary choice and counties as detail');
assert.match(app, /const builderMarketRegistry = \[/, 'Builders page must expose a market registry, not only a state rail');
assert.match(app, /let selectedBuilderMarketState = 'GA'/, 'Builders must open on expansion lanes instead of the old TN-first rail');
assert.match(app, /const orderedRegistry = \[[\s\S]{0,220}expansionStateCodes\.has\(registry\.state\)/, 'Builders switchboard must pin GA\/SC expansion markets before older lanes');
assert.match(app, /function builderStateSummaryEntries/, 'Builders selector must aggregate county lanes into state-level market choices');
assert.match(app, /<section class="state-first-ops-header builders-phase83-workbench"/, 'State-first Builders header must use the integrated phase 83 workbench');
assert.doesNotMatch(app, /<section class="builder-ops-header"/, 'State-first Builders header must not inherit legacy hero layout');
assert.match(app, /data-state-market-selector/, 'Builders top selector must be state-first, not a county-card switchboard');
assert.match(app, /state-workbench-layout/, 'State selector and selected-state data must sit inside one adjacent workbench layout');
assert.match(app, /Operating state/, 'Integrated workbench must label the selected operating state next to the selector');
assert.doesNotMatch(app, /builder-market-workbench state-first-workbench/, 'State-first selector must not inherit legacy county-switchboard workbench layout');
assert.match(app, /<div role="button" tabindex="0" class="state-market-toggle/, 'State selector controls must avoid global button chrome');
assert.doesNotMatch(app, /<button type="button" class="state-market-toggle/, 'State selector controls must not be native buttons with inherited dark slabs');
assert.match(app, /State first, counties as evidence/, 'Builders copy must explain state-first grouping and progressive county detail');
assert.match(app, /function renderBuilderCountyLedger/, 'County lanes must move into selected-state evidence detail');
assert.match(app, /<details class="state-county-ledger">/, 'County lane detail should be progressive disclosure, not open noise by default');
assert.doesNotMatch(app, /<details class="state-county-ledger" open>/, 'County lane detail must not overwhelm the selected-state summary by default');
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

const css = fs.readFileSync('src/styles.css', 'utf8');
assert.match(css, /v1\.75 - Builders state-first market focus/, 'State-first Builders selector CSS marker missing');
assert.match(css, /v1\.76 - Builders state selector desktop ledger width correction/, 'State-first desktop ledger width correction missing');
assert.match(css, /v1\.77 - Builders state-first workbench owns the full row/, 'State-first full-row desktop workbench correction missing');
assert.match(css, /v1\.78 - State-first Builders header uses normal vertical flow/, 'State-first header normal-flow correction missing');
assert.match(css, /v1\.79 - Isolated state-first Builders header/, 'Isolated state-first header CSS missing');
assert.match(css, /v1\.80 - Isolated state-first child order lock/, 'State-first title/workbench child order lock missing');
assert.match(css, /v1\.81 - State summary mobile copy must never kiss the scrollbar/, 'State summary mobile wrap guard missing');
assert.match(css, /v1\.82 - Mobile state-first header must use full-width block flow/, 'Mobile state-first full-width block flow guard missing');
assert.match(css, /v1\.83 - Builders Apple hierarchy: selector and data become one workbench/, 'Phase 83 integrated Builders workbench CSS missing');
assert.match(css, /v1\.84 - Builders second-pass proximity repair: selected data attaches to selector/, 'Phase 84 selector-data proximity repair missing');
assert.match(css, /\.state-market-grid/, 'State-first selector grid styles missing');

console.log('multi-market builder UI tests passed');
