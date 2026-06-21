import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

assert.match(app, /phase40-closing-packet-ledger/, 'Closing composer must carry the Phase 40 legal packet ledger marker.');
assert.match(app, /Legal packet workflow/, 'Closing hero should frame the work as a legal packet workflow.');
assert.match(app, /Control\. Assign\. Close\./, 'Closing headline should expose the three-step packet path.');
assert.match(app, /closing-timeline-ledger/, 'Packet steps should render as a timeline ledger.');
assert.match(app, /closing-ledger-row/, 'Closing steps should be simple ledger rows, not document cards.');
assert.match(app, /quiet-status-chip/, 'Closing status should use quiet inline chips.');
assert.match(app, /closing-os-disclosure/, 'Operating system explanation should be collapsed into a disclosure.');
assert.match(app, /class="title-packet-experience \$\{titlePacketReady \? 'ready' : 'secondary'\}"/, 'Title packet bundle must be secondary until prerequisites are met.');
assert.doesNotMatch(app, /<button type="button" id="load-selected-contract-deal">Load selected deal<\/button><button type="button" class="secondary" id="save-contract-packet">Save draft<\/button><button type="button" class="secondary" id="print-contract-packet"/, 'Closing hero must not show three primary-looking packet buttons.');
assert.doesNotMatch(app, /<div class="title-packet-actions"><button type="button" id="export-contract-packet">Export title packet Markdown<\/button><button type="button" data-print-contract-packet="title" class="secondary">Print title packet<\/button><button type="button" data-contract-status="title-opened" class="secondary">Mark title opened<\/button><\/div>/, 'Title packet actions must not render as three loud buttons.');

assert.match(css, /v1\.64 - Phase 40 Closing legal packet ledger/, 'Phase 40 CSS marker required.');
assert.match(css, /--phase40-closing-rule: legal-packet-ledger-no-document-dashboard/, 'Route-scoped Closing design rule required.');
assert.match(css, /body\[data-active-view="closing"\] \.closing-timeline-ledger[\s\S]{0,180}grid-template-columns: 1fr !important/, 'Closing timeline ledger must be one-column and glanceable.');
assert.match(css, /body\[data-active-view="closing"\] \.closing-os-disclosure:not\(\[open\]\)/, 'Closed OS disclosure must hide procedural bulk.');
assert.match(css, /body\[data-active-view="closing"\] \.legal-packet-actions button:first-child/, 'Closing should promote one primary action.');
assert.match(css, /body\[data-active-view="closing"\] \.text-action/, 'Secondary actions should be text actions, not slabs.');

console.log('closing legal packet ledger guard passed');
