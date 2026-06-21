import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const coreSource = readFileSync(new URL('../src/core.mjs', import.meta.url), 'utf8');

assert.match(html, /id="source-priority-board"/, 'Sources page must reserve a priority permit-market board');
assert.match(appSource, /function renderSourcePriorityBoard/, 'Sources page must render the priority market board from permit landscape data');
assert.match(appSource, /TN first\. Then inland FL, AZ, NC, TX\. GA\/SC secondary\./, 'Sources page must reflect the expanded target-state priority stack');
assert.match(appSource, /const builderMarketRegistry = \[/, 'Builders rail must come from a selectable market registry, not a hardcoded state path');
assert.match(appSource, /Suggested order, not a lock/, 'Builders copy must not present the Sources priority stack as a forced path');
assert.match(appSource, /getPermitPortalLandscape\(\)/, 'Sources priority board must render from tested permit landscape data');
for (const key of ['forsyth-ga', 'hall-ga', 'jackson-ga', 'douglas-ga', 'dorchester-sc', 'berkeley-sc', 'greenville-sc']) {
  assert.match(appSource, new RegExp(`key: '${key}'`), `Sources/Builders shared market registry must keep ${key} visible.`);
}
assert.match(appSource, /Georgia[\s\S]{0,220}Forsyth\/Hall\/Jackson\/Douglas permit lanes/, 'Sources page must describe the GA expansion lanes.');
assert.match(appSource, /South Carolina[\s\S]{0,220}Dorchester live \+ Berkeley watchlist/, 'Sources page must describe the SC expansion lanes.');
assert.match(coreSource, /Buildchek|PermitVector/, 'Permit landscape data must preserve aggregator/platform references');
assert.match(appSource, /renderSourcePriorityBoard\(\)/, 'Sources priority board must be part of the render loop');
assert.match(css, /#sources-hub \.source-popover[\s\S]{0,420}position: absolute !important/, 'Desktop source inspector must float instead of consuming card layout');
assert.match(css, /bottom: calc\(100% \+ 12px\) !important/, 'Desktop source inspector must appear above the source control');
assert.match(css, /#sources-hub \.source-disclosure summary span[\s\S]{0,120}display: none !important/, 'Source buttons should avoid redundant visible Source label text');
assert.match(css, /#sources-hub \.pipeline[\s\S]{0,160}repeat\(7,/, 'Desktop source pipeline should read as a compact seven-stage row');

console.log('sources page UI tests passed');
