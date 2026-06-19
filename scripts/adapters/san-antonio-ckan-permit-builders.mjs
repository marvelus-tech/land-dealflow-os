import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(repoRoot, 'data', 'real', 'san-antonio');
const MINIMUM_UNIQUE_BUILDERS = 20;
const RESOURCE_ID = 'c21106f9-3ef5-4f3a-8604-f992b4db7512';
const DATASET_URL = 'https://data.sanantonio.gov/dataset/building-permits/resource/c21106f9-3ef5-4f3a-8604-f992b4db7512';
const API_URL = 'https://data.sanantonio.gov/api/3/action/datastore_search_sql';

function compact(value) { return String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function slug(value) { return compact(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function money(value) { return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0; }
function isoDate(value) { return compact(value).slice(0, 10); }
function csvEscape(value) { const text = value === undefined || value === null ? '' : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function writeCsv(path, rows, headers) { writeFileSync(path, [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n')); }
function sqlString(value) { return String(value).replaceAll("'", "''"); }
function cleanBuilderName(value) {
  return compact(value)
    .replace(/\bLLC\b/gi, 'LLC')
    .replace(/\bINC\b/gi, 'Inc')
    .replace(/\s+/g, ' ')
    .trim();
}
function isUsableBuilderName(name) {
  const clean = cleanBuilderName(name);
  if (!clean || /^N\/?A$/i.test(clean) || /^OWNER$/i.test(clean) || /^HOMEOWNER$/i.test(clean)) return false;
  if (/\b(GARAGE SALE|TACO|SIGN|TREE|POOL|SPA|SOLAR|ROOF|PLUMB|ELECTRIC|MECHANICAL|IRRIGATION|FENCE)\b/i.test(clean)) return false;
  return /\b(HOME|HOMES|BUILD|BUILDER|BUILDERS|CONSTRUCTION|COMMUNITIES|RESIDENTIAL|PROPERTIES|REALTY|DEVELOPMENT|HABITAT|LENNAR|KB|PULTE|MERITAGE|D R HORTON|CHESMAR|PERRY|HIGHLAND|MIHOME|M\/I|M-I)\b/i.test(clean);
}
function permitScore(rows) {
  const totalValue = rows.reduce((sum, row) => sum + money(row['DECLARED VALUATION']), 0);
  return Math.min(100, 48 + rows.length * 5 + (totalValue >= 500000 ? 8 : 0));
}
function permitSourceUrl(row) {
  const permit = compact(row['PERMIT #']);
  return permit ? `${DATASET_URL}?q=${encodeURIComponent(permit)}` : DATASET_URL;
}
function normalizeBuilder(name, rows) {
  const cleanName = cleanBuilderName(name);
  const sorted = [...rows].sort((a, b) => String(b['DATE ISSUED'] || '').localeCompare(String(a['DATE ISSUED'] || '')));
  const sample = sorted[0] || {};
  const recentPermits = sorted.slice(0, 5).map(row => ({
    permitNumber: compact(row['PERMIT #']),
    address: compact(row.ADDRESS),
    issuedAt: isoDate(row['DATE ISSUED']),
    submittedAt: isoDate(row['DATE SUBMITTED']),
    permitValue: money(row['DECLARED VALUATION']),
    areaSqft: money(row['AREA (SF)']),
    permitType: compact(row['PERMIT TYPE']),
    workType: compact(row['WORK TYPE']),
    projectName: compact(row['PROJECT NAME']),
    councilDistrict: compact(row.CD),
    sourceUrl: permitSourceUrl(row),
  }));
  return {
    id: `san-antonio-builder-${slug(cleanName).slice(0, 56)}`,
    name: cleanName,
    market: 'san-antonio-tx',
    state: 'TX',
    website: '',
    phone: '',
    email: '',
    contactName: cleanName,
    recentBuilds: rows.length,
    closeSpeedDays: '',
    maxPrice: '',
    buyBox: 'Public San Antonio permit signal only. Call builder to capture exact San Antonio-area land buy box, max price, close speed, utility/access constraints, and kill criteria before treating as validated demand.',
    validationStatus: 'needs-call-confirmation',
    confidence: permitScore(rows),
    sourceUrl: DATASET_URL,
    publicSource: 'Open Data SA / City of San Antonio Building Permits — PERMITS ISSUED CKAN datastore. Filtered to Res New Building Permit + New work type.',
    evidenceType: 'permitVerified active-builder signal',
    recentPermits,
    acquisitionNotes: `Appears on ${rows.length} San Antonio public residential new-building permit rows since 2025. Latest sample ${compact(sample['PERMIT #'])} at ${compact(sample.ADDRESS)} issued ${isoDate(sample['DATE ISSUED'])}.`,
  };
}
async function fetchSql(sql) {
  const url = `${API_URL}?${new URLSearchParams({ sql }).toString()}`;
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 LandDealflowOS/1.0' } });
  if (!response.ok) throw new Error(`San Antonio CKAN query failed ${response.status}: ${await response.text()}`);
  const data = await response.json();
  if (!data.success) throw new Error(`San Antonio CKAN query failed: ${JSON.stringify(data.error || data)}`);
  return data.result.records || [];
}

export async function buildSanAntonioPermitBuilders({ rowLimit = 7000, since = '2025-01-01', minimumUniqueBuilders = MINIMUM_UNIQUE_BUILDERS } = {}) {
  mkdirSync(OUT_DIR, { recursive: true });
  const where = `"DATE ISSUED" >= '${sqlString(since)}' AND "PERMIT TYPE" = 'Res New Building Permit' AND "WORK TYPE" = 'New' AND "PRIMARY CONTACT" IS NOT NULL AND "ADDRESS" IS NOT NULL`;
  const sql = `SELECT "PERMIT TYPE", "PERMIT #", "PROJECT NAME", "WORK TYPE", "ADDRESS", "DATE SUBMITTED", "DATE ISSUED", "DECLARED VALUATION", "AREA (SF)", "PRIMARY CONTACT", "CD" FROM "${RESOURCE_ID}" WHERE ${where} ORDER BY "DATE ISSUED" DESC LIMIT ${Number(rowLimit)}`;
  const rows = await fetchSql(sql);
  const groups = new Map();
  for (const row of rows) {
    const name = cleanBuilderName(row['PRIMARY CONTACT']);
    if (!isUsableBuilderName(name)) continue;
    const key = slug(name);
    if (!groups.has(key)) groups.set(key, { name, rows: [] });
    groups.get(key).rows.push(row);
  }
  const builderSignals = [...groups.values()]
    .filter(group => group.rows.length >= 2)
    .map(group => normalizeBuilder(group.name, group.rows))
    .sort((a, b) => b.recentBuilds - a.recentBuilds || b.confidence - a.confidence || a.name.localeCompare(b.name))
    .slice(0, 50);
  if (builderSignals.length < minimumUniqueBuilders) {
    throw new Error(`San Antonio permit-builder pull requires at least ${minimumUniqueBuilders} unique builders; found ${builderSignals.length}. Expand CKAN source query before rendering this market.`);
  }
  const evidence = {
    market: 'San Antonio, TX',
    marketId: 'san-antonio-tx',
    state: 'TX',
    generatedAt: new Date().toISOString(),
    source: {
      name: 'Open Data SA — Building Permits / PERMITS ISSUED',
      resourceId: RESOURCE_ID,
      sourceUrl: DATASET_URL,
      apiUrl: API_URL,
      where,
    },
    summary: {
      permitRowsSampled: rows.length,
      uniqueBuilders: builderSignals.length,
      minimumUniqueBuilders,
      totalRecentBuildSignals: builderSignals.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0),
      filter: 'Res New Building Permit, New work type, primary contact present, issued since 2025-01-01.',
    },
    operatingRules: [
      'Primary Contact is treated as permit-backed builder/contact evidence, not a validated buyer or confirmed acquisitions contact.',
      'Only Res New Building Permit + New rows are included; garage sale, pool, trade, roof, fence, repair, and remodel permit types are excluded.',
      'No builder is promoted to seller sourcing until buy box, package recipient, max price, close speed, and kill criteria are captured.',
    ],
  };
  writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'builder_signals.json'), `${JSON.stringify(builderSignals, null, 2)}\n`);
  writeCsv(join(OUT_DIR, 'builder_validation_queue.csv'), builderSignals, ['id','name','market','state','recentBuilds','contactName','validationStatus','confidence','sourceUrl','acquisitionNotes']);
  return { evidence, builderSignals, outDir: OUT_DIR };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildSanAntonioPermitBuilders({
    rowLimit: Number(process.env.SAN_ANTONIO_ROW_LIMIT || 7000),
    since: process.env.SAN_ANTONIO_PERMIT_SINCE || '2025-01-01',
  });
  console.log(JSON.stringify({
    outDir: result.outDir,
    builderSignals: result.builderSignals.length,
    summary: result.evidence.summary,
    topBuilders: result.builderSignals.slice(0, 10).map(row => ({ name: row.name, recentBuilds: row.recentBuilds, latest: row.recentPermits?.[0]?.issuedAt })),
  }, null, 2));
}
