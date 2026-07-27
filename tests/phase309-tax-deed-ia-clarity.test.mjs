import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(app, /phase309-tax-deed-ia-clarity/, 'Tax-Deed route must carry the Phase 309 IA clarity marker.');
assert.match(app, /data-phase309-tax-deed-ia="lane-first-market-matrix"/, 'Tax-Deed shell must expose lane-first market-matrix IA marker.');
assert.match(app, /Step 1<\/span><b>Choose work lane/, 'Buyers/Owners must be framed as Step 1, not buried as low-contrast tabs.');
assert.match(app, /Tax deed Buyers and Owners lanes/, 'The tablist aria label must explicitly name Buyers and Owners.');
assert.match(app, /<b>Buyers<\/b><span>Validate demand/, 'Buyer lane must describe buyer validation work.');
assert.match(app, /<b>Owners<\/b><span>Source runway/, 'Owner lane must describe owner runway work.');
assert.match(app, /Step 2<\/span><b>Filter market after lane/, 'Markets must be framed as Step 2 after lane choice.');
assert.match(app, /data-tax-deed-market-matrix="buyers-owners-market-counts"/, 'Market controls must show Buyers/Owners count matrix.');
assert.match(app, /buyers · \$\{h\(ownerCountForState\(state\)\)\} owners/, 'Each market filter must expose buyer and owner counts together.');

assert.match(css, /--phase309-tax-deed-ia-clarity: lane-first-buyers-owners-market-matrix/, 'CSS must include Phase 309 IA marker.');
assert.match(css, /\.phase309-tax-deed-ia-clarity \.tax-deed-lane-command[\s\S]{0,180}grid-template-columns: minmax\(360px, \.78fr\) minmax\(420px, 1fr\) minmax\(120px, \.24fr\)/, 'Desktop IA must read as lane, market, tools.');
assert.match(css, /\.phase309-tax-deed-ia-clarity \.tax-deed-tab-controller \[role="tab"\][\s\S]{0,220}min-height: 86px/, 'Buyers/Owners tabs must be enlarged into legible work-lane cards.');
assert.match(css, /\.phase309-tax-deed-ia-clarity \.tax-deed-state-rail[\s\S]{0,160}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, 'Market filters must form a readable count matrix.');
assert.match(css, /\.tax-deed-market-option\.is-active[\s\S]{0,180}box-shadow: inset 0 3px 0 var\(--tax-signal\)/, 'Active market must have a clear selected affordance.');
assert.match(html, /phase309-tax-deed-ia-clarity/, 'Live HTML must cache-bust the Phase 309 Tax-Deed IA update.');
assert.match(pkg.scripts.test, /phase309-tax-deed-ia-clarity\.test\.mjs/, 'Full npm test must include the Phase 309 guard.');

console.log('phase309 tax deed IA clarity guard passed');
