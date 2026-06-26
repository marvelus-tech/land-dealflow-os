import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(repoRoot, 'data', 'real', 'nashville');
const MINIMUM_UNIQUE_BUILDERS = 20;
const SERVICE_URL = 'https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Building_Permits_Issued_2/FeatureServer/0';
const SOURCE_URL = 'https://www.nashville.gov/departments/codes/codes-administration/public-records-and-data/daily-reports';
const EXPERIENCE_URL = 'https://experience.arcgis.com/experience/4aa2856cf64e412e812fda2a893291d7';

function compact(value) { return String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function slug(value) { return compact(value).toLowerCase().replace(/t\/a|aka:|dba/gi, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function cleanName(value) {
  return compact(value)
    .replace(/\s+\(see applicant information\)$/i, '')
    .replace(/^self contractor residential.*$/i, '')
    .replace(/\s+dba\s+/ig, ' DBA ')
    .trim();
}
function dateFromMs(value) { const n = Number(value || 0); return n ? new Date(n).toISOString().slice(0, 10) : ''; }
function money(value) { return Number(value || 0) || 0; }
function csvEscape(value) { const text = value === undefined || value === null ? '' : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function writeCsv(path, rows, headers) { writeFileSync(path, [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n')); }
function isBuilderName(name) {
  const clean = cleanName(name);
  if (!clean || /^owner|homeowner|self contractor|applicant$/i.test(clean)) return false;
  if (/\b(pool|pools|spa|shed|roof|roofing|plumb|plumbing|electric|electrical|mechanical|hvac|fence|solar|alarm|fire|septic|foundation|landscape|irrigation|deck|patio|garage door|lowe'?s|home depot|restoration|renovation)\b/i.test(clean)) return false;
  return /\b(home|homes|builder|builders|build|building|construction|communities|residential|properties|development|contractors|contracting|ventures|capital|holdings|group|partners|llc|inc|corp|company|d\.r\.? horton|dr horton|lennar|nvr|ryan homes|pulte|beazer|meritage|drees|ole south|regent|legacy south|century communities|m\/i|weekley|paran)\b/i.test(clean);
}
function permitScore(rows) { return Math.min(100, 50 + rows.length * 4); }
function permitQueryUrl(row) {
  const where = `Permit__ = '${String(row.Permit__ || '').replaceAll("'", "''")}'`;
  return `${SERVICE_URL}/query?${new URLSearchParams({ f: 'html', where, outFields: '*', returnGeometry: 'false' })}`;
}
function normalizeBuilder(name, rows) {
  const clean = cleanName(name);
  const sorted = [...rows].sort((a, b) => Number(b.Date_Issued || 0) - Number(a.Date_Issued || 0));
  const sample = sorted[0] || {};
  const recentPermits = sorted.slice(0, 8).map(row => ({
    permitNumber: compact(row.Permit__),
    address: compact(row.Address),
    city: compact(row.City),
    zip: compact(row.ZIP),
    issuedAt: dateFromMs(row.Date_Issued),
    permitValue: money(row.Const_Cost),
    permitType: compact(row.Permit_Type_Description),
    permitSubtype: compact(row.Permit_Subtype_Description),
    parcel: compact(row.Parcel),
    purpose: compact(row.Purpose),
    sourceUrl: permitQueryUrl(row),
  }));
  return {
    id: `nashville-builder-${slug(clean).slice(0, 54)}`,
    name: clean,
    market: 'nashville-edge-tn',
    state: 'TN',
    website: '',
    phone: '',
    email: '',
    contactName: clean,
    recentBuilds: rows.length,
    closeSpeedDays: '',
    maxPrice: '',
    buyBox: 'Public Metro Nashville/Davidson County residential new-building permit signal only. Call builder to capture exact Nashville-edge land buy box, lot size, max dirt price, close speed, utilities/access constraints, slope/flood/infill deal killers, and acquisitions contact before seller sourcing.',
    validationStatus: 'needs-call-confirmation',
    confidence: permitScore(rows),
    sourceUrl: SOURCE_URL,
    publicSource: 'Metro Nashville Codes Daily Reports live ArcGIS feed for Building Permits Issued. Filtered to Building Residential - New permits with builder-like contact names; self-contractor, accessory, trade, shed, pool, roofing, and service contractors excluded.',
    evidenceType: 'permitVerified active-builder signal',
    recentPermits,
    acquisitionNotes: `Appears on ${rows.length} Metro Nashville public residential new-building permit rows since 2025-01-01. Latest sample ${compact(sample.Permit__)} at ${compact(sample.Address)} issued ${dateFromMs(sample.Date_Issued)}.`,
  };
}
async function fetchArcgis(where, { pageSize = 1000, maxRows = 5000 } = {}) {
  const fields = ['Permit__','Permit_Type_Description','Permit_Subtype_Description','Parcel','Date_Issued','Const_Cost','Address','City','State','Contact','Purpose','ZIP'].join(',');
  const rows = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const url = `${SERVICE_URL}/query?${new URLSearchParams({ f: 'json', where, outFields: fields, returnGeometry: 'false', orderByFields: 'Date_Issued DESC', resultRecordCount: String(pageSize), resultOffset: String(offset) })}`;
    const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 LandDealflowOS/1.0' } });
    if (!response.ok) throw new Error(`Nashville ArcGIS query failed ${response.status}: ${await response.text()}`);
    const data = await response.json();
    if (data.error) throw new Error(`Nashville ArcGIS query failed: ${JSON.stringify(data.error)}`);
    const features = (data.features || []).map(feature => feature.attributes || {});
    rows.push(...features);
    if (!data.exceededTransferLimit || features.length < pageSize) break;
  }
  return rows;
}

export async function buildNashvillePermitBuilders({ minimumUniqueBuilders = MINIMUM_UNIQUE_BUILDERS } = {}) {
  mkdirSync(OUT_DIR, { recursive: true });
  const where = "Date_Issued >= DATE '2025-01-01' AND Permit_Type_Description='Building Residential - New' AND Contact IS NOT NULL AND Address IS NOT NULL";
  const rows = await fetchArcgis(where);
  const groups = new Map();
  for (const row of rows) {
    const name = cleanName(row.Contact);
    if (!isBuilderName(name)) continue;
    const key = slug(name);
    if (!groups.has(key)) groups.set(key, { name, rows: [] });
    groups.get(key).rows.push(row);
  }
  const builderSignals = [...groups.values()]
    .filter(group => group.rows.length >= 3)
    .map(group => normalizeBuilder(group.name, group.rows))
    .sort((a, b) => b.recentBuilds - a.recentBuilds || b.confidence - a.confidence || a.name.localeCompare(b.name))
    .slice(0, 80);
  if (builderSignals.length < minimumUniqueBuilders) throw new Error(`Nashville permit-builder pull requires at least ${minimumUniqueBuilders} unique builders; found ${builderSignals.length}.`);
  const evidence = {
    market: 'Nashville / Davidson County, TN',
    marketId: 'nashville-edge-tn',
    state: 'TN',
    generatedAt: new Date().toISOString(),
    source: { name: 'Metro Nashville Codes Daily Reports — Building Permits Issued ArcGIS feed', serviceUrl: SERVICE_URL, sourceUrl: SOURCE_URL, experienceUrl: EXPERIENCE_URL, where },
    summary: { permitRowsSampled: rows.length, uniqueBuilders: builderSignals.length, minimumUniqueBuilders, totalRecentBuildSignals: builderSignals.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0), filter: 'Metro Nashville Building Residential - New permits issued since 2025-01-01; builder-like contacts only; requires 3+ permit rows per builder signal.' },
    operatingRules: [
      'Contractor/contact data is a permit-backed active-builder signal, not validated buyer demand until buy-box outreach is complete.',
      'Only Metro Nashville Building Residential - New issued permits are counted; self-contractor, accessory, shed, pool, trade, roofing, and service contractor rows are excluded.',
      'No Davidson County seller sourcing until builder geography, lot size, max price, close speed, utilities/access, slope/flood/infill deal killers, and acquisitions recipient are captured.',
    ],
  };
  writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'builder_signals.json'), `${JSON.stringify(builderSignals, null, 2)}\n`);
  writeCsv(join(OUT_DIR, 'builder_validation_queue.csv'), builderSignals, ['id','name','market','state','recentBuilds','contactName','phone','email','validationStatus','confidence','sourceUrl','acquisitionNotes']);
  return { evidence, builderSignals, outDir: OUT_DIR };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildNashvillePermitBuilders({ minimumUniqueBuilders: Number(process.env.MINIMUM_UNIQUE_BUILDERS || MINIMUM_UNIQUE_BUILDERS) });
  console.log(JSON.stringify({ outDir: result.outDir, builderSignals: result.builderSignals.length, summary: result.evidence.summary, topBuilders: result.builderSignals.slice(0, 12).map(row => ({ name: row.name, recentBuilds: row.recentBuilds, latest: row.recentPermits?.[0]?.issuedAt })) }, null, 2));
}
