import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');

assert.match(html, /styles\.css\?v=phase244-phase263-phase264-phase265-phase266-phase267-phase268-phase269-phase270-phase271-orientation-spine-v3/, 'Phase 271 cache-buster must be linked from index.html.');
assert.match(css, /--phase271-orientation-token: global-route-spine-entry-compression/, 'Phase 271 must expose the global orientation-spine token.');
assert.match(css, /Phase 271 W\+K Phase 9 global orientation spine/, 'Phase 271 CSS marker must describe the Phase 9 scope.');
assert.match(css, /header\.nav::after[\s\S]{0,180}Buyer proof before seller motion/, 'Desktop nav must carry the buyer-before-seller orientation line.');
assert.match(css, /header\.nav \.tab-button\[aria-current="page"\][\s\S]{0,220}font-weight: 820 !important/, 'Active route state must be stronger than inactive route tabs.');
assert.match(css, /body:not\(\[data-active-view="today"\]\) main#app[\s\S]{0,420}margin-top: clamp\(16px, 3\.2vw, 38px\) !important/, 'Work-route entry should be compressed after Phase 8 hero unification.');
assert.match(css, /Phase 271 screenshot correction: tighter desktop entry and contained nav spine/, 'Phase 271 must include the screenshot correction for desktop entry compression.');
assert.match(css, /header\.nav \{[\s\S]{0,90}width: min\(1120px, calc\(100vw - 56px\)\) !important/, 'Desktop nav spine must be contained instead of stretching to the full viewport.');
assert.match(css, /padding-top: clamp\(12px, 2\.4vw, 30px\) !important/, 'Work-route panels must enter faster after Phase 271 correction.');
assert.match(css, /margin-top: clamp\(8px, 1\.8vw, 22px\) !important/, 'Work-route route headers must reduce the remaining top gap.');
assert.match(css, /@media \(max-width: 760px\)[\s\S]{0,520}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/, 'Mobile nav must render as a stable two-row three-column route grid.');
assert.match(css, /Phase 271 screenshot correction: remove remaining Land index box seam/, 'Phase 271 must remove the remaining Land index box seam discovered in screenshot QA.');
assert.match(css, /Phase 271 specificity correction: contain route-specific sticky nav rails/, 'Phase 271 must include the nav specificity correction discovered in browser QA.');
assert.match(css, /body\[data-active-view\] header\.nav \{[\s\S]{0,180}max-width: min\(1120px, calc\(100vw - 56px\)\) !important/, 'Route-specific sticky nav rails must stay contained after legacy body selectors.');
assert.match(css, /Phase 271 final nav containment: beat legacy html body > header\.nav\.nav width reset/, 'Phase 271 must include the final high-specificity nav containment correction.');
assert.match(css, /html body\[data-active-view\] > header\.nav\.nav \{[\s\S]{0,180}width: min\(1120px, calc\(100vw - 56px\)\) !important/, 'Final nav containment must beat html body > header.nav.nav legacy width reset.');
assert.match(css, /#parcels-section #parcels \.land-market-index \{[\s\S]{0,180}border: 0 !important/, 'Land market index shell must not keep the old framed-box border.');
assert.match(css, /#parcels-section #parcels \.land-market-index-stats \{[\s\S]{0,120}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/, 'Land demoted stat ledger must be three compact desktop columns.');
assert.match(app, /button\.setAttribute\('aria-current', 'page'\)/, 'Active nav button must receive aria-current=page.');
assert.match(app, /button\.removeAttribute\('aria-current'\)/, 'Inactive nav buttons must remove aria-current.');

console.log('phase271 orientation spine guard passed');
