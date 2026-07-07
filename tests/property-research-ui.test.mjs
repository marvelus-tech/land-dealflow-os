import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

assert.match(app, /const propertyResearchReports = \[/, 'Property research registry must be present.');
assert.match(app, /function renderSelectedMarketPropertyResearch/, 'Selected market queue must render property research.');
assert.match(app, /propertyResearchMarketEntries/, 'Property-only markets must be selectable from Land.');
assert.match(app, /fort-pierce-fl/, 'Fort Pierce property research market must be registered.');
assert.match(app, /port-st-lucie-fl/, 'Port St. Lucie property research market must be registered.');
assert.match(app, /clermont-e-minneola-ahmad-alyahya/, 'Clermont comp packet must be in the registry.');
assert.match(app, /dallas-van-ness-jorge-reynosa/, 'Dallas Van Ness comp packet must be in the registry.');
assert.match(app, /Public GitHub assets redact operator-supplied phones\/emails/, 'UI must disclose public-contact redaction.');
assert.match(app, /renderSelectedMarketPropertyResearch\(\)/, 'Market operating brief must call selected-market research renderer.');
assert.match(app, /Download research/, 'Research cards must expose markdown downloads.');
assert.match(app, /data\/real\/property-research\/600-midway-osman-pineda-comp-2026-07-07\.md/, 'Midway packet link must be present.');
assert.match(app, /data\/real\/property-research\/2520-s-ocean-blaine-meehan-comp-2026-07-07\.md/, 'S Ocean packet link must be present.');
assert.match(app, /data\/real\/property-research\/3831-van-ness-jorge-reynosa-comp-2026-07-07\.md/, 'Van Ness packet link must be present.');

assert.match(css, /--phase262-property-research: elegant-public-comp-packets-in-land-queue/, 'CSS marker must document property research queue UX.');
assert.match(css, /\.property-research-grid[\s\S]{0,180}repeat\(auto-fit, minmax\(min\(100%, 280px\), 1fr\)\)/, 'Property cards must form a responsive premium grid.');
assert.match(css, /\.property-research-download\.primary/, 'Primary property download action must have a style.');

const expectedAssets = [
  ['data/real/property-research/600-midway-osman-pineda-comp-2026-07-07.md', '3402-605-0094-000-5'],
  ['data/real/property-research/2520-s-ocean-blaine-meehan-comp-2026-07-07.md', '2413-501-0122-000-3'],
  ['data/real/property-research/603-dark-hammock-clint-hughes-comp-2026-07-07.md', '2408-702-0011-000-3'],
  ['data/real/property-research/1185-sw-gastador-dallas-black-comp-2026-07-07.md', '3420-535-2212-000-5'],
  ['data/real/property-research/2992-se-buccaneer-robert-riley-comp-2026-07-07.md', '3420-695-0776-000-5'],
  ['data/real/property-research/11-se-rio-angelica-john-joyce-comp-2026-07-07.md', '442180001350006'],
  ['data/real/property-research/3831-van-ness-jorge-reynosa-comp-2026-07-07.md', '00000530488000000'],
  ['data/real/property-research/e-minneola-ahmad-alyahya-comp-2026-07-07.md', '24-22-25-0150-00O-00208'],
];

for (const [path, marker] of expectedAssets) {
  assert.ok(existsSync(path), `${path} must exist as a downloadable public asset.`);
  const body = readFileSync(path, 'utf8');
  assert.match(body, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${path} must contain its parcel/account marker.`);
  assert.doesNotMatch(body, /@att\.net|seller[_ -]?phone|seller[_ -]?email|operator-supplied contact|\b\d{3}[- .]?\d{3}[- .]?\d{4}\b/i, `${path} must not expose operator-supplied contact details.`);
}
