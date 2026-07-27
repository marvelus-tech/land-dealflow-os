import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(app, /class="buybox-capture-sheet phase4-buybox-capture" open/, 'Phase 4 buy-box capture sheet must have its own redesigned surface.');
assert.match(app, /renderBuyBoxMissingCommand\(selected\)/, 'Operator must see missing required fields before reading the full form.');
assert.match(app, /aria-label="Required validation fields"/, 'Form must split required validation fields.');
assert.match(app, /aria-label="Optional qualifiers"/, 'Form must split optional qualifiers.');
assert.match(app, /aria-label="Exact quote and notes"/, 'Form must split exact quote / notes.');
assert.match(app, /data-missing-buybox-field="\$\{h\(field\.key\)\}"/, 'Missing fields must render as explicit field chips.');
for (const label of ['Geography', 'Lot band', 'Max price', 'Speed/appetite', 'Recipient/contact', 'Killers']) {
  assert.ok(app.includes(label), `Missing/required field label ${label} must be visible.`);
}
assert.match(app, /class="validation-save-row sticky-save-row"/, 'Save action must stay close to the active required capture area.');
assert.match(app, /persistBuyerValidationFormDraft\(validationForm, \{ render: false, promote: false \}\)/, 'Input/change drafts must persist locally before explicit save.');
assert.match(app, /persistWorkspace\(\)/, 'Saved validation must persist to workspace storage.');

const phase = css.slice(css.indexOf('v1.105 - Builders Phase 4 buy-box capture redesign'));
assert.ok(phase.length > 100, 'Phase 4 CSS marker must exist.');
assert.match(phase, /\.buybox-required-command[\s\S]{0,180}grid-template-columns: minmax\(150px,\.42fr\) minmax\(0,1fr\)/, 'Completion and missing fields must sit in a visible command strip.');
assert.match(phase, /\.phase4-buybox-grid,\s*\nbody\[data-active-view="builders"\] #buyer-validation-command \.validation-form\.validation-buybox-grid\.phase4-buybox-grid[\s\S]{0,220}grid-template-columns: minmax\(0, 1fr\)/, 'Form must stay inside the active capture column without horizontal clipping.');
assert.match(phase, /\.sticky-save-row[\s\S]{0,120}position: sticky/, 'Save row must be sticky/nearby during capture.');
assert.match(phase, /\.phase4-buybox-grid input,[\s\S]{0,320}width: 100% !important;[\s\S]{0,120}min-width: 0 !important;/, 'Inputs must size to the capture area instead of clipping placeholder copy.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]{0,500}\.buybox-form-section \{ grid-template-columns: 1fr/, 'Mobile form must collapse to one usable column.');
assert.match(html, /phase4-buybox-capture-redesign/, 'index.html must cache-bust Phase 4.');
assert.match(pkg.scripts.test, /phase305-buybox-capture-redesign\.test\.mjs/, 'Full npm test must include the Phase 4 guard.');

console.log('phase305 Buy-box capture redesign guard passed');
