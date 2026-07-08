import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = readFileSync(new URL('../package.json', import.meta.url), 'utf8');

const marker = 'Phase 266 W+K Phase 4 Today command center';
assert.ok(css.includes(marker), 'Phase 266 Today marker must exist.');
const phase = css.slice(css.indexOf(marker));

assert.match(html, /styles\.css\?v=phase244-phase263-phase264-phase265-phase266-phase267-phase268-phase269-phase270-route-hero-system/, 'index.html must cache-bust Phase 267 Closing trust CSS while preserving prior phase markers.');
assert.match(pkg, /phase266-today-command-center\.test\.mjs/, 'npm test must include Phase 266 guard.');
assert.match(phase, /--phase266-rule-token: today-is-one-defensible-action/, 'Today phase token must encode the one-action rule.');
assert.match(phase, /body\[data-active-view="today"\] #command \.wk-hero[\s\S]{0,620}grid-template-columns: minmax\(0, \.54fr\) minmax\(340px, \.46fr\) !important/, 'Today hero must become compact command + proof ledger split.');
assert.match(phase, /phase24-snapshot div[\s\S]{0,520}grid-template-columns: minmax\(120px, \.32fr\) minmax\(0, 1fr\) minmax\(92px, auto\) !important/, 'Today proof snapshot must scan as rows, not metric tiles.');
assert.match(phase, /#operator-session-mode\.os8-session[\s\S]{0,760}grid-template-columns: minmax\(280px, \.34fr\) minmax\(0, \.66fr\) !important/, 'Operator session must promote next action beside sprint ledger.');
assert.match(phase, /os8-step strong,[\s\S]{0,120}os8-step p \{ display: none !important; \}/, 'Sprint rows must hide verbose detail noise in Phase 4.');
assert.match(phase, /#today-offers-review\.today-offers-review[\s\S]{0,620}grid-template-columns: minmax\(260px, \.28fr\) minmax\(0, \.72fr\) !important/, 'Offer review must become side memo plus ledger.');
assert.match(css, /v1\.101\.2 - Phase 266 grid-area order correction: set explicit columns after area reset/, 'Phase 266 grid-area order correction marker must exist.');
assert.match(css, /#operator-session-mode \.os8-hero[\s\S]{0,140}grid-area: auto !important[\s\S]{0,120}grid-column: 1 \/ 2 !important/, 'Today next-action block must own the left session column after grid-area reset.');
assert.match(css, /#operator-session-mode \.os8-sprint-card[\s\S]{0,140}grid-area: auto !important[\s\S]{0,120}grid-column: 2 \/ 3 !important/, 'Today sprint card must own the right session column after grid-area reset.');
assert.match(phase, /@media \(max-width: 860px\)[\s\S]{0,900}#operator-session-mode\.os8-session,[\s\S]{0,420}grid-template-columns: minmax\(0, 1fr\) !important/, 'Mobile hard lock must force Today command surfaces into one column.');

console.log('phase266 Today command center guard passed');
