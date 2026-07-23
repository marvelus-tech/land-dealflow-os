import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(app, /let activeTaxDeedMarket = 'all'/, 'Tax-Deed page must track an active market filter.');
assert.match(app, /const allBuyers = asArray\(leeCountyTaxDeedBuyers\)/, 'Tax-Deed filters must preserve the unfiltered buyer source.');
assert.match(app, /const allOwnerRows = buildTaxDeedOwnerRunway/, 'Tax-Deed filters must preserve the unfiltered owner runway source.');
assert.match(app, /const filterState = rowState => activeTaxDeedMarket === 'all' \|\| rowState === activeTaxDeedMarket/, 'Tax-Deed filter must constrain rows by selected state/market.');
assert.match(app, /const buyers = allBuyers\.filter\(buyer => filterState\(buyerLocation\(buyer\)\.state\)\)/, 'Buyer table must be filtered by market.');
assert.match(app, /const ownerRows = allOwnerRows\.filter\(row => filterState\(row\.state\)\)/, 'Owner runway table must be filtered by market.');
assert.match(app, /data-tax-deed-market="all"/, 'Market rail must include a functional All control.');
assert.match(app, /data-tax-deed-market="\$\{h\(state\)\}"/, 'Market rail state buttons must carry data-tax-deed-market values.');
assert.doesNotMatch(app, /tax-deed-state-rail[\s\S]{0,260}<button type="button" disabled>/, 'Tax-Deed market rail state buttons must not be disabled decoration.');
assert.match(app, /const taxDeedMarket = event\.target\.closest\('\[data-tax-deed-market\]'\)/, 'Click handler must listen for market filter buttons.');
assert.match(app, /activeTaxDeedMarket = taxDeedMarket\.dataset\.taxDeedMarket \|\| 'all'/, 'Click handler must update the active Tax-Deed market.');
assert.match(app, /No buyer rows match this market filter/, 'Empty filtered buyer state must be explicit.');
assert.match(app, /market filter active/, 'Market rail must communicate the active filter state.');

assert.match(css, /--phase296-tax-deed-market-filters: functional-pa-fl-owner-buyer-market-toggle/, 'CSS must include Phase 296 marker.');
assert.match(html, /phase296-tax-deed-market-filters/, 'Live HTML must cache-bust the Phase 296 market filter fix.');
assert.match(pkg.scripts.test, /phase296-tax-deed-market-filters\.test\.mjs/, 'Full npm test must include the Phase 296 guard.');

console.log('phase296 tax deed market filters guard passed');
