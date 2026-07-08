import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');

const marker = 'Phase 268 W+K Phase 6 Sources operating map';
assert.ok(css.includes(marker), 'Phase 268 Sources marker must exist.');
const phase = css.slice(css.indexOf(marker));

assert.match(html, /styles\.css\?v=phase244-phase263-phase264-phase265-phase266-phase267-phase268-sources-operating-map/, 'index.html must cache-bust Phase 268 Sources CSS while preserving prior phase markers.');
assert.ok(html.indexOf('id="source-priority-board"') < html.indexOf('id="weekly-market-scout"'), 'Sources priority board must render before Market Radar scout.');
assert.match(pkg, /phase268-sources-operating-map\.test\.mjs/, 'npm test must include Phase 268 guard.');
assert.match(phase, /--phase268-sources-rule-token: source-priority-operating-map-first/, 'Sources phase token must encode source-priority-first rule.');
assert.match(phase, /#source-priority-board \.source-priority-head[\s\S]{0,360}grid-template-columns: minmax\(230px, \.34fr\) minmax\(0, \.36fr\) minmax\(270px, \.30fr\) !important/, 'Source priority head must become a compact command grid.');
assert.match(phase, /#source-priority-board \.source-stack-rail[\s\S]{0,300}grid-template-columns: repeat\(5, minmax\(0, 1fr\)\) !important/, 'Priority state order must be visible as a first-viewport five-lane rail.');
assert.match(phase, /#source-priority-board \.priority-stack-step:nth-child\(n\+6\) \{ display: none !important; \}/, 'Source rail must suppress lower-priority lane clutter in the first viewport.');
assert.match(phase, /#weekly-market-scout \.market-radar-placeholder \{ display: none !important; \}/, 'Placeholder radar poster must be hidden on Sources after the operating map is live.');
assert.match(phase, /#sources-hub #pipeline\.pipeline[\s\S]{0,220}grid-template-columns: repeat\(7, minmax\(0, 1fr\)\) !important/, 'Source pipeline must be a compact lower ledger, not a card wall.');
assert.match(phase, /@media \(max-width: 980px\)[\s\S]{0,1300}#source-priority-board \.source-stack-rail[\s\S]{0,140}grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/, 'Mobile Sources must keep the priority rail readable without horizontal overflow.');
assert.match(app, /target\.innerHTML = `\$\{marketRadarPlaceholderHtml\(\)\}<section class="weekly-market-card weekly-market-legacy">/, 'Weekly scout still preserves generated market detail after placeholder suppression.');
assert.match(css, /v1\.103\.1 - Phase 268 screenshot correction: full-width source ledgers, no crushed market names/, 'Phase 268 screenshot correction marker must exist.');
assert.match(css, /#source-priority-board \.priority-market[\s\S]{0,220}grid-template-columns: 48px minmax\(220px, \.30fr\) minmax\(0, 1fr\) !important/, 'Source market rows must use full-width ledger columns after screenshot QA.');
assert.match(css, /@media \(max-width: 980px\)[\s\S]{0,180}#source-priority-board \.priority-market[\s\S]{0,140}grid-template-columns: 42px minmax\(0, 1fr\) !important/, 'Mobile source market rows must not crush market names.');

console.log('phase268 Sources operating map guard passed');
