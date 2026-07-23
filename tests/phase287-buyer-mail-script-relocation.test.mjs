import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.mjs', 'utf8');
const scripts = fs.readFileSync('src/outreachScripts.mjs', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.match(scripts, /"id": "buyer-direct-mail-note"[\s\S]{0,120}"scope": "buyers"/, 'Direct-mail note must live in the Buyers script scope.');
assert.match(scripts, /Simple letter to prior buyers \/ LLC offices/, 'Buyer mail script title must stay source-backed and available.');
assert.doesNotMatch(html, /data-open-script-panel="builders"/, 'Builders page must not expose the buyer mail script drawer.');
assert.doesNotMatch(app, /scope === 'builders' \? 'buyers'/, 'Builders scope must not be remapped to Buyers scripts.');
assert.match(app, /scriptButton\('tax-deed', 'Scripts'\)/, 'Renamed Tax-Deed page must expose the same pull-panel Scripts button UX.');
assert.match(pkg.scripts.test, /phase287-buyer-mail-script-relocation\.test\.mjs/, 'Full npm test must include the Phase 287 buyer mail script relocation guard.');

console.log('phase287 buyer mail script relocation guard passed');
