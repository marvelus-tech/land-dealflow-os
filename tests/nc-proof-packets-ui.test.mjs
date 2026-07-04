import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

assert.match(app, /northCarolinaWakeProofPackets/, 'NC Wake ZIP proof packet registry must be present.');
assert.match(app, /function renderNorthCarolinaWakeProofPackets/, 'Land page must render NC ZIP proof packets.');
assert.match(app, /selectedLandStateFilter === 'NC'/, 'Proof packets must be scoped to the North Carolina Land state.');
assert.match(app, /selectedDealsMarketKey === 'all' \|\| selectedDealsMarketKey === 'raleigh'/, 'Proof packets must live under the Raleigh\/Wake NC market lane.');
assert.match(app, /Download ZIP proof packets\./, 'Land UI must expose downloadable proof packets copy.');
assert.match(app, /wake_nc_27604_proof_packet\.md/, '27604 packet must be linked.');
assert.match(app, /wake_nc_27607_proof_packet\.md/, '27607 packet must be linked.');
assert.match(app, /wake_nc_27502_proof_packet\.md/, '27502 packet must be linked.');
assert.match(app, /downloadLink\(packet\.markdownUrl, 'Download MD'/, 'Primary packet action must be a downloadable markdown file.');
assert.match(app, /downloadLink\(packet\.csvUrl, 'CSV'/, 'CSV download must be available per ZIP.');
assert.match(app, /downloadLink\(packet\.jsonUrl, 'JSON'/, 'JSON download must be available per ZIP.');

assert.match(css, /--nc-proof-packet-rule: separate-zip-downloads-under-nc-land-market/, 'CSS marker must document separate NC ZIP proof packets.');
assert.match(css, /\.nc-proof-packet-grid[\s\S]{0,120}repeat\(3, minmax\(0, 1fr\)\)/, 'Desktop NC proof packet cards should render as a compact three-card grid.');
assert.match(css, /\.proof-packet-download\.primary/, 'Primary proof packet download style must exist.');

for (const zip of ['27604', '27607', '27502']) {
  for (const ext of ['md', 'csv', 'json']) {
    const path = `data/real/wake-nc-buy-box/wake_nc_${zip}_proof_packet.${ext}`;
    assert.ok(existsSync(path), `${path} must exist as a downloadable static asset.`);
    const body = readFileSync(path, 'utf8');
    assert.match(body, new RegExp(zip), `${path} must contain the ZIP code.`);
  }
}

const manifest = readFileSync('data/real/wake-nc-buy-box/wake_nc_zip_proof_packets_manifest.json', 'utf8');
for (const zip of ['27604', '27607', '27502']) {
  assert.match(manifest, new RegExp(`"zip": "${zip}"`), `Manifest must include ${zip}.`);
}
