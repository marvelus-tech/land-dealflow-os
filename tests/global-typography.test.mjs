import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

assert.match(css, /fonts\.googleapis\.com\/css2\?family=DM\+Mono[\s\S]*family=Space\+Grotesk/, 'Grotesk + DM Mono webfont import should lead the CSS');
assert.match(css, /v1\.44 - Phase 13 Apple-grade Grotesk\/DM Mono typography system/, 'Phase 13 global typography system marker required');
assert.match(css, /v1\.44\.1 - Phase 13 light-base typography bleed cleanup/, 'Phase 13 light-base cleanup should remove dark-mode bleed across routed pages');
assert.match(css, /v1\.44\.2 - Phase 13 nav typography specificity fix/, 'Phase 13 nav typography fix should prevent dark button leakage into tabs');
assert.match(css, /--font-grotesk: 'Space Grotesk', 'Grotesk'/, 'Grotesk token should use Space Grotesk with Grotesk fallback');
assert.match(css, /--font-mono: 'DM Mono'/, 'Mono token should use DM Mono');
assert.match(css, /body, button, input, textarea, select[\s\S]{0,110}font-family: var\(--font-grotesk\) !important/, 'Core UI controls should inherit the Grotesk system');
assert.match(css, /\.eyebrow,[\s\S]{0,460}font-family: var\(--font-mono\) !important/, 'Labels, badges, and microcopy should use DM Mono');
assert.match(css, /:is\(h1,h2,h3,h4\)[\s\S]{0,760}letter-spacing: -\.055em !important/, 'Headings should have unified tight Grotesk hierarchy');
assert.match(css, /--type-accent: #23d7c3/, 'Light-mode translation should retain the image-inspired cyan accent');
assert.match(css, /@media print[\s\S]{0,420}font-family: var\(--font-grotesk\) !important/, 'Print/PDF surfaces should be pulled into the same type system');
assert.match(css, /#operator-session-mode\.os8-session[\s\S]{0,520}linear-gradient\(135deg, rgba\(255,255,255,\.96\)/, 'Today operator session should be converted from dark panel to light base');
assert.match(css, /#sources-hub \.section-heading[\s\S]{0,420}linear-gradient\(135deg, rgba\(255,255,255,\.98\)/, 'Sources heading should use light base instead of legacy dark hero');

console.log('global typography tests passed');
