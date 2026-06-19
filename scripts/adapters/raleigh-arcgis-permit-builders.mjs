import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(repoRoot, 'data', 'real', 'raleigh');
const MINIMUM_UNIQUE_BUILDERS = 20;
const SERVICE_URL = 'https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Building_Permits_Issued_Past_180_Days/FeatureServer/0';
const SOURCE_URL = 'https://data.wake.gov/maps/ral::building-permits';

function compact(value) { return String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function slug(value) { return compact(value).toLowerCase().replace(/t\/a|aka:|dba/gi, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function cleanName(value) { return compact(value).replace(/\s+T\/A\s+.*$/i, '').replace(/\s+AKA:\s+.*$/i, '').replace(/\s+DBA\s+.*$/i, '').trim(); }
function dateFromMs(value) { const n = Number(value || 0); return n ? new Date(n).toISOString().slice(0, 10) : ''; }
function money(value) { return Number(value || 0) || 0; }
function csvEscape(value) { const text = value === undefined || value === null ? '' : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function writeCsv(path, rows, headers) { writeFileSync(path, [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n')); }
function isBuilderName(name) {
  const clean = cleanName(name);
  if (!clean || /^owner|homeowner$/i.test(clean)) return false;
  if (/\b(pool|spa|roof|plumb|electric|mechanical|hvac|fence|retaining)\b/i.test(clean)) return false;
  return /\b(home|homes|builder|builders|build|construction|communities|residential|properties|development|toll|lennar|horton|kb|meritage|m\/i|stanley martin|caruso)\b/i.test(clean);
}
function permitScore(rows) { return Math.min(100, 48 + rows.length * 5 + (rows.some(row => row.contractoremail || row.contractorphone) ? 8 : 0)); }
function sourceFor(row) { return row.permitnum ? `${SOURCE_URL}?q=${encodeURIComponent(row.permitnum)}` : SOURCE_URL; }
function normalizeBuilder(name, rows) {
  const clean = cleanName(name);
  const sorted = [...rows].sort((a, b) => Number(b.issueddate || 0) - Number(a.issueddate || 0));
  const sample = sorted[0] || {};
  const recentPermits = sorted.slice(0, 5).map(row => ({
    permitNumber: compact(row.permitnum),
    address: compact(`${row.originaladdress1 || ''}${row.originaladdress2 ? `, ${row.originaladdress2}` : ''}`),
    issuedAt: dateFromMs(row.issueddate),
    permitValue: money(row.estprojectcost),
    permitClass: compact(row.permitclassmapped),
    workClass: compact(row.workclass),
    workClassMapped: compact(row.workclassmapped),
    landUse: compact(row.censuslanduse),
    housingUnits: Number(row.housingunitstotal || 0),
    description: compact(row.proposedworkdescription || row.description),
    sourceUrl: sourceFor(row),
  }));
  return {
    id: `raleigh-builder-${slug(clean).slice(0, 56)}`,
    name: clean,
    market: 'raleigh-nc',
    state: 'NC',
    website: '',
    phone: compact(sample.contractorphone),
    email: compact(sample.contractoremail),
    contactName: clean,
    recentBuilds: rows.length,
    closeSpeedDays: '',
    maxPrice: '',
    buyBox: 'Public Raleigh/Wake permit signal only. Call builder to capture exact Raleigh-Durham land buy box, max price, close speed, utility/access constraints, and kill criteria before treating as validated demand.',
    validationStatus: 'needs-call-confirmation',
    confidence: permitScore(rows),
    sourceUrl: SOURCE_URL,
    publicSource: 'City of Raleigh / Wake County Open Data ArcGIS Building Permits Issued Past 180 Days. Filtered to residential new building permits with dwelling/townhouse/duplex land-use classes.',
    evidenceType: 'permitVerified active-builder signal',
    recentPermits,
    acquisitionNotes: `Appears on ${rows.length} Raleigh/Wake public residential new-building permit rows in the past 180 days. Latest sample ${compact(sample.permitnum)} at ${compact(sample.originaladdress1)} issued ${dateFromMs(sample.issueddate)}.`,
  };
}
async function fetchArcgis(where, rowLimit) {
  const fields = ['permitnum','contractorcompanyname','contractoremail','contractorphone','issueddate','estprojectcost','housingunitstotal','originaladdress1','originaladdress2','originalcity','originalstate','originalzip','permitclassmapped','workclass','workclassmapped','description','proposedworkdescription','permittype','permittypemapped','censuslanduse','censuslandusecode'].join(',');
  const url = `${SERVICE_URL}/query?${new URLSearchParams({ f: 'json', where, outFields: fields, returnGeometry: 'false', orderByFields: 'issueddate DESC', resultRecordCount: String(rowLimit) })}`;
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 LandDealflowOS/1.0' } });
  if (!response.ok) throw new Error(`Raleigh ArcGIS query failed ${response.status}: ${await response.text()}`);
  const data = await response.json();
  if (data.error) throw new Error(`Raleigh ArcGIS query failed: ${JSON.stringify(data.error)}`);
  return (data.features || []).map(feature => feature.attributes || {});
}

export async function buildRaleighPermitBuilders({ rowLimit = 2000, minimumUniqueBuilders = MINIMUM_UNIQUE_BUILDERS } = {}) {
  mkdirSync(OUT_DIR, { recursive: true });
  const where = "permittypemapped='Building' AND permitclassmapped='Residential' AND (workclassmapped='New' OR workclass LIKE '%New%' OR workclass='Townhouse') AND contractorcompanyname IS NOT NULL AND originaladdress1 IS NOT NULL AND (censuslanduse LIKE '%DETACHED SINGLE FAMILY DWELLING%' OR censuslanduse LIKE '%RESIDENTIAL TOWNHOUSE%' OR censuslanduse LIKE '%TWO FAMILY BUILDING%')";
  const rows = await fetchArcgis(where, rowLimit);
  const groups = new Map();
  for (const row of rows) {
    const name = cleanName(row.contractorcompanyname);
    if (!isBuilderName(name)) continue;
    const key = slug(name);
    if (!groups.has(key)) groups.set(key, { name, rows: [] });
    groups.get(key).rows.push(row);
  }
  const builderSignals = [...groups.values()]
    .filter(group => group.rows.length >= 2)
    .map(group => normalizeBuilder(group.name, group.rows))
    .sort((a, b) => b.recentBuilds - a.recentBuilds || b.confidence - a.confidence || a.name.localeCompare(b.name))
    .slice(0, 50);
  if (builderSignals.length < minimumUniqueBuilders) throw new Error(`Raleigh permit-builder pull requires at least ${minimumUniqueBuilders} unique builders; found ${builderSignals.length}.`);
  const evidence = {
    market: 'Raleigh / Wake County, NC',
    marketId: 'raleigh-nc',
    state: 'NC',
    generatedAt: new Date().toISOString(),
    source: { name: 'Raleigh Open Data — Building Permits Issued Past 180 Days', serviceUrl: SERVICE_URL, sourceUrl: SOURCE_URL, where },
    summary: { permitRowsSampled: rows.length, uniqueBuilders: builderSignals.length, minimumUniqueBuilders, totalRecentBuildSignals: builderSignals.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0), filter: 'Residential building permits, new/townhouse work classes, detached SFR / townhouse / duplex land-use classes, past 180 days.' },
    operatingRules: ['Contractor data is a permit-backed builder signal, not validated buyer demand until buy-box outreach is complete.', 'Only residential new dwelling/townhouse/duplex land-use classes are included; additions, repairs, pools, trade permits, and retaining walls are excluded.', 'No NC seller sourcing until builder geography, max price, parcel criteria, close speed, and deal killers are captured.'],
  };
  writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'builder_signals.json'), `${JSON.stringify(builderSignals, null, 2)}\n`);
  writeCsv(join(OUT_DIR, 'builder_validation_queue.csv'), builderSignals, ['id','name','market','state','recentBuilds','contactName','phone','email','validationStatus','confidence','sourceUrl','acquisitionNotes']);
  return { evidence, builderSignals, outDir: OUT_DIR };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildRaleighPermitBuilders({ rowLimit: Number(process.env.RALEIGH_ROW_LIMIT || 2000) });
  console.log(JSON.stringify({ outDir: result.outDir, builderSignals: result.builderSignals.length, summary: result.evidence.summary, topBuilders: result.builderSignals.slice(0, 10).map(row => ({ name: row.name, recentBuilds: row.recentBuilds, latest: row.recentPermits?.[0]?.issuedAt })) }, null, 2));
}
