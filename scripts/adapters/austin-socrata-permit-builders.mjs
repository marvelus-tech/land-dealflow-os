import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(repoRoot, 'data', 'real', 'austin');
const MINIMUM_UNIQUE_BUILDERS = 20;
const DATASET_ID = 'hw8f-smxh';
const SOURCE_URL = `https://data.austintexas.gov/resource/${DATASET_ID}.json`;
const HUMAN_URL = `https://data.austintexas.gov/d/${DATASET_ID}`;

function qs(params) { return new URLSearchParams(params).toString(); }
function compact(value) { return String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function slug(value) { return compact(value).toLowerCase().replace(/\*+main\*+/gi, '').replace(/\(main\)/gi, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function money(value) { return Number(value || 0); }
function isoDate(value) { return compact(value).slice(0, 10); }
function cleanCompany(value) {
  return compact(value)
    .replace(/\*+\s*MAIN\s*\*+/gi, '')
    .replace(/\(MAIN\)/gi, '')
    .replace(/\s+dba\s+/gi, ' DBA ')
    .replace(/\s+/g, ' ')
    .trim();
}
function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function writeCsv(path, rows, headers) {
  writeFileSync(path, [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n'));
}
function isUsableBuilderName(name) {
  const clean = cleanCompany(name);
  if (!clean || /^N\/?A$/i.test(clean) || /^Owner$/i.test(clean)) return false;
  return /\b(HOME|HOMES|BUILD|BUILDER|BUILDERS|CONSTRUCTION|COMMUNITIES|RESIDENTIAL|PROPERTIES|DEVELOPMENT|HABITAT|PULTE|D R HORTON|MERITAGE|TAYLOR MORRISON|WEEKLEY|PERRY|HIGHLAND|KB)\b/i.test(clean);
}
function permitScore(rows) {
  const totalValue = rows.reduce((sum, row) => sum + money(row.total_job_valuation), 0);
  const latestYear = Math.max(...rows.map(row => Number(isoDate(row.issue_date).slice(0, 4)) || 0));
  return Math.min(100, 48 + rows.length * 5 + (totalValue >= 500000 ? 8 : 0) + (latestYear >= 2026 ? 8 : 0));
}
function permitLink(row) {
  return row?.link?.url || (row?.project_id ? `https://abc.austintexas.gov/web/permit/public-search-other?t_detail=1&t_selected_folderrsn=${encodeURIComponent(row.project_id)}` : HUMAN_URL);
}
function normalizeBuilder(name, rows) {
  const cleanName = cleanCompany(name);
  const sorted = [...rows].sort((a, b) => String(b.issue_date || '').localeCompare(String(a.issue_date || '')));
  const sample = sorted[0] || {};
  const recentPermits = sorted.slice(0, 5).map(row => ({
    permitNumber: compact(row.permit_number),
    projectId: compact(row.project_id),
    address: compact(row.permit_location || row.original_address1),
    issuedAt: isoDate(row.issue_date),
    permitValue: money(row.total_job_valuation),
    permitClass: compact(row.permit_class),
    workClass: compact(row.work_class),
    housingUnits: Number(row.housing_units || 0),
    description: compact(row.description),
    sourceUrl: permitLink(row),
  }));
  return {
    id: `austin-builder-${slug(cleanName).slice(0, 56)}`,
    name: cleanName,
    market: 'austin-tx',
    state: 'TX',
    website: '',
    phone: '',
    email: '',
    contactName: compact(sample.contractor_full_name),
    contactPhone: compact(sample.contractor_phone),
    recentBuilds: rows.length,
    closeSpeedDays: '',
    maxPrice: '',
    buyBox: 'Public Austin Socrata permit signal only. Call builder to capture exact Austin-area land buy box, max price, close speed, utility/access constraints, and kill criteria before treating as validated demand.',
    validationStatus: 'needs-call-confirmation',
    confidence: permitScore(rows),
    sourceUrl: HUMAN_URL,
    publicSource: 'City of Austin Open Data / Socrata Issued Construction Permits dataset. Filtered to recent residential new construction building permits.',
    evidenceType: 'permitVerified active-builder signal',
    recentPermits,
    acquisitionNotes: `Appears on ${rows.length} Austin public residential new-construction permit rows since 2025. Latest sample ${compact(sample.permit_number)} at ${compact(sample.permit_location || sample.original_address1)} issued ${isoDate(sample.issue_date)}.`,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 LandDealflowOS/1.0' } });
  if (!response.ok) throw new Error(`Austin Socrata query failed ${response.status}: ${await response.text()}`);
  const data = await response.json();
  if (data.error) throw new Error(`${data.message || data.error}: ${data.description || ''}`);
  return data;
}

export async function buildAustinPermitBuilders({ rowLimit = 5000, since = '2025-01-01T00:00:00', minimumUniqueBuilders = MINIMUM_UNIQUE_BUILDERS } = {}) {
  mkdirSync(OUT_DIR, { recursive: true });
  const where = [
    "permittype='BP'",
    "permit_class_mapped='Residential'",
    "work_class='New'",
    "housing_units > 0",
    `issue_date >= '${since}'`,
    "(permit_class='R- 101 Single Family Houses' OR permit_class='R- 103 Two Family Bldgs' OR permit_class='R- 102 Secondary Apartment')",
  ].join(' AND ');
  const outFields = [
    'permit_number','project_id','permit_class_mapped','permit_class','work_class','description','permit_location','original_address1','original_city','original_state','original_zip','issue_date','calendar_year_issued','total_job_valuation','housing_units','contractor_company_name','contractor_full_name','contractor_phone','link'
  ].join(',');
  const rows = await fetchJson(`${SOURCE_URL}?${qs({
    '$select': outFields,
    '$where': where,
    '$order': 'issue_date DESC',
    '$limit': String(rowLimit),
  })}`);
  const groups = new Map();
  for (const row of rows) {
    const name = cleanCompany(row.contractor_company_name || row.contractor_full_name);
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
    throw new Error(`Austin permit-builder pull requires at least ${minimumUniqueBuilders} unique builders; found ${builderSignals.length}. Tighten/expand Socrata source query before rendering this market.`);
  }
  const evidence = {
    market: 'Austin, TX',
    marketId: 'austin-tx',
    state: 'TX',
    generatedAt: new Date().toISOString(),
    source: {
      name: 'City of Austin Open Data — Issued Construction Permits',
      datasetId: DATASET_ID,
      sourceUrl: HUMAN_URL,
      apiUrl: SOURCE_URL,
      where,
    },
    summary: {
      permitRowsSampled: rows.length,
      uniqueBuilders: builderSignals.length,
      minimumUniqueBuilders,
      totalRecentBuildSignals: builderSignals.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0),
      filter: 'Residential building permits, New work class, one or more housing units, SFR / two-family / secondary apartment classes, issued since 2025-01-01.',
    },
    operatingRules: [
      'Permit contractors are buyer-validation candidates, not validated buyers, until buy box/contact is confirmed.',
      'Austin contact_phone may be a permit applicant/contractor phone; treat it as public permit context, not a verified sales/acquisitions line.',
      'No pool/accessory-structure contractors are included in this market batch.',
      'Do not promote seller sourcing until builder geography, lot size, max price, close speed, package recipient, and kill criteria are captured.',
    ],
  };
  writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'builder_signals.json'), `${JSON.stringify(builderSignals, null, 2)}\n`);
  writeCsv(join(OUT_DIR, 'builder_validation_queue.csv'), builderSignals, ['id','name','market','state','recentBuilds','contactName','contactPhone','validationStatus','confidence','sourceUrl','acquisitionNotes']);
  return { evidence, builderSignals, outDir: OUT_DIR };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildAustinPermitBuilders({
    rowLimit: Number(process.env.AUSTIN_ROW_LIMIT || 5000),
    since: process.env.AUSTIN_PERMIT_SINCE || '2025-01-01T00:00:00',
  });
  console.log(JSON.stringify({
    outDir: result.outDir,
    builderSignals: result.builderSignals.length,
    summary: result.evidence.summary,
    topBuilders: result.builderSignals.slice(0, 10).map(row => ({ name: row.name, recentBuilds: row.recentBuilds, latest: row.recentPermits?.[0]?.issuedAt })),
  }, null, 2));
}
