import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = readFileSync(new URL('../package.json', import.meta.url), 'utf8');

const marker = 'Phase 267 W+K Phase 5 Closing trust ledger';
assert.ok(css.includes(marker), 'Phase 267 Closing marker must exist.');
const phase = css.slice(css.indexOf(marker));

assert.match(html, /styles\.css\?v=phase244-phase263-phase264-phase265-phase266-phase267-phase268-phase269-phase270-route-hero-system/, 'index.html must cache-bust Phase 267 Closing CSS while preserving prior phase markers.');
assert.match(pkg, /phase267-closing-trust-ledger\.test\.mjs/, 'npm test must include Phase 267 guard.');
assert.match(phase, /--phase267-rule-token: one-clean-close-path/, 'Closing phase token must encode the single close path rule.');
assert.match(phase, /#contract-composer\.contract-composer-panel[\s\S]{0,420}border-top: 1px solid var\(--phase267-line-strong\) !important[\s\S]{0,280}background: transparent !important/, 'Contract composer must become an open trust ledger, not a card slab.');
assert.match(phase, /#contract-composer \.legal-packet-hero[\s\S]{0,420}grid-template-columns: minmax\(250px, \.36fr\) minmax\(0, \.42fr\) auto !important/, 'Legal packet hero must become compact command copy plus actions.');
assert.match(phase, /\.closing-os-disclosure\.closing-intelligence-deck[\s\S]{0,360}border-top: 1px solid var\(--phase267-line-strong\) !important[\s\S]{0,260}background: transparent !important/, 'Reference operating-system deck must be demoted into a disclosure ledger.');
assert.match(phase, /\.closing-layout[\s\S]{0,320}grid-template-columns: minmax\(250px, \.31fr\) minmax\(0, \.69fr\) !important/, 'Closing files and title desk must become a queue/detail workbench.');
assert.match(phase, /\.closing-desk \.closing-hero[\s\S]{0,520}background: transparent !important[\s\S]{0,220}grid-template-columns: minmax\(0, \.58fr\) minmax\(260px, \.42fr\) !important/, 'Title desk hero must be flattened into trust memo plus next action.');
assert.match(phase, /\.closing-metric-strip article[\s\S]{0,360}border-radius: 0 !important[\s\S]{0,180}background: transparent !important/, 'HUD metrics must read as hairline facts, not tiles.');
assert.match(phase, /@media \(max-width: 900px\)[\s\S]{0,720}\.closing-layout,[\s\S]{0,420}grid-template-columns: minmax\(0, 1fr\) !important/, 'Mobile hard lock must force Closing command surfaces into one column.');
assert.match(css, /v1\.102\.1 - Phase 267 screenshot correction: compact packet command and title memo scale/, 'Phase 267 screenshot correction marker must exist.');
assert.match(css, /#contract-composer \.legal-packet-hero > h2[\s\S]{0,180}grid-column: 2 \/ 3 !important[\s\S]{0,180}font-size: clamp\(32px, 4\.1vw, 58px\) !important/, 'Closing packet command heading must be explicitly compacted after screenshot QA.');
assert.match(css, /\.closing-desk \.closing-hero-copy h2[\s\S]{0,180}font-size: clamp\(34px, 4\.1vw, 56px\) !important/, 'Title memo heading must be scaled down after screenshot QA.');

console.log('phase267 Closing trust ledger guard passed');
