import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = readFileSync(new URL('../package.json', import.meta.url), 'utf8');

const marker = 'Phase 270 W+K Phase 8 route hero system';
assert.ok(css.includes(marker), 'Phase 270 route hero marker must exist.');
const phase = css.slice(css.indexOf(marker));

assert.match(html, /styles\.css\?v=phase244-phase263-phase264-phase265-phase266-phase267-phase268-phase269-phase270-route-hero-system/, 'index.html must cache-bust Phase 270 while preserving prior phase markers.');
assert.match(pkg, /phase270-route-hero-system\.test\.mjs/, 'npm test must include Phase 270 guard.');
assert.match(phase, /--phase270-route-hero-token: sources-mode-work-route-headers/, 'Phase 270 must expose the Sources-mode route header token.');
assert.match(phase, /body:not\(\[data-active-view="today"\]\) main#app > :where\(#parcels-section, #builder-list-section, #closing-section, #sources-hub, #workspace\)\.app-panel > \.section-heading\.compact-heading/, 'Phase 270 must scope shared headers to non-Today work routes.');
assert.match(phase, /> \.section-heading\.compact-heading > \.eyebrow[\s\S]{0,520}grid-column: 1 \/ 2 !important;[\s\S]{0,120}grid-row: 1 !important/, 'Eyebrows must sit above titles in column one.');
assert.match(phase, /> \.section-heading\.compact-heading > h2[\s\S]{0,520}grid-column: 1 \/ 2 !important;[\s\S]{0,120}grid-row: 2 !important/, 'Route titles must own column one row two.');
assert.match(phase, /> \.section-heading\.compact-heading > p[\s\S]{0,520}grid-column: 2 \/ 3 !important;[\s\S]{0,120}grid-row: 2 !important/, 'Route support copy must sit in column two row two.');
assert.match(phase, /body\[data-active-view="today"\] #command \.wk-hero h1[\s\S]{0,180}font-size: clamp\(48px, 7\.6vw, 106px\) !important/, 'Today must be excluded from shared header system and only receive a reduced command-center headline.');
assert.match(phase, /#workspace\[hidden\][\s\S]{0,80}display: none !important/, 'Final route-isolation lock must keep hidden panels hidden after late route hero overrides.');
assert.match(phase, /@media \(max-width: 900px\)[\s\S]{0,760}> \.section-heading\.compact-heading > p[\s\S]{0,180}grid-row: 3 !important/, 'Mobile route headers must stack support copy below the title.');
assert.match(phase, /Phase 270 screenshot correction: suppress nested index heroes/, 'Phase 270 must include the screenshot correction that removes duplicate Land/Builders index heroes.');
assert.match(phase, /\.land-market-index-hero > :not\(\.land-market-index-stats\),[\s\S]{0,180}\.builders-index-hero > :not\(\.builders-index-stats\)[\s\S]{0,120}display: none !important/, 'Nested Land and Builders index hero copy must be suppressed after the shared route header.');
assert.match(phase, /Phase 270 screenshot correction: remove empty left gutter from demoted index stats/, 'Phase 270 must remove the empty left gutter created by hidden nested hero copy.');
assert.match(phase, /\.land-market-index-hero,[\s\S]{0,120}\.builders-index-hero \{[\s\S]{0,80}display: block !important/, 'Demoted Land and Builders index stat rails must be block-level, not split hero grids.');
assert.match(phase, /Phase 270 screenshot correction: beat legacy #parcels index-hero grid specificity/, 'Phase 270 must include the specificity correction for legacy Land/Builders index hero grids.');
assert.match(phase, /#parcels-section #parcels \.land-market-index-hero,[\s\S]{0,140}#builder-list-section #builder-list-panel \.builders-index-hero[\s\S]{0,160}grid-template-columns: none !important/, 'Specific Land/Builders nested index heroes must not retain split grid columns.');

console.log('phase270 route hero system guard passed');
