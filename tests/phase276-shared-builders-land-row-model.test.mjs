import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

assert.match(app, /function sharedRowInteractionModel\(/, 'Phase 3 must define one shared row interaction model for Builders and Land');
assert.match(app, /kind === 'builder'[\s\S]{0,1800}progress: \[/, 'shared row model must normalize builder rows into status/progress steps');
assert.match(app, /kind: 'land'[\s\S]{0,1800}progress: \[/, 'shared row model must normalize land rows into status/progress steps');
assert.match(app, /function sharedRowDataAttributes\(/, 'shared row model must expose common data attributes for route-neutral interaction state');
assert.match(app, /function renderSharedRowProgress\(/, 'shared row model must render route-neutral progress chips');

assert.match(app, /validation-queue-item shared-work-row[\s\S]{0,260}\$\{sharedRowDataAttributes\(sharedRow\)\}/, 'Builder validation rows must use the shared row shell and attributes');
assert.match(app, /data-shared-row-select="builder"/, 'Builder row selection must be marked through the shared selection contract');
assert.match(app, /renderSharedRowProgress\(sharedRow\)[\s\S]{0,260}<div class="queue-state-row"/, 'Builder rows must show shared progress before route-specific outreach controls');

assert.match(app, /land-listing-row shared-work-row[\s\S]{0,520}\$\{sharedRowDataAttributes\(sharedRow\)\}/, 'Land queue rows must use the same shared row shell and attributes');
assert.match(app, /data-shared-row-select="land"/, 'Land row selection must be marked through the shared selection contract');
assert.match(app, /renderSharedRowProgress\(sharedRow\)[\s\S]{0,260}<em><strong>\$\{h\(queueReason\)\}/, 'Land rows must show shared progress inside the scan-first row before route-specific signals');

assert.match(css, /v1\.99\.7 - Phase 3 shared Builders\/Land row interaction model/, 'Phase 3 shared row CSS marker must be present');
assert.match(css, /--phase276-shared-row-model: builders-land-proof-contact-fit-status-progress/, 'shared row CSS must encode the proof/contact/fit/status/progress contract');
assert.match(css, /\.shared-work-row\[data-shared-row\]/, 'shared row shell must be styled generically');
assert.match(css, /\.shared-row-progress[\s\S]{0,380}display: flex/, 'shared row progress must have real layout styling');
assert.match(css, /body\[data-active-view="builders"\][\s\S]{0,180}\.validation-queue-item\.shared-work-row \.shared-row-progress/, 'Builder route must have scoped shared progress placement');
assert.match(css, /body\[data-active-view="deals"\][\s\S]{0,180}\.land-listing-row\.shared-work-row \.shared-row-progress/, 'Land route must have scoped shared progress placement');
assert.match(html, /phase276-shared-row-model/, 'index.html must cache-bust Phase 3 shared row model changes');

console.log('phase276 shared Builders/Land row model guard passed');
