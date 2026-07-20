import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

assert.match(app, /function renderPhase4SecondaryProofDock\(/, 'Phase 4 must define a secondary proof/research dock');
assert.match(app, /phase277-secondary-proof-dock[\s\S]{0,700}Research is parked\. Execution stays primary\./, 'Phase 4 dock must state that research is parked and execution remains primary');
assert.match(app, /function renderLandSupportDrawer[\s\S]{0,900}renderSelectedMarketPropertyResearch\(\)[\s\S]{0,900}renderNorthCarolinaWakeProofPackets\(\)[\s\S]{0,900}renderStateLandReports\(\)/, 'Research, ZIP proof packets, and state reports must render from the secondary support drawer');
assert.doesNotMatch(app, /active-market-summary[\s\S]{0,1800}renderSelectedMarketPropertyResearch\(\)/, 'Selected market primary brief must not render property research directly');
assert.doesNotMatch(app, /active-market-summary[\s\S]{0,1800}renderNorthCarolinaWakeProofPackets\(\)/, 'Selected market primary brief must not render NC proof packets directly');
assert.doesNotMatch(app, /land-market-index[\s\S]{0,1600}\$\{stateReports\}/, 'Land market index primary lane must not inline deep state reports');
assert.match(app, /phase277-secondary-systems-drawer/, 'Support drawer must carry the Phase 4 secondary-system marker');

assert.match(css, /v1\.99\.8 - Phase 4 parks research\/proof\/deep systems below the primary Land flow/, 'Phase 4 CSS marker must be present');
assert.match(css, /--phase277-secondary-systems: research-proof-depth-parked-below-primary-flow/, 'Phase 4 CSS must encode the secondary-system contract');
assert.match(css, /\.phase277-secondary-proof-module:not\(\[open\]\) > :not\(summary\)[\s\S]{0,120}display: none/, 'Secondary proof modules must stay collapsed outside primary flow');
assert.match(html, /phase277-secondary-systems/, 'index.html must cache-bust Phase 4 secondary system changes');

console.log('phase277 secondary research/proof systems guard passed');
