import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(app, /phase295-tax-deed-mission-control/, 'Tax-Deed route must carry the Phase 295 mission-control marker.');
assert.match(app, /Tax deed mission control\./, 'Tax-Deed hero must be reframed as mission control, not a generic command table.');
assert.match(app, /validate demand, verify owner runway, clear legal\/risk gates/, 'Hero copy must state the operating sequence.');
assert.match(app, /<li><span>01<\/span>Buyer proof<\/li>/, 'Mission sequence must make buyer proof step one.');
assert.match(app, /<li><span>03<\/span>Risk clear<\/li>/, 'Mission sequence must expose risk clearance before outreach.');
assert.match(app, /0<\/b><span>fabricated fields/, 'Telemetry strip must encode zero-fabrication.');
assert.match(app, /prior bids · call validation/, 'Buyer lane tab must explain the operator job.');
assert.match(app, /PA runway · [^`]*skip-trace hold/, 'Owner lane tab must show skip-trace posture while allowing acreage-count telemetry.');
assert.match(app, /class="agent-proof-cell tax-deed-evidence-cell"/, 'Buyer long proof notes must move into a controlled evidence cell.');
assert.match(app, /<details class="tax-proof-detail"><summary>Evidence note<\/summary>/, 'Buyer evidence detail must be progressive disclosure.');
assert.match(app, /<details class="tax-proof-detail"><summary>Risk proof<\/summary>/, 'Owner risk proof must be progressive disclosure.');
assert.match(app, /Tax-claim \+ vacant\/no-building candidate ≠ clean scheduled sale/, 'PA owner panel must use direct risk-aware caution language.');

assert.match(css, /--phase295-tax-deed-mission-control: spacex-telemetry-risk-gated-owner-buyer-workspace/, 'CSS must include Phase 295 marker.');
assert.match(css, /body\[data-active-view="tax-deed"\] \.tax-deed-mission-hero/, 'Mission hero styling must be route-scoped to Tax-Deed.');
assert.match(css, /repeating-linear-gradient\(90deg/, 'Mission hero must include subtle telemetry grid language.');
assert.match(css, /\.tax-deed-countdown ol/, 'Operating sequence must be styled as a concise countdown.');
assert.match(css, /\.tax-proof-detail\[open\] small/, 'Progressive proof disclosure must expand cleanly.');
assert.match(css, /body\[data-active-view="tax-deed"\] \.agent-airtable \{[\s\S]{0,120}table-layout: fixed/, 'Tax-Deed tables must be scan-stabilized.');
assert.match(css, /-webkit-line-clamp: 2/, 'Long table notes must be clamped by default.');

assert.match(html, /Mission-control view for auction buyer proof/, 'Static Tax-Deed shell copy must match the mission-control pass.');
assert.match(html, /phase295-tax-deed-mission-control/, 'Live HTML must cache-bust the Phase 295 Tax-Deed update.');
assert.match(pkg.scripts.test, /phase295-tax-deed-mission-control\.test\.mjs/, 'Full npm test must include the Phase 295 guard.');

console.log('phase295 tax deed mission-control UX guard passed');
