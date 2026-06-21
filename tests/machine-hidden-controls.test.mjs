import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

const renderStart = app.indexOf('function machineOpenAttr(');
const renderEnd = app.indexOf('function renderTopCallList()', renderStart);
const machineRender = app.slice(renderStart, renderEnd);

assert.ok(machineRender.includes('function machineOpenAttr'), 'Machine render must preserve one-open panel state');
assert.equal((machineRender.match(/class="machine-panel"/g) || []).length, 10, 'Machine must expose ten compact disclosure rows');
assert.equal((machineRender.match(/class="machine-panel"[^>]* open/g) || []).length, 0, 'Machine panels must not be hard-coded open by default');
assert.ok(machineRender.includes('data-machine-panel="buyer-contact"'), 'Buyer import must be a named tucked tool');
assert.ok(machineRender.includes('data-machine-panel="skip-trace"'), 'Skip-trace import must be a named tucked tool');
assert.ok(machineRender.includes('compact-import-module'), 'Large import forms must be compact modules');
assert.ok(machineRender.includes('<code>address,market,buyerMaxPrice,roadAccess</code>'), 'Parcel CSV example must be a small code preview');
assert.ok(machineRender.includes('rows="3"'), 'Machine import textareas must render compact by default');

const toggleStart = app.indexOf("document.addEventListener('toggle'");
const toggleEnd = app.indexOf("window.addEventListener('hashchange'", toggleStart);
const toggleBlock = app.slice(toggleStart, toggleEnd);
assert.ok(toggleBlock.includes("document.querySelectorAll('.machine-panel[open]')"), 'Opening one Machine tool must close sibling tools');
assert.ok(toggleBlock.includes("openMachinePanel = machinePanel.dataset.machinePanel"), 'Machine open state must track the active tool');

assert.ok(css.includes('Phase 42 - Machine controls tucked away'), 'Phase 42 Machine CSS must be present');
assert.ok(css.includes('body[data-active-view="machine"] #workspace #csv-input'), 'Machine textarea override must be route-scoped');
assert.ok(css.includes('max-height: 108px !important'), 'Machine textareas must be visually compact');

console.log('machine hidden-controls tests passed');
