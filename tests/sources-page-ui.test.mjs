import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const coreSource = readFileSync(new URL('../src/core.mjs', import.meta.url), 'utf8');

assert.match(html, /id="source-priority-board"/, 'Sources page must reserve a priority permit-market board');
assert.match(appSource, /function renderSourcePriorityBoard/, 'Sources page must render the priority market board from permit landscape data');
assert.match(appSource, /New ZIP sprints are live: FL, AZ, HI, NV, CA\./, 'Sources page must reflect the expanded target-state priority stack');
assert.match(appSource, /const builderMarketRegistry = \[/, 'Builders rail must come from a selectable market registry, not a hardcoded state path');
assert.match(appSource, /Counties stay as evidence/, 'Builders copy must not present the Sources priority stack as a forced path');
assert.match(appSource, /getPermitPortalLandscape\(\)/, 'Sources priority board must render from tested permit landscape data');
for (const key of ['port-charlotte-fl-33948', 'punta-gorda-fl-33983', 'port-charlotte-fl-33953', 'mohave-valley-az-86440', 'maricopa-ak-chin-az-85139', 'pahoa-keaau-hi', 'pahrump-nv-89048', 'joshua-tree-ca-92252', 'columbus-oh', 'boise-id', 'indianapolis-in', 'pittsburgh-pa', 'forsyth-ga', 'hall-ga', 'jackson-ga', 'douglas-ga', 'dorchester-sc', 'berkeley-sc', 'greenville-sc']) {
  assert.match(appSource, new RegExp(`key: '${key}'`), `Sources/Builders shared market registry must keep ${key} visible.`);
}
assert.match(appSource, /Georgia[\s\S]{0,220}Forsyth\/Hall\/Jackson\/Douglas permit lanes/, 'Sources page must describe the GA expansion lanes.');
assert.match(appSource, /South Carolina[\s\S]{0,220}Dorchester live \+ Berkeley watchlist/, 'Sources page must describe the SC expansion lanes.');
assert.match(coreSource, /Buildchek|PermitVector/, 'Permit landscape data must preserve aggregator/platform references');
assert.match(appSource, /renderSourcePriorityBoard\(\)/, 'Sources priority board must be part of the render loop');
assert.match(appSource, /Market Radar · placeholder/, 'Sources page must reserve the hot-land market radar workflow placeholder');
assert.match(appSource, /Raw candidate != validated market/, 'Market Radar placeholder must keep raw candidates separate from validated markets');
assert.match(appSource, /Land.com sold\/pending/, 'Market Radar placeholder must preserve the 15-minute market scan method');
assert.match(css, /#weekly-market-scout:has\(\.market-radar-placeholder\)[\s\S]{0,180}max-height: none !important/, 'Market Radar placeholder must not inherit the collapsed weekly scout shell');
assert.match(css, /#sources-hub \.source-popover[\s\S]{0,420}position: absolute !important/, 'Desktop source inspector must float instead of consuming card layout');
assert.match(css, /bottom: calc\(100% \+ 12px\) !important/, 'Desktop source inspector must appear above the source control');
assert.match(css, /#sources-hub \.source-disclosure summary span[\s\S]{0,120}display: none !important/, 'Source buttons should avoid redundant visible Source label text');
assert.match(css, /#sources-hub \.pipeline[\s\S]{0,160}repeat\(7,/, 'Desktop source pipeline should read as a compact seven-stage row');

console.log('sources page UI tests passed');
