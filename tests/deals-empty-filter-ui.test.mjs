import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

assert.match(app, /phase38-deals-empty/, 'Deals empty state must use the Phase 38 compact component.');
assert.match(app, /This lane is intentionally quiet\./, 'Deals empty state must explain intentional emptiness quickly.');
assert.match(app, /Why empty:/, 'Deals empty state must include a small why-empty explanation.');
assert.match(app, /Validate one buyer first/, 'Deals empty state must present one calm next action.');
assert.doesNotMatch(app, /No parcels match this filter\./, 'Deals empty state must not use dramatic filter-failure language.');
assert.doesNotMatch(app, /<div class="empty-state-icon">\$\{solidIndustryIcon\('empty'\)\}<\/div><span class="eyebrow">Nothing actionable in this view/, 'Deals empty state must not render the old oversized icon box.');
assert.match(app, /target\.setAttribute\('role', 'tablist'\)/, 'Deals filters must declare a segmented-control tablist.');
assert.match(app, /aria-selected="\$\{filter === value \? 'true' : 'false'\}"/, 'Deals filter buttons must expose selected state.');
assert.match(app, /\['research', 'Research'\]/, 'Deals filter labels must stay compact.');
assert.match(app, /function renderDealsMarketCoverage/, 'Deals page must render a market coverage shelf before seller deals exist.');
assert.match(app, /data-deals-market-key/, 'Deals page must let the operator switch market lanes independently from stage filters.');
assert.match(app, /<div role="button" tabindex="0" class="deals-market-card/, 'Deals market cards must avoid global button gradients while staying keyboard reachable.');
assert.doesNotMatch(app, /<button[^>]+class="deals-market-card/, 'Deals market cards must not use button elements that inherit global dark gradients.');
assert.match(app, /builderMarketSwitchboardEntries\(\)/, 'Deals page must reuse the shared market registry instead of hiding new markets.');
assert.match(app, /function renderSellerCallReference/, 'Deals execution conveyor must store the seller call reference in the webapp, not only in agent memory.');
assert.match(app, /Hi, this is Okeito\. I’m calling about your lot at \[property address\]/, 'Seller phone script opener must be available in the webapp reference section.');
assert.match(app, /subagents should reference it, not perform outreach/, 'Webapp seller script must preserve the subagent boundary: reference only, no outreach.');
assert.match(app, /const expansionStateCodes = new Set\(\['GA', 'SC'\]\)/, 'Deals page must pin new GA/SC expansion markets near the top of the coverage shelf.');
assert.match(app, /\.\.\.expansionEntries, \.\.\.otherEntries/, 'Deals market coverage must surface expansion markets before older lanes.');
for (const key of ['forsyth-ga', 'hall-ga', 'jackson-ga', 'douglas-ga', 'dorchester-sc', 'berkeley-sc', 'greenville-sc']) {
  assert.match(app, new RegExp(`key: '${key}'`), `Deals market coverage must include ${key} through the shared registry.`);
}
assert.match(app, /this market is visible, but no public seller record currently clears buyer demand/, 'Deals empty copy must explain visible zero-deal markets.');

assert.match(css, /v1\.65 - Phase 38 Deals calm empty state/, 'Phase 38 route-scoped CSS marker missing.');
assert.match(css, /--phase38-deals-empty: compact-intentional-not-broken/, 'Deals route marker must document the intended state.');
assert.match(css, /#parcel-filters\.phase38-deals-segmented/, 'Deals filters must be styled as a segmented control.');
assert.match(css, /\.phase38-deals-empty[\s\S]*width: min\(100%, 640px\)/, 'Deals empty state must be compact, not full-width dramatic.');
assert.match(css, /\.phase38-deals-empty \.empty-state-icon[\s\S]*display: none !important/, 'Oversized empty-state icon box must stay hidden on Deals.');
assert.match(css, /body\[data-active-view="deals"\] footer[\s\S]*padding-bottom: 18px/, 'Deals footer/dead space must be pulled out of the visual field.');
assert.match(css, /v1\.73 - Deals market coverage: every builder market remains visible before seller deals exist/, 'Deals market coverage CSS marker missing.');
assert.match(css, /\.deals-market-grid[\s\S]{0,220}repeat\(auto-fit, minmax\(222px, 1fr\)\)/, 'Deals market coverage must scale to many markets.');
assert.match(css, /\.deals-market-card\.needs-work em[\s\S]{0,80}#8a5a13/, 'Deals low/no-data markets must have visible needs-work styling.');
assert.match(css, /v1\.74 - Deals market cards must beat global button gradients/, 'Deals market cards need a late contrast override against global button gradients.');
assert.match(css, /button\.deals-market-card\.deals-market-card[\s\S]{0,180}background-image: none !important/, 'Deals market card buttons must suppress inherited gradient backgrounds.');

assert.match(css, /v1\.97 - LandFlip seller-call reference lives in webapp, not the agent skill/, 'Seller-call reference CSS marker must document the webapp-owned script boundary.');
assert.match(css, /\.execution-call-reference[\s\S]{0,160}display: grid/, 'Seller-call reference must render as a compact operator reference card.');
assert.match(css, /\.seller-script-grid[\s\S]{0,120}repeat\(3, minmax\(0, 1fr\)\)/, 'Seller script capture checklist must be scannable on desktop.');

console.log('deals empty/filter UI tests passed');
