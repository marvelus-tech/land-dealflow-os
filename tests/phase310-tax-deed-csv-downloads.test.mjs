import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const registryMatch = app.match(/const taxDeedCsvDownloads = (\[[\s\S]*?\]);\n\nfunction renderNorthCarolinaWakeProofPackets/);
assert.ok(registryMatch, 'Tax-Deed page must define a static CSV download registry before rendering.');
const downloads = JSON.parse(registryMatch[1]);

assert.ok(downloads.length >= 30, 'Tax-Deed CSV download registry must expose all current non-empty operating CSV exports.');
assert.match(app, /function renderTaxDeedCsvDownloads\(\)/, 'Tax-Deed page must render a CSV download section.');
assert.match(app, /renderTaxDeedCsvDownloads\(\)/, 'Tax-Deed panel must mount the CSV download section.');
assert.match(app, /data-phase310-tax-deed-csv-downloads="public-static-tax-deed-csv-links"/, 'Tax-Deed CSV downloads need a durable Phase 310 marker.');
assert.match(app, /downloadLink\(item\.url, 'Download CSV', 'tax-deed-csv-download primary'\)/, 'Primary CSV action must use the download attribute.');
assert.match(app, /activeTaxDeedMarket === 'all' \|\| String\(item\.market \|\| ''\)\.includes\(activeTaxDeedMarket\)/, 'CSV downloads must respect the Tax-Deed market filter when possible.');

for (const required of [
  './artifacts/buyer-lists/florida-tax-deed/lee/buyers.csv',
  './artifacts/buyer-lists/florida-tax-deed/florida-tax-deed-buyer-leads-skiptrace-enriched.csv',
  './artifacts/seller-lists/fl-tax-deed/florida-tax-deed-owner-leads-simplified-property-address-skiptrace.csv',
  './artifacts/seller-lists/fl-tax-deed/okaloosa/okaloosa-tax-deed-expanded-seller-hit-list-2026-07-24.csv',
  './artifacts/seller-lists/pa-upset-sale/york-county/york-pa-unique-owner-vacant-lot-skiptrace-queue.csv',
  './data/real/lehigh/seller_skiptrace_queue.csv',
]) {
  assert.ok(downloads.some(item => item.url === required), `${required} must be downloadable from the Tax-Deed CSV deck.`);
}

for (const item of downloads) {
  assert.ok(item.title && item.url && item.file && item.market && item.lane, `Download item must include UI metadata: ${JSON.stringify(item)}`);
  assert.ok(Number(item.rows) > 0, `${item.file} should only be shown when it contains rows.`);
  const filePath = join(process.cwd(), item.file);
  assert.ok(existsSync(filePath), `${item.file} must exist as a committed/downloadable static asset.`);
  const csv = readFileSync(filePath, 'utf8');
  assert.ok(csv.includes('\n'), `${item.file} must contain CSV content, not an empty placeholder.`);
}

assert.match(css, /--phase310-tax-deed-csv-downloads: public-static-tax-deed-csv-links/, 'CSS must include the Phase 310 Tax-Deed CSV marker.');
assert.match(css, /body\[data-active-view="tax-deed"\] \.tax-deed-csv-grid[\s\S]{0,180}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, 'Desktop CSV deck should render as a readable grid.');
assert.match(css, /\.tax-deed-csv-download\.primary[\s\S]{0,180}color: #fff !important/, 'Primary CSV downloads must be legible buttons.');
assert.match(html, /phase310-tax-deed-csv-downloads/, 'Live HTML must cache-bust the Phase 310 Tax-Deed CSV download update.');
assert.match(pkg.scripts.test, /phase310-tax-deed-csv-downloads\.test\.mjs/, 'Full npm test must include the Phase 310 CSV download guard.');

console.log('phase310 Tax-Deed CSV downloads guard passed');
