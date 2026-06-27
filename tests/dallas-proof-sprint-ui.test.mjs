import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const proofSprint = JSON.parse(readFileSync('data/real/dallas-buyer-752xx/phase45_top12_proof_sprint.json', 'utf8'));
const latest = JSON.parse(readFileSync('data/generated/latest.json', 'utf8'));

assert.equal(proofSprint.completePhase4Count, 68, 'Dallas complete Phase 4 queue must preserve all 68 rows.');
assert.equal(proofSprint.sprintCount, 12, 'Dallas proof sprint must expose the Top-12 operator view.');
assert.equal(proofSprint.rows.length, 12, 'Phase 4.5 proof sprint artifact should include 12 rows.');
assert.ok(proofSprint.rows.every(row => row.phase4Status === 'hold-needs-utility-plat-proof'), 'Every sprint row must remain held for utility/plat proof.');
assert.ok(proofSprint.rows.every(row => row.dcadAccountUrl && row.cityParcelQueryUrl && row.dallasCountyPublicSearchUrl), 'Sprint rows need DCAD, City parcel API, and recorded-plat search links.');

const dallasRows = latest.snapshot.parcels.filter(row => row.phase4Status === 'hold-needs-utility-plat-proof');
assert.equal(dallasRows.length, 68, 'Generated latest dataset must keep all 68 Dallas rows app-loadable.');
assert.equal(latest.queues.offerReady.filter(row => /dallas/i.test(`${row.market || ''} ${row.address || ''}`)).length, 0, 'Dallas rows must not be offer-ready while proof is missing.');
assert.ok(dallasRows.every(row => !(row.ownerPhone || row.ownerEmail)), 'Dallas proof-needed rows must not surface callable owner contacts.');

assert.match(app, /let dallasProofSprint = null/, 'App must keep loaded Dallas Phase 4.5 state.');
assert.match(app, /async function loadDallasProofSprint/, 'App must fetch the Phase 4.5 proof sprint artifact.');
assert.match(app, /phase45_top12_proof_sprint\.json/, 'App must load the exact Dallas Phase 4.5 proof sprint JSON.');
assert.match(app, /function renderDallasProofSprintSurface/, 'Land UI must render a Dallas proof sprint surface.');
assert.match(app, /Top-12 proof sprint surfaced inside Land\./, 'Dallas proof sprint needs operator-facing heading copy.');
assert.match(app, /Complete Dallas queue/, 'Dallas proof surface must show the complete queue count.');
assert.match(app, /Held for proof/, 'Dallas proof surface must show held proof-gate count.');
assert.match(app, /Offer-ready/, 'Dallas proof surface must show offer-ready count.');
assert.match(app, /dallasProofRowForParcel/, 'Dallas Top-12 rows must attach to selected Land listings.');
assert.match(app, /class="dallas-sprint-chip"/, 'Top-12 Land rows need a visible sprint rank chip.');
assert.match(app, /selected-dallas-proof-panel/, 'Selected Dallas row detail must surface proof links and statuses.');
assert.match(app, /dallasProofGateTone/, 'Dallas proof UI must map raw proof statuses into pass/partial/needed/fail tones.');
assert.match(app, /dallasProofGateStrip/, 'Dallas proof UI must render per-gate pass/fail indicators.');
assert.match(app, /Partial proof \/ held/, 'Dallas proof UI must show aggregate held/partial status copy.');
assert.match(app, /dallas-proof-row-chip/, 'Land ledger rows must show Dallas proof aggregate chips.');
assert.match(app, /Open DCAD account/, 'Selected Dallas proof detail must expose DCAD links.');
assert.match(app, /Open City parcel API/, 'Selected Dallas proof detail must expose City parcel API links.');
assert.match(app, /Open recorded plat search/, 'Selected Dallas proof detail must expose recorded-plat search.');
assert.match(app, /Dallas Water Utilities/, 'Selected Dallas proof detail must expose DWU proof path.');
assert.match(app, /Oncor/, 'Selected Dallas proof detail must expose electric proof path.');
assert.match(app, /Atmos/, 'Selected Dallas proof detail must expose gas proof path.');
assert.match(app, /County search terms:/, 'Selected Dallas proof detail must show manual search terms.');
assert.match(app, /dallasProofSurface/, 'Dallas proof surface must be inserted into the Land render path.');

assert.match(css, /--land-final-css: consolidated-land-styles-no-stale-phase-overrides/, 'Dallas proof styling must live in the consolidated Land stylesheet.');
assert.match(css, /\.dallas-proof-sprint-surface/, 'Dallas proof sprint surface must have route-scoped styling.');
assert.match(css, /\.dallas-proof-metrics\)[\s\S]{0,180}repeat\(4,minmax\(0,1fr\)\)/, 'Dallas proof metrics should render as a compact four-column ledger.');
assert.match(css, /\.dallas-proof-row \{[\s\S]{0,220}grid-template-columns:minmax\(170px,\.64fr\) minmax\(0,1fr\) minmax\(230px,\.75fr\)/, 'Dallas proof rows should keep address, proof links, and tasks in one scan line on desktop.');
assert.match(css, /\.land-listing-row\.in-dallas-proof-sprint \{ border-left:3px solid/, 'Top-12 rows need a restrained priority rail.');
assert.match(css, /\.selected-dallas-proof-panel/, 'Selected Dallas proof detail must be styled.');
assert.match(css, /\.dallas-proof-gate-chip\.is-pass/, 'Dallas proof gates must have pass styling.');
assert.match(css, /\.dallas-proof-gate-chip\.is-partial/, 'Dallas proof gates must have partial styling.');
assert.match(css, /\.dallas-proof-gate-chip\.is-fail/, 'Dallas proof gates must have fail styling.');
assert.match(css, /\.dallas-proof-row-chip/, 'Land ledger proof aggregate chip must be styled.');

console.log('dallas proof sprint UI tests passed');
