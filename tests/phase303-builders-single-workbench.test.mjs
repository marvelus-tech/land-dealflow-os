import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(app, /builder-unified-workbench-command/, 'Phase 2 must expose a unified workbench command banner.');
assert.match(app, /aria-label="Unified builder workbench"/, 'Phase 2 command banner must be named as a unified workbench.');
assert.match(app, /One selected builder, one work list, one detail panel/, 'Phase 2 must explain the one-list/one-detail operating model.');
assert.match(app, /<span>Work list <button type="button" class="info-dot" aria-label="Why this work list order\?"/, 'Primary list copy must say Work list, not Queue.');
assert.match(app, /aria-label="Work-list filters"/, 'Queue filter aria copy must move to work-list language.');

assert.doesNotMatch(app, /<div class="phase3-call-sheet">/, 'Phase 2 must remove the duplicate top call-sheet queue markup.');
assert.doesNotMatch(app, /data-phase3-builder-row/, 'Phase 2 must not render a second set of builder rows above the workbench.');
assert.doesNotMatch(app, /Today's call queue|Top 25 callable builders/, 'Phase 2 must remove duplicate call-queue headline/copy.');
assert.match(app, /data-builder-queue-surface/, 'Phase 2 must keep the single primary interactive builder work list.');
assert.match(app, /validation-focus-card" id="selected-builder-card"/, 'Phase 2 must keep the selected-builder detail panel attached to the single list.');
assert.match(app, /phase3-outcome-capture/, 'Phase 2 must keep one-click outcomes attached to the selected-builder model.');
assert.match(app, /id="export-builder-call-queue-csv"/, 'Phase 2 must preserve export affordance after removing the duplicate queue.');

assert.match(css, /v1\.103 - Builders Phase 1 command spine/, 'Phase 2 must preserve the shipped Phase 1 top hierarchy layer.');
assert.match(html, /phase303-builders-single-workbench/, 'index.html must cache-bust the Phase 2 single-workbench update.');
assert.match(pkg.scripts.test, /phase303-builders-single-workbench\.test\.mjs/, 'Full npm test must include the Phase 303 guard.');

console.log('phase303 Builders single workbench guard passed');
