import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(app, /class="validation-focus-card builder-inspector-v3" id="selected-builder-card" aria-label="Selected builder inspector"/, 'Selected builder panel must be rebuilt as a named inspector.');
assert.match(app, /aria-label="Identity and market"/, 'Inspector must include Identity + market section.');
assert.match(app, /aria-label="Contact actions"/, 'Inspector must include contact actions section.');
assert.match(app, /class="builder-contact-action-rail"/, 'Call, Email, Draft, Website must live in a clean action rail.');
assert.match(app, /aria-label="Why ranked here"/, 'Inspector must explain why the builder is ranked here.');
assert.match(app, /aria-label="Proof summary"/, 'Inspector must include proof summary.');
assert.match(app, /aria-label="Missing buy-box fields"/, 'Inspector must include missing buy-box fields.');
assert.match(app, /aria-label="Next call prompt"/, 'First visible detail area must include next call prompt.');
assert.match(app, /aria-label="Buyer validation readiness stack"/, 'Inspector must show buyer-validation state as a readiness stack.');
assert.match(app, /aria-label="Status update for selected builder"/, 'Status/outcome controls must live inside the selected inspector.');
assert.match(app, /Status update applies to[\s\S]{0,120}\$\{h\(selected\.name \|\| 'selected builder'\)\}/, 'Status update copy must clearly apply to the selected builder.');
assert.match(app, /data-phase3-call-outcome="\$\{h\(outcome\.id\)\}" data-builder-id="\$\{h\(selected\.builderId \|\| ''\)\}"/, 'Outcome buttons must carry the selected builder id.');
assert.doesNotMatch(app, /phase3-builder-call-console[\s\S]{0,900}phase3-outcome-capture/, 'Outcome buttons must not remain in the top command banner.');

const phase = css.slice(css.indexOf('v1.104 - Builders Phase 3 selected inspector'));
assert.ok(phase.length > 100, 'Phase 3 CSS marker must exist.');
assert.match(phase, /\.validation-grid-main[\s\S]{0,160}grid-template-columns: minmax\(330px, \.78fr\) minmax\(0, 1\.18fr\) minmax\(230px, \.42fr\) !important/, 'Desktop inspector must fit beside queue with a right-side gate.');
assert.match(phase, /\.inspector-identity h3[\s\S]{0,180}font-size: clamp\(24px, 2\.1vw, 34px\) !important/, 'Selected builder name typography must be reduced.');
assert.match(phase, /\.builder-contact-action-rail[\s\S]{0,140}grid-template-columns: repeat\(4, minmax\(0, 1fr\)\) !important/, 'Contact rail must render four clean actions on desktop.');
assert.match(phase, /\.buyer-readiness-stack[\s\S]{0,140}grid-template-columns: repeat\(4, minmax\(0, 1fr\)\) !important/, 'Readiness stack must be compact.');
assert.match(phase, /@media \(max-width: 760px\)[\s\S]{0,700}\.builder-contact-action-rail[\s\S]{0,120}repeat\(2, minmax\(0, 1fr\)\)/, 'Mobile contact action rail must wrap without overflow.');

assert.match(html, /phase304-builders-selected-inspector/, 'index.html must cache-bust the Phase 3 selected-inspector update.');
assert.match(pkg.scripts.test, /phase304-builders-selected-inspector\.test\.mjs/, 'Full npm test must include the Phase 304 guard.');

console.log('phase304 Builders selected inspector guard passed');
