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

assert.match(css, /v1\.65 - Phase 38 Deals calm empty state/, 'Phase 38 route-scoped CSS marker missing.');
assert.match(css, /--phase38-deals-empty: compact-intentional-not-broken/, 'Deals route marker must document the intended state.');
assert.match(css, /#parcel-filters\.phase38-deals-segmented/, 'Deals filters must be styled as a segmented control.');
assert.match(css, /\.phase38-deals-empty[\s\S]*width: min\(100%, 640px\)/, 'Deals empty state must be compact, not full-width dramatic.');
assert.match(css, /\.phase38-deals-empty \.empty-state-icon[\s\S]*display: none !important/, 'Oversized empty-state icon box must stay hidden on Deals.');
assert.match(css, /body\[data-active-view="deals"\] footer[\s\S]*padding-bottom: 18px/, 'Deals footer/dead space must be pulled out of the visual field.');

console.log('deals empty/filter UI guard passed');
