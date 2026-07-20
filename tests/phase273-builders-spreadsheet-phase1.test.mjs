import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

const marker = 'v1.99.3 - Builders Phase 1: spreadsheet-first contact ledger';
const start = css.indexOf(marker);
assert.ok(start > -1, 'Builders Phase 1 marker missing.');
const phase = css.slice(start);

assert.match(phase, /--phase273-builder-phase1: spreadsheet-contact-progress-notes/, 'Phase 1 must declare spreadsheet contact/progress/notes rule.');
assert.match(phase, /builder-market-hero,[\s\S]*seller-unlock-card,[\s\S]*builder-source-depth-drawer[\s\S]*display: none !important/, 'Phase 1 must remove hero, seller gate, and source-depth clutter from Builders route.');
assert.match(phase, /validation-grid-main[\s\S]{0,220}grid-template-columns: minmax\(420px, 1\.08fr\) minmax\(360px, \.92fr\) !important/, 'Builders Phase 1 must reduce the workbench to list/detail.');
assert.match(phase, /validation-queue-item[\s\S]{0,240}grid-template-columns: minmax\(0, 1fr\) 184px !important/, 'Builder rows must read like a compact contact ledger.');
assert.match(phase, /queue-state-row[\s\S]{0,180}grid-template-columns: repeat\(3, 28px\) minmax\(0, 1fr\) !important/, 'Rows must expose call/email/mail progress controls inline.');
assert.match(phase, /buybox-capture-sheet summary[\s\S]{0,220}grid-template-columns: minmax\(0,1fr\) auto !important/, 'Phase 1 must style progress and notes as the selected-record sheet.');
assert.match(app, /Phase 1 turns this into a spreadsheet-like list: contact, progress, notes, proof count\./, 'Builder queue copy must be spreadsheet-first.');
assert.match(app, /<details class="buybox-capture-sheet" open>/, 'Progress/notes sheet must be open by default.');
assert.match(app, /parcel-ready/, 'Builder status should say parcel-ready instead of seller gate unlock ceremony.');
assert.match(app, /if \(activeView === 'builders'\) \{[\s\S]{0,180}renderBuilderListEnginePanel\(\);[\s\S]{0,120}return;/, 'Builders route must render only the builder workspace instead of hydrating every hidden panel.');
assert.match(html, /orientation-spine-v3-builders-phase1/, 'index.html must cache-bust Builders Phase 1 CSS.');

console.log('phase273 Builders spreadsheet Phase 1 guard passed');
