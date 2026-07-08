import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const phase = css.slice(css.indexOf('v1.98 - Phase 263 W+K Phase 1 global shell normalization'));

assert.ok(phase.length > 0, 'Phase 263 W+K global shell marker missing.');
assert.match(phase, /--phase263-shell-rule: wk-phase1-global-shell-navigation-rhythm-only/, 'Phase 1 shell rule token missing.');
assert.match(phase, /--phase263-canvas: #f7f5ee/, 'Phase 1 canvas token missing.');
assert.match(phase, /--phase263-forest: #0b5138/, 'Phase 1 forest token missing.');
assert.match(phase, /header\.nav,[\s\S]{0,180}html body > header\.nav\.nav[\s\S]{0,420}grid-template-columns: minmax\(122px, 1fr\) auto minmax\(122px, 1fr\) !important/, 'Desktop nav must be a calm centered product shell.');
assert.match(phase, /header\.nav \.app-tabs,[\s\S]{0,560}border-radius: 999px !important[\s\S]{0,240}overflow: visible !important/, 'Desktop route tabs must remain visible inside one quiet segmented rail.');
assert.match(phase, /header\.nav \.tab-button,[\s\S]{0,300}border-radius: 0 !important/, 'Route tab buttons must stay rectilinear inside the quiet rail.');
assert.match(phase, /body :where\(button, \.hero-actions a, \.nav-cta\) \{[\s\S]{0,80}border-radius: 0 !important/, 'Phase 1 must not reintroduce pill buttons globally.');
assert.match(phase, /main#app \{[\s\S]{0,260}max-width: var\(--phase263-max\) !important/, 'Main app width must be governed by the Phase 1 shell token.');
assert.match(phase, /section-heading\.compact-heading[\s\S]{0,420}grid-template-columns: minmax\(0, \.7fr\) minmax\(260px, \.3fr\) !important/, 'Route headings must share one two-column editorial rhythm.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]{0,760}grid-template-columns: repeat\(6, minmax\(0, 1fr\)\) !important/, 'Mobile nav must show all six workspaces without horizontal clipping.');
assert.match(phase, /prefers-reduced-motion: reduce/, 'Phase 1 must preserve reduced-motion support.');
assert.match(phase, /#app #workspace\[hidden\][\s\S]{0,80}display: none !important/, 'Final route isolation guard must include Machine workspace.');
assert.match(css, /v1\.98\.1 - Phase 263 self-review: no pseudo hero cards/, 'Phase 263 screenshot self-review marker missing.');
assert.match(css, /--phase263-self-review-rule: route-headers-are-open-memos-not-pseudo-card-heroes/, 'Route header pseudo-card self-review token missing.');
assert.match(css, /section-heading\.compact-heading::before,[\s\S]{0,260}section-heading\.compact-heading::after[\s\S]{0,180}content: none !important/, 'Route header pseudo cards must be killed after screenshot QA.');
assert.match(html, /styles\.css\?v=phase244-phase263-phase264-builders-command/, 'index.html must preserve Phase 263 compatibility while cache-busting the later Builders command CSS.');

console.log('phase263 W+K global shell guard passed');
