import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const OUT_DIR = join(ROOT, 'data/real/lafayette-in');
const SERVICE = 'https://maps.tippecanoe.in.gov/server/rest/services/Hosted/BuildingPermits_Adr/FeatureServer/0';
const QUERY_URL = `${SERVICE}/query`;
const SOURCE_ITEM = 'https://maps.tippecanoe.in.gov/portal/home/item.html?id=58e527cb3a8840c4a1303c7c3ae7df69';
const TODAY = new Date().toISOString().slice(0, 10);

function cleanName(input) {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

function titleCaseName(input) {
  return cleanName(input)
    .toLowerCase()
    .replace(/\b[a-z]/g, c => c.toUpperCase())
    .replace(/\bLlc\b/g, 'LLC')
    .replace(/\bInc\b/g, 'Inc.')
    .replace(/\bIi\b/g, 'II')
    .replace(/\bIii\b/g, 'III');
}

function slug(input) {
  return String(input || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'unknown';
}

function dateFromEsri(ms) {
  if (!ms) return '';
  return new Date(ms).toISOString().slice(0, 10);
}

function isLikelyBuilderName(name) {
  const value = cleanName(name).toUpperCase();
  return /\b(LLC|INC|HOMES?|BUILD|CONSTRUCT|DEVELOP|DEVELOPMENT|HABITAT|FOUNDATION|LAND|COMMONS|PROPERTIES|INVESTMENTS?|PLACE|PARTNERS?|CUSTOM)\b/.test(value);
}

function canonicalKey(raw) {
  return cleanName(raw).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'UNKNOWN';
}

async function queryPermits(where) {
  const params = new URLSearchParams({
    f: 'json',
    where,
    outFields: 'objectid,date,permit,address,city,owner,description,parcel,year',
    returnGeometry: 'false',
    orderByFields: 'date DESC',
    resultRecordCount: '5000',
  });
  const response = await fetch(`${QUERY_URL}?${params}`);
  if (!response.ok) throw new Error(`Tippecanoe ArcGIS query failed: ${response.status} ${response.statusText}`);
  const data = await response.json();
  if (data.error) throw new Error(`Tippecanoe ArcGIS query error: ${JSON.stringify(data.error)}`);
  return (data.features || []).map(feature => feature.attributes || {});
}

const where = "date >= DATE '2024-01-01' AND (UPPER(description) LIKE '%NEW SINGLE%' OR UPPER(description) LIKE '%NEW RESID%' OR UPPER(description) LIKE '%NEW RESIDENCE%' OR UPPER(description) LIKE '%NEW BUILD%')";
const permits = (await queryPermits(where)).filter(row => cleanName(row.owner));
const grouped = new Map();

for (const permit of permits) {
  const owner = cleanName(permit.owner);
  const key = canonicalKey(owner);
  if (!grouped.has(key)) {
    grouped.set(key, {
      key,
      displayName: titleCaseName(owner),
      rawNames: new Set(),
      permits: [],
      builderLike: isLikelyBuilderName(owner),
    });
  }
  const group = grouped.get(key);
  group.rawNames.add(owner);
  group.permits.push(permit);
  group.builderLike = group.builderLike || isLikelyBuilderName(owner);
}

const groups = [...grouped.values()]
  .sort((a, b) => Number(b.builderLike) - Number(a.builderLike) || b.permits.length - a.permits.length || a.displayName.localeCompare(b.displayName))
  .slice(0, 30);

mkdirSync(OUT_DIR, { recursive: true });

const builderSignals = groups.map((group, index) => {
  const samples = group.permits.slice(0, 5).map(row => ({
    permitNumber: row.permit || '',
    permitType: row.description || '',
    issueDate: dateFromEsri(row.date),
    status: row.year ? String(row.year) : '',
    address: row.address || '',
    city: row.city || '',
    parcel: row.parcel || '',
    sourceObjectId: row.objectid,
  }));
  const ids = samples.map(row => row.sourceObjectId).filter(Boolean).join(',') || '0';
  const detailQuery = `${QUERY_URL}?f=json&where=${encodeURIComponent(`objectid in (${ids})`)}&outFields=*&returnGeometry=false`;
  const caveat = group.builderLike
    ? 'Owner/developer name on official new-build permit rows; enrich company/contact and confirm buy box before seller sourcing.'
    : 'Owner name on official new-build permit rows; may be end-owner rather than builder. Use only as buyer-validation/source-discovery lead until contractor/company identity is confirmed.';
  return {
    id: `lafayette-tippecanoe-${slug(group.displayName)}`,
    name: group.displayName,
    builderName: group.displayName,
    market: 'lafayette-in',
    marketLabel: 'Lafayette / Tippecanoe County, IN',
    state: 'IN',
    website: '',
    contactPage: SERVICE,
    phone: '',
    email: '',
    acquisitionContactStatus: 'official permit owner/developer signal found; contractor/acquisition contact unknown; no outreach performed',
    recentBuilds: group.permits.length,
    qualifyingPermitCount: group.permits.length,
    validationStatus: group.builderLike ? 'permit-owner-developer-signal-needs-contact-enrichment' : 'permit-owner-signal-needs-builder-confirmation',
    status: 'buyer-validation-candidate',
    confidence: Math.max(58, Math.min(86, 70 + Math.min(10, group.permits.length) + (group.builderLike ? 6 : -8) - Math.floor(index / 6))),
    sourceUrl: SERVICE,
    sourceUrls: [SOURCE_ITEM, SERVICE, detailQuery],
    evidenceType: 'Tippecanoe County GIS official BuildingPermits_Adr ArcGIS layer; owner/developer field on new residential/new-build permit rows',
    permitEvidence: samples,
    sourceEvidence: `${group.displayName} appears as owner/developer on ${group.permits.length} public Lafayette/Tippecanoe new residential/new-build permit record(s). Raw owner aliases: ${[...group.rawNames].sort().join('; ')}.`,
    evidenceFreshness: TODAY,
    notes: caveat,
  };
});

writeFileSync(join(OUT_DIR, 'builder_signals.json'), `${JSON.stringify(builderSignals, null, 2)}\n`);

const csvEscape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
const csvRows = [
  ['builderName', 'market', 'state', 'recentBuilds', 'phone', 'email', 'website', 'contactPage', 'confidence', 'validationStatus', 'sourceUrl', 'notes'],
  ...builderSignals.map(row => [row.builderName, row.market, row.state, row.recentBuilds, row.phone, row.email, row.website, row.contactPage, row.confidence, row.validationStatus, row.sourceUrl, row.notes]),
];
writeFileSync(join(OUT_DIR, 'builder_validation_queue.csv'), `${csvRows.map(row => row.map(csvEscape).join(',')).join('\n')}\n`);

const marketEvidence = {
  market: 'lafayette-in',
  marketLabel: 'Lafayette / Tippecanoe County, IN',
  state: 'IN',
  generatedAt: TODAY,
  sourcePath: {
    name: 'Tippecanoe County GIS BuildingPermits_Adr ArcGIS FeatureServer',
    sourceUrls: [SOURCE_ITEM, SERVICE],
    conversionMethod: "GET FeatureServer/0/query where=date >= DATE '2024-01-01' and description contains new single/new resid/new build; group by owner/developer because contractor fields are not exposed in the public layer; emit buyer-validation candidates with explicit owner/developer caveat.",
    caveat: 'The public layer exposes owner, permit, address, parcel, date, city, and description but not contractor/builder contact fields. These are official permit-backed buyer/developer/source-discovery signals, not validated buyers; company/contact/buy-box enrichment is required before seller sourcing.',
  },
  recordCount: builderSignals.length,
  rawPermitCount: permits.length,
  fieldsUsed: ['owner', 'permit', 'address', 'city', 'description', 'parcel', 'date', 'year'],
  minimumUniqueSignals: 20,
};
writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(marketEvidence, null, 2)}\n`);

console.log(`Wrote ${builderSignals.length} Lafayette/Tippecanoe permit-backed buyer/developer signals from ${permits.length} qualifying permit rows.`);
