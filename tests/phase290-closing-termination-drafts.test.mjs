import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.mjs', 'utf8');
const scripts = fs.readFileSync('src/outreachScripts.mjs', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const closingScopeMatches = scripts.match(/"scope": "closing"/g) || [];
assert.equal(closingScopeMatches.length, 2, 'Closing must expose exactly two termination draft templates for now.');
assert.match(scripts, /closing-feasibility-termination-email-clean/, 'Clean feasibility termination email draft missing.');
assert.match(scripts, /closing-feasibility-termination-email-warm/, 'Warm feasibility termination email draft missing.');
assert.match(scripts, /we could not find a buyer/, 'Draft notes must explicitly ban the buyer-search excuse framing.');
assert.match(scripts, /feasibility\/due-diligence provision/, 'Termination draft must use feasibility/due-diligence contract framing.');
assert.match(app, /contract right that does not exist/, 'Drawer warning must guard against fake contract rights.');
assert.match(app, /closing: 'Closing termination drafts'/, 'Script drawer label must name Closing termination drafts.');
assert.match(app, /scriptButton\('closing', 'Termination drafts'\)/, 'Closing page must house the termination draft button.');
assert.match(html, /phase290-closing-termination-drafts/, 'Live app module cache token must include Phase 290 closing termination drafts.');
assert.match(pkg.scripts.test, /phase290-closing-termination-drafts\.test\.mjs/, 'Full npm test must include the Phase 290 closing termination guard.');

console.log('phase290 closing termination drafts guard passed');
