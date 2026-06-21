import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const app = readFileSync('src/app.mjs', 'utf8');

assert.match(css, /v1\.66 - Phase 43 visual-system cleanup/, 'Phase 43 visual-system cleanup marker missing.');
assert.match(css, /--phase43-visual-system: quiet-apple-grade-cleanup/, 'Phase 43 system token missing.');
assert.match(css, /body \{[\s\S]*background: linear-gradient\(180deg, var\(--system-page\)/, 'Active body background must be a quiet single wash.');
assert.match(css, /\.app-panel\[hidden\][\s\S]*display: none !important/, 'Route hidden guard must be present.');
assert.match(css, /\.app-tabs \{[\s\S]*background: transparent !important/, 'Primary nav tabs must not sit inside a boxed rail.');
assert.match(css, /\.tab-button\.active \{[\s\S]*border-bottom-color: var\(--system-green\)/, 'Active route state must be a calm underline.');
assert.match(css, /\.map-glow,[\s\S]*display: none !important/, 'Decorative map glow must be suppressed by the cleanup layer.');
assert.match(css, /\.brand-hero,[\s\S]*\.section-hero \{[\s\S]*background: transparent !important/, 'Hero surfaces must not keep old radial/gradient cards active.');
assert.match(css, /button,[\s\S]*background-image: none !important/, 'Buttons must not inherit legacy gradient chrome.');
assert.match(css, /\.card,[\s\S]*\.next-action-card \{[\s\S]*box-shadow: none !important/, 'Common cards must use the quiet shadowless system.');
assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.brand,[\s\S]*\.nav-cta \{[\s\S]*display: none !important/, 'Mobile nav must yield chrome to route tabs.');
assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.app-tabs \{[\s\S]*justify-content: space-between !important/, 'Mobile route tabs must remain visible and evenly spaced.');
assert.match(css, /v1\.66\.1 - Phase 43 mobile nav and meta correction/, 'Phase 43 mobile nav correction marker missing.');
assert.match(css, /body \.nav \{[\s\S]*background: transparent !important[\s\S]*border: 0 !important/, 'Top nav container chrome must be removed by the cleanup layer.');
assert.match(css, /body \.app-tabs \{[\s\S]*border: 0 !important[\s\S]*background: transparent !important/, 'Route tabs must not render as a boxed admin rail.');
assert.match(css, /v1\.66\.2 - Phase 43 remove inherited nav pill geometry/, 'Phase 43 nav geometry correction marker missing.');
assert.match(css, /html body \.nav \{[\s\S]*max-width: none !important[\s\S]*margin: 0 !important[\s\S]*border-radius: 0 !important/, 'Inherited nav pill geometry must be removed.');
assert.match(css, /v1\.66\.3 - Phase 43 mobile route tabs must not clip/, 'Phase 43 mobile tab clipping correction marker missing.');
assert.match(css, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\) !important/, 'Mobile route tabs must use a six-column no-clip grid.');
assert.match(css, /body\[data-active-view="builders"\] \.market-toggle b,[\s\S]*color: #66736c !important/, 'Builder market count labels must be quieted.');
assert.match(css, /v1\.66\.4 - Phase 43 kill residual route rail outline/, 'Phase 43 residual rail outline killer marker missing.');
assert.match(css, /html body nav\.nav \.app-tabs,[\s\S]*border-style: none !important[\s\S]*background-color: transparent !important/, 'Residual route tab rail border/background must be killed.');
assert.match(css, /builder-state-progress strong,[\s\S]*color: #5f6a63 !important/, 'Gold micro-meta labels must be quieted.');

assert.match(app, /<div class="map-glow"><\/div>/, 'Guard assumes existing map glow markup is suppressed at system layer.');
assert.doesNotMatch(css.slice(css.lastIndexOf('v1.66 - Phase 43 visual-system cleanup')), /radial-gradient/, 'Phase 43 cleanup layer must not introduce new radial glow effects.');

console.log('visual system cleanup guard passed');
