import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const app = readFileSync('src/app.mjs', 'utf8');
const marker = 'v1.99 - Phase 264 W+K Phase 2 Builders command center';
const start = css.indexOf(marker);
assert.ok(start > -1, 'Phase 264 Builders command center marker missing.');
const phase = css.slice(start);

assert.match(phase, /--phase264-builders-rule: builders-only-one-command-surface-queue-detail-seller-gate/, 'Phase 2 route-scoped rule token missing.');
assert.match(phase, /body\[data-active-view="builders"\] #buyer-validation-command \.validation-grid-main[\s\S]{0,260}grid-template-columns: var\(--phase264-queue\) var\(--phase264-detail\) var\(--phase264-gate\) !important/, 'Builders command surface must be queue/detail/seller gate grid.');
assert.match(phase, /operator-flow-pulse,[\s\S]{0,140}completion-state-legend[\s\S]{0,80}display: none !important/, 'Global product-flow ceremony must be removed inside Builders phase 2.');
assert.match(phase, /validation-queue-item[\s\S]{0,220}border-bottom: 1px solid var\(--phase264-soft-line\) !important[\s\S]{0,120}background: transparent !important/, 'Queue rows must be open ledger rows, not cards.');
assert.match(phase, /validation-focus-head h3[\s\S]{0,180}font-size: clamp\(29px, 3\.2vw, 48px\) !important/, 'Selected builder name must be product-scale, not poster-scale.');
assert.match(phase, /next-best-action[\s\S]{0,180}grid-template-columns: 82px minmax\(0, 1fr\) !important/, 'Next action must be a compact instruction bar.');
assert.match(phase, /validation-actions[\s\S]{0,180}grid-template-columns: repeat\(4, minmax\(0, 1fr\)\) !important/, 'Action rail must stay compact and evenly distributed.');
assert.match(phase, /seller-unlock-card li[\s\S]{0,520}counter-increment: phase264-seller-gate !important/, 'Seller gate must be a numbered ledger.');
assert.match(phase, /@media \(max-width: 860px\)[\s\S]{0,2200}validation-queue \.builder-queue-results[\s\S]{0,160}max-height: 390px !important/, 'Mobile queue must be capped so selected detail appears in-flow.');
assert.match(phase, /builder-market-hero[\s\S]{0,520}border-bottom: 1px solid var\(--phase264-line\) !important[\s\S]{0,220}background: transparent !important/, 'Market hero must become an open memo surface, not a card.');
assert.match(css, /v1\.99\.1 - Phase 264 screenshot correction: one Builders hero/, 'Phase 264 screenshot correction marker missing.');
assert.match(css, /v1\.99\.2 - Phase 264 mobile correction: cap rendered queue result root/, 'Phase 264 mobile queue correction marker missing.');
assert.match(css, /data-builder-queue-results\][\s\S]{0,110}max-height: 390px !important/, 'Mobile queue cap must target the rendered data hook.');
assert.match(css, /active-market-summary\.state-focus-summary \{[\s\S]{0,80}display: none !important/, 'Duplicate active market summary must be removed from Builders Phase 2.');
assert.match(css, /--phase264-correction: no-duplicate-market-summary-compact-hero/, 'Compact single-hero correction token missing.');
assert.match(html, /styles\.css\?v=phase244-phase263-phase264-phase265-phase266-phase267-phase268-sources-operating-map/, 'index.html must cache-bust Phase 267 CSS while preserving older phase guard compatibility.');
assert.match(app, /id="buyer-validation-command" class="validation-command phase85-builder-ledger"/, 'Buyer validation command center renderer must still mount.');

console.log('phase264 Builders command surface guard passed');
