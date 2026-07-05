import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/app.mjs', 'utf8');
const markets = [
  ['knoxville', 'TN', 'data/real/knoxville/builder_signals.json', 20],
  ['austin', 'TX', 'data/real/austin/builder_signals.json', 20],
  ['san-antonio', 'TX', 'data/real/san-antonio/builder_signals.json', 20],
  ['raleigh', 'NC', 'data/real/raleigh/builder_signals.json', 20],
  ['rocky-mount-nc', 'NC', 'data/real/rocky-mount-nc/builder_signals.json', 10],
  ['polk', 'FL', 'data/real/polk/builder_signals.json', 20],
  ['port-charlotte-fl-33948', 'FL', 'data/real/port-charlotte-fl-33948/builder_signals.json', 20],
  ['punta-gorda-fl-33983', 'FL', 'data/real/punta-gorda-fl-33983/builder_signals.json', 20],
  ['port-charlotte-fl-33953', 'FL', 'data/real/port-charlotte-fl-33953/builder_signals.json', 20],
  ['maricopa', 'AZ', 'data/real/maricopa/builder_signals.json', 20],
  ['mohave-valley-az-86440', 'AZ', 'data/real/mohave-valley-az-86440/builder_signals.json', 17],
  ['maricopa-ak-chin-az-85139', 'AZ', 'data/real/maricopa-ak-chin-az-85139/builder_signals.json', 20],
  ['pahoa-keaau-hi', 'HI', 'data/real/pahoa-keaau-hi/builder_signals.json', 20],
  ['pahrump-nv-89048', 'NV', 'data/real/pahrump-nv-89048/builder_signals.json', 20],
  ['joshua-tree-ca-92252', 'CA', 'data/real/joshua-tree-ca-92252/builder_signals.json', 20],
  ['dorchester-sc', 'SC', 'data/real/dorchester-sc/builder_signals.json', 20],
  ['columbus-oh', 'OH', 'data/real/columbus-oh/builder_signals.json', 20],
  ['philadelphia-pa', 'PA', 'data/real/philadelphia-pa/builder_signals.json', 25],
  ['pittsburgh-pa', 'PA', 'data/real/pittsburgh-pa/builder_signals.json', 11],
  ['forsyth-ga', 'GA', 'data/real/forsyth-ga/builder_signals.json', 18],
  ['hall-ga', 'GA', 'data/real/hall-ga/builder_signals.json', 11],
  ['boise-id', 'ID', 'data/real/boise-id/builder_signals.json', 30],
  ['evansville-in', 'IN', 'data/real/evansville-in/builder_signals.json', 30],
];

