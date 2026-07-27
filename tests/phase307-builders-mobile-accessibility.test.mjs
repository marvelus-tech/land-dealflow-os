import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const phaseStart = css.indexOf('v1.99.14 - Phase 6 Builders mobile field interface');
assert.ok(phaseStart > -1, 'Phase 6 CSS marker must be present.');
const phase = css.slice(phaseStart);

assert.match(phase, /--phase6-builders-mobile-field-interface: single-column-queue-accessible-drawer/, 'Phase 6 CSS contract token must be present.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]*\.validation-grid-main[\s\S]*grid-template-columns:\s*minmax\(0,1fr\)/, 'Mobile Builders grid must collapse to one column.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]*\.builder-queue-results[\s\S]*grid-template-columns:\s*minmax\(0,1fr\)/, 'Mobile queue results must stay single-column.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]*\.validation-focus-card\.builder-inspector-v3[\s\S]{0,420}position:\s*sticky[\s\S]{0,220}bottom:\s*8px/, 'Selected builder inspector must become a clean thumb-accessible mobile drawer.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]*\.inspector-outcomes[\s\S]{0,420}position:\s*sticky[\s\S]{0,220}bottom:\s*0/, 'Outcome actions must remain thumb-accessible inside the mobile drawer.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]*:where\(button, a, input, select, textarea, summary\)[\s\S]{0,260}min-height:\s*44px/, 'Mobile interactive controls must preserve 44px tap targets.');
assert.match(phase, /focus-visible[\s\S]{0,220}outline:\s*3px solid/, 'Builders route must expose clear focus-visible states.');
assert.match(phase, /overflow-x:\s*clip|overflow-x:\s*hidden/, 'Phase 6 must explicitly guard horizontal clipping/overflow on mobile.');
assert.match(phase, /\.validation-call-button\.disabled[\s\S]{0,220}pointer-events:\s*none/, 'Disabled contact actions must not behave like hidden broken controls.');

assert.match(app, /aria-label="Selected builder inspector"/, 'Selected inspector must remain named in the accessibility tree.');
assert.match(app, /aria-label="Status outcomes for selected builder"/, 'Outcome actions must remain exposed to accessibility tree.');
assert.match(app, /aria-label="Contact actions"/, 'Contact action group must remain exposed to accessibility tree.');
assert.match(app, /aria-label="Builder queue controls"/, 'Queue controls must remain exposed to accessibility tree.');
assert.match(app, /aria-live="polite"/, 'Save/copy status outputs must remain polite live regions.');
assert.match(html, /phase6-builders-mobile-a11y[\s\S]*phase6-builders-mobile-a11y/, 'index.html must cache-bust Phase 6 mobile/accessibility assets.');

console.log('phase307 Builders mobile accessibility guard passed');
