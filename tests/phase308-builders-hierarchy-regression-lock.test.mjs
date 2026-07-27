import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const phaseStart = css.indexOf('v1.99.15 - Phase 7 Builders hierarchy regression lock');
assert.ok(phaseStart > -1, 'Phase 7 CSS marker must be present.');
const phase = css.slice(phaseStart);
const validationTemplateStart = app.indexOf('phase7-builders-hierarchy-lock');
const validationTemplateEnd = app.indexOf('function applyBuilderQueueControls', validationTemplateStart);
assert.ok(validationTemplateStart > -1 && validationTemplateEnd > validationTemplateStart, 'Builder validation command template must be discoverable.');
const validationTemplate = app.slice(validationTemplateStart, validationTemplateEnd);

assert.match(app, /phase7-builders-hierarchy-lock/, 'Builders command must carry the Phase 7 hierarchy marker class.');
assert.match(app, /data-builder-hierarchy="single-queue-selected-inspector"/, 'Builders command must declare the single queue + selected inspector hierarchy contract.');
assert.match(phase, /--phase7-builders-hierarchy-lock: single-work-list-attached-inspector-compact-market-rail/, 'Phase 7 route-level hierarchy token must be present.');
assert.match(phase, /--phase7-builders-single-queue: one-work-list-one-selected-inspector-no-secondary-hero/, 'Phase 7 command token must lock the single workbench shape.');

assert.equal((validationTemplate.match(/data-builder-queue-surface/g) || []).length, 1, 'Builders command must render exactly one queue surface.');
assert.equal((validationTemplate.match(/data-builder-queue-results/g) || []).length, 1, 'Builders command must render exactly one queue results container.');
assert.doesNotMatch(validationTemplate, /Phase 3 · today's call queue|Phase 3 builder call execution console|Selected-builder outcome|implementation label/i, 'Builders visible command copy must not expose implementation labels.');
assert.match(app, /One selected builder, one work list, one detail panel/, 'Unified workbench copy must stay product-facing and hierarchy-focused.');

assert.match(phase, /\.builder-market-hero,[\s\S]{0,120}\.builders-index-hero > :not\(\.builders-index-stats\)[\s\S]{0,120}display: none !important/, 'Giant secondary market/index heroes must stay suppressed.');
assert.match(phase, /\.builder-ops-header[\s\S]{0,120}min-height: clamp\(260px, 30vh, 340px\) !important/, 'Builders header must not regress into an oversized secondary hero.');
assert.match(phase, /\.builder-command-market-name,[\s\S]{0,260}white-space: normal !important;[\s\S]{0,180}overflow-wrap: anywhere !important/, 'Market labels must wrap instead of clipping.');
assert.match(phase, /\.builder-command-market-scroll[\s\S]{0,180}overflow-x: auto !important;[\s\S]{0,120}overflow-y: hidden !important/, 'Market rail must scroll horizontally without clipping labels vertically.');
assert.match(validationTemplate, /data-phase7-grid-lock/, 'Builder grid must carry the Phase 7 inline lock marker for late-cascade protection.');
assert.match(phase, /\.validation-grid-main[\s\S]{0,180}grid-template-columns: minmax\(250px, \.72fr\) minmax\(420px, 1\.2fr\) minmax\(360px, 1fr\) !important/, 'Desktop Builders hierarchy must remain seller support + one queue + selected inspector, not duplicate queues.');
assert.match(phase, /\.validation-queue\[data-builder-queue-surface\][\s\S]{0,60}order: 1/, 'The queue must stay first in the hierarchy.');
assert.match(phase, /\.validation-focus-card\.builder-inspector-v3[\s\S]{0,60}order: 2/, 'The selected inspector must stay attached after the queue.');
assert.ok(validationTemplate.indexOf('class="phase3-outcome-capture inspector-outcome-capture"') > validationTemplate.indexOf('class="validation-focus-card builder-inspector-v3"'), 'Outcome controls must live inside the selected inspector.');
assert.ok(validationTemplate.indexOf('class="phase3-outcome-capture inspector-outcome-capture"') < validationTemplate.indexOf('class="buybox-capture-sheet phase4-buybox-capture"'), 'Outcome controls must remain attached before the raw buy-box form.');
assert.match(phase, /\.phase3-outcome-capture\.inspector-outcome-capture,[\s\S]{0,180}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/, 'Outcome controls must stay attached and balanced, not detached as loose controls.');
assert.match(phase, /\.validation-form\.validation-buybox-grid[\s\S]{0,160}max-height: none !important;[\s\S]{0,120}overflow: visible !important/, 'Buy-box form must not regress into an over-tall clipped raw form.');
assert.match(phase, /\.buybox-form-section[\s\S]{0,180}grid-template-columns: repeat\(12, minmax\(0, 1fr\)\) !important/, 'Buy-box form sections must remain compact grouped grids on desktop.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]*\.buybox-form-section[\s\S]{0,160}grid-template-columns: minmax\(0, 1fr\) !important/, 'Mobile buy-box form must collapse without clipping.');
assert.match(html, /phase7-builders-hierarchy-lock/, 'index.html must cache-bust Phase 7 Builders hierarchy assets.');
assert.match(pkg.scripts.test, /phase308-builders-hierarchy-regression-lock\.test\.mjs/, 'Full npm test must include the Phase 7 hierarchy guard.');

console.log('phase308 Builders hierarchy regression lock passed');