const duplicateKey = row => String(row.name || row.companyName || row.builderName || row.contractorName || '').toLowerCase().replace(/\b(limited liability company|llc|l l c|incorporated|inc|corporation|corp|company|co|ltd|limited)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim() || String(row.website || row.contactUrl || '').trim().toLowerCase().replace(/\/$/, '');

assert.match(app, /const builderMarketSources = \[/, 'UI must declare deployed builder market sources');
assert.match(app, /async function loadBuilderMarketData\(\)/, 'UI must load multi-market builder JSON');
assert.match(app, /loadBuilderMarketData\(\)\.then\(renderAll\)/, 'UI must render after multi-market data loads');
assert.match(app, /getStateBuilderRows\(stateCode\)/, 'UI must select builders by active state');
assert.match(app, /Array\.isArray\(data\) \? data : data\.rows/, 'UI loader must accept bare-array builder signal artifacts as well as { rows } payloads');
assert.match(app, /renderBuyerValidationCommandCenter\(activeState, activeBuilders, activeSummary\)/, 'Buyer validation command center must receive active market rows');
assert.match(app, /builderMarketRouteHash/, 'Builders market selection must write URL-backed state');
assert.match(app, /builderRouteSelectionFromHash/, 'Builders deep links must restore selected state or market');
assert.match(app, /renderBuilderMarketHero/, 'Builders page must render a dedicated market-world hero');
assert.match(app, /Explore markets/, 'Market list should be hidden behind an elegant contextual market explorer');
assert.match(app, /seller sourcing stays parked until a buy box is captured/, 'Selected market copy should keep the buyer-first proof gate clear');
assert.doesNotMatch(app, /Pick the state\. Read the queue\./, 'Rejected Builders poster headline must not return');
assert.doesNotMatch(app, /builders-primary-action[\s\S]{0,80}<span>Next action<\/span>/, 'Builders primary action should not waste hierarchy with a redundant Next action label');
assert.match(app, /const builderMarketRegistry = \[/, 'Builders page must expose a market registry, not only a state rail');
assert.match(app, /let selectedBuilderMarketState = 'FL'/, 'Builders must open on the new Florida ZIP sprint lanes instead of the old rail');
assert.match(app, /const orderedRegistry = \[[\s\S]{0,220}expansionStateCodes\.has\(registry\.state\)/, 'Builders switchboard must pin new ZIP sprint states plus expansion markets before older lanes');
assert.match(app, /function builderStateSummaryEntries/, 'Builders selector must aggregate county lanes into state-level market choices');
assert.match(app, /<section class="state-first-ops-header builders-phase83-workbench builders-market-page"/, 'Selected-market Builders page must keep the integrated phase 83 workbench hook');
assert.doesNotMatch(app, /<section class="builder-ops-header"/, 'State-first Builders header must not inherit legacy hero layout');
assert.match(app, /data-state-market-selector/, 'Builders top selector must be state-first, not a county-card switchboard');
assert.match(app, /state-workbench-layout builder-market-page-layout/, 'Selected market data and hidden market switcher must sit inside one page-like workbench layout');
assert.match(app, /<details class="builder-market-switcher"/, 'Integrated workbench must label the selected market without exposing every market by default');
assert.match(app, /phase85-builder-ledger/, 'Builders lower queue must use the phase 85 calm operating ledger hook');
assert.match(app, /Queue pending verified proof\./, 'Empty builder states should explain the proof gate, not read like a broken list');
assert.match(app, /builder-empty-proof/, 'Empty builder queues should show source proof as a sibling ledger, not a nested card');
assert.doesNotMatch(app, /builder-market-workbench state-first-workbench/, 'State-first selector must not inherit legacy county-switchboard workbench layout');
assert.match(app, /<div role="button" tabindex="0" class="state-market-toggle/, 'State selector controls must avoid global button chrome');
assert.match(app, /active is-active/, 'Active Builders state row must expose the is-active hook used by the late Apple hierarchy layer');
assert.match(app, /state-market-name/, 'State selector rows must split state name from lane thesis for desktop hierarchy');
assert.match(app, /state-market-thesis/, 'State selector rows must demote the lane thesis below the state name');
assert.match(app, /<em><b>\$\{h\(state\.builderCount\)\}<\/b><span>builders<\/span><\/em>/, 'Builder count must be a labeled metric, not an unlabeled number');
assert.doesNotMatch(app, /class="builders-primary-action"/, 'Top-of-page utility jump should not compete with the selected-market page');
assert.match(app, /<li title="Permit-backed builder rows under this state\."\s*><b>\$\{h\(activeBuilders\.length\)\}<\/b><span>builders<\/span><\/li>/, 'Selected-state summary metrics should split numerals from labels');
assert.doesNotMatch(app, /<button type="button" class="state-market-toggle/, 'State selector controls must not be native buttons with inherited dark slabs');
assert.match(app, /<details class="builder-market-switcher"/, 'Market selection must be progressive disclosure behind a change-market control');
assert.match(app, /function renderBuilderCountyLedger/, 'County lanes must move into selected-state evidence detail');
assert.match(app, /<details class="state-county-ledger">/, 'County lane detail should be progressive disclosure, not open noise by default');
assert.doesNotMatch(app, /<details class="state-county-ledger" open>/, 'County lane detail must not overwhelm the selected-state summary by default');
assert.match(app, /data-builder-market-key/, 'Builders switchboard must switch individual markets on demand');
assert.match(app, /0 builders · needs source work/, 'Low/no-count markets must remain visible with source-work copy');
for (const key of ['port-charlotte-fl-33948', 'punta-gorda-fl-33983', 'port-charlotte-fl-33953', 'mohave-valley-az-86440', 'maricopa-ak-chin-az-85139', 'pahoa-keaau-hi', 'pahrump-nv-89048', 'joshua-tree-ca-92252', 'columbus-oh', 'boise-id', 'evansville-in', 'indianapolis-in', 'philadelphia-pa', 'pittsburgh-pa']) {
  assert.match(app, new RegExp(`key: '${key}'`), `New ZIP sprint or queued market must remain visible on Builders: ${key}`);
}
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
assert.doesNotMatch(app, /\$\{renderSellerSearchControlLayer\(sellerControl\)\}/, 'Builders page must not render the global seller-search operating-flow panel');
assert.doesNotMatch(app, /\$\{renderExecutionConveyor\(executionConveyor\)\}/, 'Builders page must not render the global call-to-close conveyor panel');
assert.match(app, /renderBuyerValidationCommandCenter\(activeState, activeBuilders, activeSummary\)/, 'Builders page should keep the builder-specific validation command center after culling global flow panels');
assert.match(app, /<summary><span>Relationship email<\/span>\$\{solidIndustryIcon\('chevron'\)\}<\/summary>/, 'relationship email draft should be retained inside the main command center with concise builder-first copy');
assert.match(app, /Copy relationship draft/, 'Builders page should store the relationship draft as a copyable email drawer');
assert.match(app, /Relationship draft copied\./, 'Copy feedback must match the relationship-email workflow');

assert.match(app, /row\.name \|\| row\.companyName \|\| row\.builderName/, 'Builder normalization must display builderName-only permit artifacts, not Unnamed builder');
assert.match(app, /row\.sourceUrl \|\| asArray\(row\.sourceUrls\)\[0\]/, 'Builder normalization must use sourceUrls arrays for proof links');
assert.match(app, /let selectedBuilderMarketKey = ''/, 'Builders should open on the whole selected state so every live county lane is visible before drilling into one market');
assert.match(app, /selectedBuilderMarketKey = ''/, 'Clicking a state must reset the county lane filter and show every live market in that state');
assert.match(app, /function mergeDuplicateBuilderRows/, 'Builders loader must dedupe repeated public profile rows before rendering');
assert.match(app, /builderDedupeKey/, 'Builders loader must use a stable profile/name key for duplicate prevention');
assert.match(app, /mergeDuplicateBuilderRows\(asArray\(Array\.isArray\(data\) \? data : data\.rows\)\.map/, 'All loaded market artifacts should pass through duplicate-row merging');
assert.match(app, /return mergeDuplicateBuilderRows\(getBuilderMarketEntriesForState\(stateCode\)/, 'State-level builder queues must dedupe the same company across adjacent market lanes');
assert.match(app, /const rows = mergeDuplicateBuilderRows\(markets\.flatMap\(market => asArray\(market\.rows\)\)\)/, 'State selector summaries must use deduped state rows, not summed market rows');

for (const [key, state, url, minRows] of markets) {
  assert.ok(app.includes(`key: '${key}'`), `missing builder source key ${key}`);
  assert.ok(app.includes(`state: '${state}'`), `missing state ${state} for ${key}`);
  assert.ok(app.includes(url), `missing builder signals URL ${url}`);
  const rows = JSON.parse(fs.readFileSync(url, 'utf8'));
  assert.ok(rows.length >= minRows, `${key} must have at least ${minRows} deployed builder rows`);
  const duplicateKeys = rows.map(duplicateKey).filter(Boolean);
  assert.equal(new Set(duplicateKeys).size, duplicateKeys.length, `${key} must not contain duplicate public builder profile/name rows`);
}

for (const key of ['port-charlotte-fl-33948', 'punta-gorda-fl-33983', 'port-charlotte-fl-33953', 'mohave-valley-az-86440', 'maricopa-ak-chin-az-85139', 'pahoa-keaau-hi', 'pahrump-nv-89048', 'joshua-tree-ca-92252', 'columbus-oh', 'boise-id', 'evansville-in', 'indianapolis-in', 'philadelphia-pa', 'pittsburgh-pa', 'forsyth-ga', 'hall-ga', 'jackson-ga', 'douglas-ga', 'dorchester-sc', 'berkeley-sc', 'greenville-sc']) {
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
assert.match(css, /v1\.85 - Builders lower queue becomes a calm operating ledger/, 'Phase 85 lower Builders ledger CSS missing');
assert.match(css, /v1\.86 - Builders lower ledger second pass: empty queue is status, not hero/, 'Phase 86 lower queue second-pass scale correction missing');
assert.match(css, /v1\.87 - Builders workbench Apple review correction: product surface, not poster/, 'Phase 87 Apple review correction missing');
assert.match(css, /v1\.88 - Builders open work surface: remove the presentation frame/, 'Phase 88 open work-surface correction missing');
assert.match(css, /v1\.89 - Builders desktop selector typography: state first, proof second, metric last/, 'Phase 89 desktop selector hierarchy layer missing');
assert.match(css, /v1\.89\.5 - Builders desktop second-pass: tighten selector cadence after self-review/, 'Phase 89 second-pass desktop correction missing');
assert.match(css, /v1\.89\.6 - Builders desktop Apple review fix: compact rail, no dead disclosure slab/, 'Phase 89 final screenshot-QA correction missing');
assert.match(css, /v1\.90 - Builders desktop header compression: brand signal becomes a quiet label, workbench moves up/, 'Phase 90 desktop header compression layer missing');
assert.match(css, /v1\.90\.5 - Builders desktop workbench compression: instruction rail stops behaving like hero copy/, 'Phase 90.5 workbench compression layer missing');
assert.match(css, /v1\.90\.6 - Builders desktop final action rail: one-line instruction, one quiet link/, 'Phase 90.6 final action rail layer missing');
assert.match(css, /--phase90-builders-desktop-rule: compact-route-heading-prioritize-workbench/, 'Phase 90 route-scoped desktop rule token missing');
assert.match(css, /#builder-list-section > \.section-heading\.compact-heading \{[\s\S]{0,260}grid-template-columns: auto minmax\(0, 1fr\) auto !important/, 'Builders desktop route heading should be an inline label row, not a tall hero');
assert.match(css, /#builder-list-section > \.section-heading\.compact-heading h2 \{[\s\S]{0,220}font-size: clamp\(22px, 2\.05vw, 31px\) !important/, 'Builders desktop Buyer-first heading should be compact, not poster scale');
assert.match(css, /@media \(min-width: 821px\) \{[\s\S]{0,140}body\[data-active-view="builders"\] \.builders-phase83-workbench/, 'Phase 89 must be desktop-scoped to Builders');
assert.match(css, /\.state-market-code,[\s\S]{0,260}\.state-code \{[\s\S]{0,420}border-radius: 999px !important/, 'Phase 89 must style the actual state-market-code DOM hook');
assert.match(css, /\.state-market-toggle em b \{[\s\S]{0,260}color: var\(--builders-gold-refined\) !important;[\s\S]{0,160}font-size: 20px !important/, 'Builder metric must be a clear gold tabular number');
assert.match(css, /\.state-county-ledger:not\(\[open\]\) ul \{[\s\S]{0,80}display: none !important/, 'Collapsed county disclosure must not leave a dead white slab');
assert.match(css, /\.builders-phase83-workbench\.builders-phase83-workbench \{[\s\S]{0,360}border: 0 !important;[\s\S]{0,220}background: transparent !important;[\s\S]{0,120}box-shadow: none !important;/, 'Builders workbench must be an open product surface, not a framed presentation card');
assert.match(css, /\.state-market-grid \{[\s\S]{0,240}border: 0 !important;[\s\S]{0,180}border-top: 1px solid var\(--builders-line\) !important;[\s\S]{0,180}border-bottom: 1px solid var\(--builders-line\) !important;/, 'State selector should use open ledger hairlines, not a boxed table frame');
assert.match(css, /\.state-market-grid/, 'State-first selector grid styles missing');

assert.match(css, /v1\.91 - Builders market-page transition world/, 'Phase 91 market-page transition world layer missing');
assert.match(css, /--phase91-builders-market-rule: url-backed-spatial-market-page-transition/, 'Phase 91 URL-backed market transition token missing');
assert.match(css, /builder-market-hero/, 'Builders market page needs a distinct market-world hero treatment');
assert.match(css, /@keyframes buildersMarketPageIn/, 'Builders market switches need a page-transition animation');

console.log('multi-market builder UI tests passed');
