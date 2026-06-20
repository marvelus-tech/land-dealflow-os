import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const coreSource = readFileSync(new URL('../src/core.mjs', import.meta.url), 'utf8');

assert.match(html, /id="source-priority-board"/, 'Sources page must reserve a priority permit-market board');
assert.match(appSource, /function renderSourcePriorityBoard/, 'Sources page must render the priority market board from permit landscape data');
assert.match(appSource, /TN first\. Then inland FL, AZ, NC, TX\./, 'Sources page must reflect the user-supplied target-state priority stack');
assert.match(appSource, /const stateOrder = \['TN', 'FL', 'AZ', 'NC', 'TX'\]/, 'Builders state rail must follow TN -> inland FL -> AZ -> NC -> TX');
assert.match(appSource, /getPermitPortalLandscape\(\)/, 'Sources priority board must render from tested permit landscape data');
assert.match(coreSource, /Buildchek|PermitVector/, 'Permit landscape data must preserve aggregator/platform references');
assert.match(appSource, /renderSourcePriorityBoard\(\)/, 'Sources priority board must be part of the render loop');
assert.match(css, /#sources-hub \.source-popover[\s\S]{0,420}position: absolute !important/, 'Desktop source inspector must float instead of consuming card layout');
assert.match(css, /bottom: calc\(100% \+ 12px\) !important/, 'Desktop source inspector must appear above the source control');
assert.match(css, /#sources-hub \.source-disclosure summary span[\s\S]{0,120}display: none !important/, 'Source buttons should avoid redundant visible Source label text');
assert.match(css, /#sources-hub \.pipeline[\s\S]{0,160}repeat\(7,/, 'Desktop source pipeline should read as a compact seven-stage row');

console.log('sources page UI tests passed');
