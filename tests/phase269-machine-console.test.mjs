import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');

const marker = 'Phase 269 W+K Phase 7 Machine console';
assert.ok(css.includes(marker), 'Phase 269 Machine marker must exist.');
const phase = css.slice(css.indexOf(marker));

assert.match(html, /styles\.css\?v=phase244-phase263-phase264-phase265-phase266-phase267-phase268-phase269-machine-console/, 'index.html must cache-bust Phase 269 Machine CSS while preserving prior phase markers.');
assert.match(pkg, /phase269-machine-console\.test\.mjs/, 'npm test must include Phase 269 guard.');
assert.match(app, /section-heading compact-heading machine-heading phase269-machine-console/, 'Machine heading must carry the Phase 269 console class.');
assert.match(app, /machine-command-ledger/, 'Machine route must render the command ledger before admin gates.');
assert.match(app, /No fabricated contacts\. No seller promotion before buyer proof/, 'Machine copy must preserve buyer-first zero-fabrication guardrails.');
assert.match(phase, /--phase269-machine-rule-token: quiet-machine-gates-not-admin-wall/, 'Machine phase token must encode quiet gate rule.');
assert.match(phase, /\.machine-command-ledger[\s\S]{0,260}grid-template-columns: minmax\(280px, \.34fr\) minmax\(0, \.66fr\) !important/, 'Machine command ledger must be the first operational surface.');
assert.match(phase, /\.machine-fact-ledger[\s\S]{0,220}grid-template-columns: repeat\(4, minmax\(0, 1fr\)\) !important/, 'Machine facts must render as a compact four-column ledger.');
assert.match(phase, /\.machine-stack\.phase269-machine-stack[\s\S]{0,180}border-top: 1px solid rgba\(16, 21, 19, \.24\) !important/, 'Machine stack must be an open hairline gate ledger.');
assert.match(phase, /\.machine-panel > summary[\s\S]{0,260}grid-template-columns: 52px minmax\(0, 1fr\) minmax\(180px, auto\) 24px !important/, 'Machine panel summaries must be readable ledger rows on desktop.');
assert.match(phase, /@media \(max-width: 980px\)[\s\S]{0,760}\.machine-panel > summary[\s\S]{0,150}grid-template-columns: 42px minmax\(0, 1fr\) 20px !important/, 'Machine panel rows must become mobile-safe three-column rows.');

console.log('phase269 Machine console guard passed');
