import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const scripts = readFileSync(new URL('../src/outreachScripts.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(html, /data-view="tax-deed">Tax-Deed<\/button>/, 'Primary nav must rename Buyers to Tax-Deed.');
assert.doesNotMatch(html, /data-view="buyers">Buyers<\/button>/, 'Old primary Buyers nav tab must be removed.');
assert.match(html, /data-panel="tax-deed"/, 'Tax deed page must own the tax-deed route panel.');
assert.match(app, /const validViews = new Set\(\['today', 'deals', 'builders', 'tax-deed'/, 'tax-deed must be a valid route.');
assert.match(app, /if \(view === 'buyers'\) return 'tax-deed'/, 'legacy #buyers hash must map to the renamed route.');
assert.match(app, /data-tax-deed-tab="buyers">Buyers<\/(?:button|a)>/, 'Tax deed page must expose a Buyers tab controller.');
assert.match(app, /data-tax-deed-tab="owners">Owners<\/(?:button|a)>/, 'Tax deed page must expose an Owners tab controller.');
assert.match(app, /data-tax-deed-tab-panel="buyers"[\s\S]{0,500}agent-airtable buyer-airtable/, 'Existing buyer list must live inside the Buyers tab panel.');
assert.match(app, /data-tax-deed-tab-panel="owners"[\s\S]{0,260}No owner rows loaded yet/, 'Owners tab must be prepared but empty.');
assert.match(app, /scriptButton\('tax-deed', 'Scripts'\)/, 'Tax deed page must open the script drawer from its Scripts button.');
assert.match(app, /'tax-deed': 'Tax deed scripts'/, 'Script drawer must label the new tax-deed scope.');
assert.match(app, /startsWith\('land-tax-deed'\)/, 'Tax deed script drawer must include prior tax-deed owner scripts from Land-page research.');
assert.match(app, /\['tax-deed', 'buyers', 'agents'\]/, 'Tax deed script drawer must include tax deed, buyer, and agent script scopes.');
assert.match(app, /scopeRank = \{ 'tax-deed': 0, deals: 1, buyers: 2, agents: 3 \}/, 'Tax deed drawer must prioritize the owner script before buyer and agent scripts.');
assert.match(scripts, /tax-deed-owner-redeem-sell-let-go-opener/, 'User-supplied tax deed owner opener must be stored in the script bank.');
assert.match(scripts, /Were you planning to redeem it, sell it, or let it go\?/, 'Stored owner script must include the supplied seller opener.');
assert.match(scripts, /pay the back taxes through closing and put some cash in your pocket/, 'Stored owner script must include the supplied follow-up angle.');
assert.match(css, /--phase293-tax-deed-page-tabs: tax-deed-buyers-owners-script-drawer/, 'CSS must include the Phase 293 tab/drawer marker.');
assert.match(html, /phase293-tax-deed-page-tabs/, 'Live HTML must cache-bust the Phase 293 redesign.');
assert.match(pkg.scripts.test, /phase293-tax-deed-page-tabs\.test\.mjs/, 'Full npm test must include the Phase 293 guard.');

console.log('phase293 tax deed page tabs/script drawer guard passed');
