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

assert.equal(downloads.length, 10, 'Tax-Deed CSV deck must stay pruned to the latest non-duplicate operating exports.');
assert.match(app, /function renderTaxDeedCsvDownloads\(\)/, 'Tax-Deed page must render a CSV download section.');
assert.match(app, /renderTaxDeedCsvDownloads\(\)/, 'Tax-Deed panel must mount the CSV download section.');
assert.match(app, /data-phase310-tax-deed-csv-downloads="latest-nonduplicate-static-csv-links"/, 'Tax-Deed CSV downloads need a durable latest-only Phase 310 marker.');
assert.match(app, /Only the latest non-duplicate operating CSVs are shown here/, 'CSV download copy must explain that old/superseded exports are hidden.');
assert.match(app, /downloadLink\(item\.url, 'Download CSV', 'tax-deed-csv-download primary'\)/, 'Primary CSV action must use the download attribute.');
assert.match(app, /activeTaxDeedMarket === 'all' \|\| String\(item\.market \|\| ''\)\.includes\(activeTaxDeedMarket\)/, 'CSV downloads must respect the Tax-Deed market filter when possible.');

const requiredUrls = [
  './artifacts/buyer-lists/florida-tax-deed/central-fl-premium-infill-buyers/central-fl-premium-infill-buyer-validation-queue.csv',
  './artifacts/buyer-lists/florida-tax-deed/lee/buyers.csv',
  './artifacts/buyer-lists/florida-tax-deed/florida-tax-deed-buyer-leads-skiptrace-enriched.csv',
  './artifacts/seller-lists/fl-tax-deed/florida-tax-deed-owner-leads-simplified-property-address-skiptrace.csv',
  './artifacts/seller-lists/florida-tax-deed/contact-enrichment/free-public-crossref/florida-tax-deed-free-public-crossref-results.csv',
  './artifacts/seller-lists/fl-tax-deed/okaloosa/okaloosa-tax-deed-expanded-seller-hit-list-2026-07-24.csv',
  './artifacts/seller-lists/pa-upset-sale/york-county/york-pa-unique-owner-vacant-lot-skiptrace-queue.csv',
  './artifacts/seller-lists/pa-upset-sale/york-county/contact-enrichment/york-pa-owner-contact-enrichment-queue.csv',
  './data/real/lehigh/builder_validation_queue.csv',
  './data/real/lehigh/seller_skiptrace_queue.csv',
];
assert.deepEqual(downloads.map(item => item.url), requiredUrls, 'CSV deck order should expose only the latest curated list.');

for (const staleUrl of [
  './artifacts/buyer-lists/florida-tax-deed/florida-tax-deed-buyer-leads-simplified-skiptrace.csv',
  './artifacts/seller-lists/fl-tax-deed/florida-tax-deed-seller-owner-leads-simplified-skiptrace.csv',
  './artifacts/seller-lists/fl-tax-deed/okaloosa/okaloosa-tax-deed-seller-hit-list-2026-07-24.csv',
  './artifacts/seller-lists/pa-upset-sale/york-county/york-pa-vacant-lot-taxclaim-candidates.csv',
  './artifacts/buyer-lists/florida-tax-deed/central-fl-core/source-ledger.csv',
]) {
  assert.ok(!downloads.some(item => item.url === staleUrl), `${staleUrl} is superseded/supporting evidence and should not clutter the CSV deck.`);
}

for (const item of downloads) {
  assert.ok(item.title && item.url && item.file && item.market && item.lane, `Download item must include UI metadata: ${JSON.stringify(item)}`);
  assert.ok(Number(item.rows) > 0, `${item.file} should only be shown when it contains rows.`);
  assert.match(item.status, /latest/, `${item.file} status must make clear this is a latest-version CSV.`);
  const filePath = join(process.cwd(), item.file);
  assert.ok(existsSync(filePath), `${item.file} must exist as a committed/downloadable static asset.`);
  const csv = readFileSync(filePath, 'utf8');
  assert.ok(csv.includes('\n'), `${item.file} must contain CSV content, not an empty placeholder.`);
}

assert.match(css, /--phase310-tax-deed-csv-downloads: latest-nonduplicate-static-csv-links/, 'CSS must include the latest-only Phase 310 Tax-Deed CSV marker.');
assert.match(css, /body\[data-active-view="tax-deed"\] \.tax-deed-csv-grid[\s\S]{0,180}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, 'Desktop CSV deck should render as a readable grid.');
assert.match(css, /\.tax-deed-csv-download\.primary[\s\S]{0,180}color: #fff !important/, 'Primary CSV downloads must be legible buttons.');
assert.match(html, /phase310-tax-deed-csv-downloads/, 'Live HTML must cache-bust the Phase 310 Tax-Deed CSV download update.');
assert.match(pkg.scripts.test, /phase310-tax-deed-csv-downloads\.test\.mjs/, 'Full npm test must include the Phase 310 CSV download guard.');

console.log('phase310 latest-only Tax-Deed CSV downloads guard passed');
