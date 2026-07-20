import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

assert.match(css, /v1\.99\.9 - Phase 5 visual simplification pass: quiet shell, open ledgers, no admin chrome/, 'Phase 5 CSS marker must be present');
assert.match(css, /--phase278-visual-simplification: quiet-shell-open-ledger-system/, 'Phase 5 token must encode the visual simplification contract');
assert.match(css, /\[hidden\],[\s\S]{0,160}\.app-panel\[hidden\],[\s\S]{0,160}display: none !important/, 'Route isolation hidden guard must survive final visual layer');
assert.match(css, /\.app-tabs[\s\S]{0,260}grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/, 'Desktop nav must be a no-clip six-route grid');
assert.match(css, /@media \(max-width: 760px\)[\s\S]{0,700}\.app-tabs[\s\S]{0,220}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, 'Mobile nav must use a compact two-row grid instead of a pill rail');
assert.match(css, /\.tab-button,[\s\S]{0,280}border-radius: 0 !important[\s\S]{0,220}box-shadow: none !important/, 'Nav tabs must not keep pill or shadow chrome');
assert.match(css, /\.card,[\s\S]{0,500}\.phase277-secondary-systems-drawer,[\s\S]{0,260}border-radius: 0 !important[\s\S]{0,180}box-shadow: none !important/, 'Major content surfaces must be flattened into open ledgers');
assert.match(css, /body::before[\s\S]{0,80}display: none !important/, 'Decorative page wash overlay must be disabled');
assert.match(css, /@media \(max-width: 760px\)[\s\S]{0,900}\.brand[\s\S]{0,80}display: none !important/, 'Mobile nav should spend vertical space on route access, not the brand mark');
assert.match(css, /v1\.99\.9\.1 - Phase 5 QA correction: high-specificity quiet shell locks/, 'Phase 5 QA correction shell-lock marker must be present');
assert.match(css, /html body header\.nav,[\s\S]{0,260}border-radius: 0 !important[\s\S]{0,160}box-shadow: none !important/, 'High-specificity nav shell lock must beat legacy pill rail rules');
assert.match(css, /html body header\.nav \.app-tabs,[\s\S]{0,420}grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)[\s\S]{0,260}border-radius: 0 !important/, 'High-specificity app tab grid must beat legacy app-tabs rails');
assert.match(html, /data-phase278-header-lock/, 'Header must carry direct Phase 5 shell lock for screenshot/runtime cache safety');
assert.match(html, /data-phase278-tabs-lock/, 'Tabs must carry direct Phase 5 shell lock for screenshot/runtime cache safety');
assert.match(html, /data-phase278-inline-shell/, 'index.html must include final inline shell lock for cached historical nav CSS');
assert.match(html, /grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/, 'Inline mobile nav lock must preserve the two-row route grid');
assert.match(html, /phase278-visual-simplification/, 'index.html must cache-bust Phase 5 visual simplification');

console.log('phase278 visual simplification guard passed');
