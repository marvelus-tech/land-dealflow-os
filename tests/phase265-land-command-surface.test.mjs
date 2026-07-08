import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');

const marker = 'Phase 265 W+K Phase 3 Land';
assert.ok(css.includes(marker), 'Phase 265 Land command marker must exist.');
const phase = css.slice(css.indexOf(marker));

assert.match(html, /styles\.css\?v=phase244-phase263-phase264-phase265-phase266-today-command/, 'index.html must cache-bust Phase 266 Today command CSS while preserving previous phase markers.');
assert.match(phase, /body\[data-active-view="deals"\] #parcels \.land-market-index[\s\S]{0,420}border-radius: 0 !important[\s\S]{0,220}box-shadow: none !important/, 'Land index must become a flat operating ledger, not a card cloud.');
assert.match(phase, /land-market-index-hero[\s\S]{0,520}grid-template-columns: minmax\(0, 1fr\) minmax\(260px, 36%\) !important/, 'Land index hero must be a concise memo plus stats rail.');
assert.match(phase, /land-market-index-grid[\s\S]{0,180}display: block !important/, 'State and lane cards must collapse into a scan ledger.');
assert.match(phase, /land-market-index-card,[\s\S]{0,980}grid-template-columns: 70px minmax\(0, 1fr\) minmax\(260px, \.4fr\) minmax\(180px, \.22fr\) !important/, 'Desktop Land rows must have state/code, thesis, metrics, posture columns.');
assert.match(phase, /body\[data-active-view="deals"\] #parcels \.deal-workbench[\s\S]{0,280}grid-template-columns: minmax\(300px, \.36fr\) minmax\(0, 1fr\) !important/, 'Selected Land lane must become queue plus inspector workbench.');
assert.match(phase, /land-ledger-queue[\s\S]{0,360}position: sticky !important[\s\S]{0,180}max-height: calc\(100vh - 110px\) !important/, 'Land queue must stay visible as a sticky proof rail on desktop.');
assert.match(phase, /land-row-signals,[\s\S]{0,220}visual-checklist\.compact,[\s\S]{0,220}land-activity-row[\s\S]{0,140}display: none !important/, 'Queue rows must hide secondary badges/checklists/activity noise in Phase 3.');
assert.match(app, /const queueLimit = 80;/, 'Land queue must window large lanes for browser performance.');
assert.match(app, /phase265-windowed-queue/, 'Land queue must mark the Phase 265 windowed queue.');
assert.match(app, /Showing top \$\{h\(queueRows\.length\)\} of \$\{h\(visible\.length\)\}/, 'Windowed queue must disclose full count rather than hiding records silently.');
assert.match(phase, /land-market-command-scroll[\s\S]{0,620}display: flex !important[\s\S]{0,420}overflow-x: auto !important/, 'Selected lane market switcher must be a compact horizontal rail.');
assert.match(phase, /land-command-market\.deals-market-card[\s\S]{0,820}flex: 0 0 clamp\(190px, 22vw, 260px\) !important[\s\S]{0,360}min-height: 58px !important/, 'Selected lane market cards must be compact pills, not tall card residue.');
assert.match(phase, /@media \(max-width: 980px\)[\s\S]{0,1300}land-ledger-queue[\s\S]{0,180}position: static !important[\s\S]{0,140}max-height: 430px !important/, 'Mobile Land queue must not be sticky and must be capped.');

console.log('phase265 Land command surface guard passed');
