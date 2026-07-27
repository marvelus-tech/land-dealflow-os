import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const marker = 'v1.103 - Builders Phase 1 command spine: compact header, market ledger, faster workbench entry';
const start = css.indexOf(marker);
assert.ok(start > -1, 'Builders Phase 1 command-spine CSS marker missing.');
const phase = css.slice(start);

assert.match(app, /class="builder-phase1-spine" aria-label="Builder page flow"/, 'Builders route must render a clear page-spine flow above the market rail.');
assert.match(app, /Choose market<\/span><span>Call builders<\/span><span>Capture buy box<\/span><span>Unlock sellers/, 'Builder page spine must explain the operator sequence.');
assert.match(app, /aria-label="Unified builder workbench"/, 'Command surface must use product-facing unified-workbench aria copy.');
assert.match(app, /<span class="eyebrow">One workbench<\/span>/, 'Visible command eyebrow must describe the unified workbench.');
assert.doesNotMatch(app, /Phase 3 · today's call queue|Phase 3 builder call execution console|Selected-builder outcome/, 'Builders visible copy must not expose implementation labels in the primary UX.');
assert.match(app, /Outcome for selected builder/, 'Outcome capture should remain attached to the selected-builder concept in human copy.');

assert.match(phase, /--phase302-builders-rule: one-compact-route-header-market-ledger-workbench-first/, 'Phase 1 rule token must encode the page hierarchy decision.');
assert.match(phase, /section-heading\.compact-heading[\s\S]{0,180}padding-top: clamp\(18px, 2\.3vw, 30px\) !important/, 'Builders route header must be compressed so the workbench enters sooner.');
assert.match(phase, /\.builder-market-hero \{[\s\S]{0,80}display: none !important/, 'Duplicate market hero must be removed from Phase 1 top hierarchy.');
assert.match(phase, /\.builders-phase83-workbench\.builders-phase83-workbench[\s\S]{0,220}grid-template-columns: minmax\(0, 1fr\) !important/, 'Phase 1 top workbench must become one full-width market ledger, not stacked hero surfaces.');
assert.match(phase, /\.builder-phase1-spine[\s\S]{0,220}grid-template-columns: repeat\(4, minmax\(0, 1fr\)\) !important/, 'Page spine needs a real four-step desktop ledger layout.');
assert.match(phase, /\.builder-command-market-scroll[\s\S]{0,220}grid-template-columns: repeat\(auto-fit, minmax\(150px, 1fr\)\) !important/, 'Market rail must be readable as a ledger instead of clipped pill soup.');
assert.match(css, /v1\.103\.1 - Builders Phase 1 screenshot correction: full-width ledger and no top collision/, 'Phase 1 must include the screenshot correction layer.');
assert.match(css, /active-market-summary\.state-focus-summary \{[\s\S]{0,80}display: none !important/, 'Duplicate selected-state summary must stay out of the top hierarchy.');
assert.match(phase, /@media \(max-width: 680px\)[\s\S]{0,1000}\.builder-phase1-spine[\s\S]{0,120}repeat\(2, minmax\(0, 1fr\)\)/, 'Mobile page spine must wrap into readable two-column rows.');
assert.match(css, /@media \(max-width: 680px\)[\s\S]{0,420}main#app #builder-list-section \.builder-command-market-scroll[\s\S]{0,120}grid-template-columns: minmax\(0, 1fr\) !important/, 'Mobile market rail must be one-column to prevent overlapping long market names.');
assert.match(css, /main#app #builder-list-section \.builder-command-state-strip[\s\S]{0,160}grid-template-columns: repeat\(7, minmax\(0, 1fr\)\) !important/, 'Mobile state rail must wrap into a readable two-row grid instead of showing a horizontal scrollbar.');
assert.match(html, /phase302-builders-phase1-command-spine/, 'index.html must cache-bust the Builders Phase 1 command-spine update.');
assert.match(pkg.scripts.test, /phase302-builders-phase1-command-spine\.test\.mjs/, 'Full npm test must include the Phase 302 guard.');

console.log('phase302 Builders Phase 1 command spine guard passed');
