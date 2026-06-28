import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const OUT_DIR = join(ROOT, 'data/real/evansville-in');
const SERVICE = 'https://maps.evansvillegis.com/arcgis_server/rest/services/BC/BUILDING_COMMISSION_PERMITS/MapServer/0';
const QUERY_URL = `${SERVICE}/query`;
const SOURCE_MAP = 'https://www.arcgis.com/home/item.html?id=3d8b703a7c984249a9caf9c706b1e50d';
const SOURCE_DETAIL = 'https://maps.evansvillegis.com/arcgis_server/rest/services/BC/BUILDING_COMMISSION_PERMITS/MapServer/0';
const TODAY = new Date().toISOString().slice(0, 10);

const knownLastNames = new Set([
  'JAGOE', 'CLEMENTS', 'STERCHI', 'LANDRY', 'REINBRECHT', 'MURPHY', 'ELPERS', 'SMITH', 'CHAPMAN', 'DAUBY',
  'SPEARS', 'JOHNSTON', 'KASTER', 'STEVENS', 'LEONARD', 'HIRSCH', 'MATTINGLY', 'DUBORD', 'MILLER', 'ZEHNER',
  'CONTI', 'ODELL', 'SCHEU', 'CESSNA', 'BUCK', 'BASICH', 'DEUTSCH', 'MARTIN', 'CRAVENS', 'HAAS', 'BROWN',
  'TROUTMAN', 'DENTON', 'WILSON', 'BEAVEN', 'THOMPSON', 'THOMSPSON', 'KUNKEL', 'STOLL', 'BOND', 'GATES',
  'HAWES', 'WITTMER', 'WALKER', 'CHANDLER', 'POWELL', 'BAKER'
]);

function titleCaseName(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/\b[a-z]/g, c => c.toUpperCase())
    .replace(/\bIi\b/g, 'II')
    .replace(/\bIii\b/g, 'III')
    .replace(/\bJr\b/g, 'Jr')
    .replace(/\bLl?c\b/g, 'LLC');
}

function cleanName(input) {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

function canonicalParts(raw) {
  const cleaned = cleanName(raw).toUpperCase().replace(/\./g, '');
  if (!cleaned) return null;
  if (cleaned.includes(',')) {
    const [lastPart, firstPart] = cleaned.split(',', 2).map(s => s.trim());
    const firstTokens = firstPart.split(/\s+/).filter(Boolean);
    const first = firstTokens[0]?.length === 1 && firstTokens[1] ? firstTokens[1] : firstTokens[0] || '';
    const last = lastPart.split(/\s+/).filter(Boolean)[0] || '';
    return { first, last };
  }
  const tokens = cleaned.replace(/[^A-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens[0] === 'O' && tokens[1] === 'DELL') tokens.splice(0, 2, 'ODELL');
  if (tokens.length < 2) return { first: tokens[0], last: '' };
  if (knownLastNames.has(tokens[0]) && !knownLastNames.has(tokens[tokens.length - 1])) {
    return { first: tokens[1], last: tokens[0] };
  }
  return { first: tokens[0], last: tokens[tokens.length - 1] };
}

function canonicalKey(raw) {
  const parts = canonicalParts(raw);
  if (!parts?.first || !parts?.last) return cleanName(raw).toUpperCase().replace(/[^A-Z0-9]+/g, '-');
  return `${parts.first}-${parts.last}`.replace(/[^A-Z0-9]+/g, '-');
}

function canonicalDisplay(raw) {
  const parts = canonicalParts(raw);
  if (!parts?.first || !parts?.last) return titleCaseName(raw);
  return `${titleCaseName(parts.first)} ${titleCaseName(parts.last)}`;
}

function slug(input) {
  return String(input || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function dateFromEsri(ms) {
  if (!ms) return '';
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchAllPermits() {
  const where = "(UPPER(USER_Project_Activity) LIKE '%NEW SINGLE FAMILY%' OR UPPER(USER_Project_Activity) LIKE '%NEW TWO FAMILY%') AND USER_Application_Recv_d >= DATE '2024-01-01'";
  const params = new URLSearchParams({
    f: 'json',
    where,
    outFields: 'OBJECTID,USER_Project_Activity,USER_Location,USER_Subdivision,USER_Municipality,USER_Owner,USER_App_Status,USER_User_Status,USER_Application_Recv_d,USER_Contractor,USER_Permit_Number,USER_Project_Activity_Desc_Line_1,USER_Project_Activity_Desc_Line_2',
    returnGeometry: 'false',
    orderByFields: 'USER_Application_Recv_d DESC',
    resultRecordCount: '5000',
  });
  const response = await fetch(`${QUERY_URL}?${params}`);
  if (!response.ok) throw new Error(`ArcGIS query failed: ${response.status} ${response.statusText}`);
  const data = await response.json();
  if (data.error) throw new Error(`ArcGIS query error: ${JSON.stringify(data.error)}`);
  return data.features.map(f => f.attributes).filter(a => cleanName(a.USER_Contractor));
}

const permits = await fetchAllPermits();
const grouped = new Map();
for (const permit of permits) {
  const key = canonicalKey(permit.USER_Contractor);
  if (!grouped.has(key)) {
    grouped.set(key, {
      key,
      displayName: canonicalDisplay(permit.USER_Contractor),
      aliases: new Set(),
      permits: [],
    });
  }
  const group = grouped.get(key);
  group.aliases.add(cleanName(permit.USER_Contractor));
  group.permits.push(permit);
}

const groups = [...grouped.values()]
  .sort((a, b) => b.permits.length - a.permits.length || a.displayName.localeCompare(b.displayName))
  .slice(0, 30);

mkdirSync(OUT_DIR, { recursive: true });

const builderSignals = groups.map((group, index) => {
  const samples = group.permits.slice(0, 5).map(p => ({
    permitNumber: p.USER_Permit_Number || '',
    permitType: p.USER_Project_Activity || '',
    issueDate: dateFromEsri(p.USER_Application_Recv_d),
    status: p.USER_App_Status || p.USER_User_Status || '',
    address: p.USER_Location || '',
    subdivision: p.USER_Subdivision || '',
    jurisdiction: p.USER_Municipality || 'Evansville / Vanderburgh County',
    sourceObjectId: p.OBJECTID,
  }));
  const detailQuery = `${QUERY_URL}?f=json&where=${encodeURIComponent(`OBJECTID in (${samples.map(p => p.sourceObjectId).filter(Boolean).join(',') || '0'})`)}&outFields=*&returnGeometry=false`;
  const aliasList = [...group.aliases].sort();
  return {
    id: `evansville-arcgis-${slug(group.displayName)}`,
    name: group.displayName,
    builderName: group.displayName,
    market: 'evansville-in',
    marketLabel: 'Evansville / Vanderburgh County, IN',
    state: 'IN',
    website: '',
    contactPage: SOURCE_DETAIL,
    phone: '',
    email: '',
    acquisitionContactStatus: 'official permit contractor found; acquisition contact unknown; no outreach performed',
    recentBuilds: group.permits.length,
    qualifyingPermitCount: group.permits.length,
    validationStatus: 'permit-verified-needs-company-contact-enrichment',
    status: 'buyer-validation-candidate',
    confidence: Math.max(70, 95 - index),
    sourceUrl: SOURCE_DETAIL,
    sourceUrls: [SOURCE_MAP, SOURCE_DETAIL, detailQuery],
    evidenceType: 'City of Evansville / Vanderburgh County Building Commission ArcGIS permits; contractor field on new single-family/two-family dwelling permits',
    permitEvidence: samples,
    sourceEvidence: `${group.displayName} appears as the contractor name/alias (${aliasList.join('; ')}) on ${group.permits.length} public Building Commission new single-family/two-family dwelling permit records in Evansville/Vanderburgh County.`,
    evidenceFreshness: TODAY,
    notes: 'This is a stronger Indiana path than generic directory scraping because it is official permit activity with contractor fields. Contractor names are public permit names and may be licensed individuals/principals rather than final company DBA; enrich website/land-acquisition contact before outreach.',
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
  market: 'evansville-in',
  marketLabel: 'Evansville / Vanderburgh County, IN',
  state: 'IN',
  generatedAt: TODAY,
  sourcePath: {
    name: 'Evansville/Vanderburgh Building Commission ArcGIS permit layer',
    sourceUrls: [SOURCE_MAP, SOURCE_DETAIL],
    whyStrongerForIndiana: 'Official local government permit records expose USER_Contractor on new single-family/two-family dwelling permits. This avoids blocked/weak statewide licensing or association-directory paths and produces activity-backed builder candidates.',
    conversionMethod: "GET MapServer/0/query with where=(UPPER(USER_Project_Activity) LIKE '%NEW SINGLE FAMILY%' OR '%NEW TWO FAMILY%') AND USER_Application_Recv_d >= DATE '2024-01-01'; outFields include USER_Contractor, USER_Permit_Number, USER_Location, USER_App_Status, USER_Application_Recv_d; group by normalized contractor first/last aliases; sort by permit count; emit data/real/evansville-in/builder_signals.json and builder_validation_queue.csv.",
    caveat: 'Contractor field frequently stores licensed individual names, not company DBA names. Treat as permit-verified buyer discovery leads requiring company/contact enrichment; no outreach performed.',
  },
  recordCount: builderSignals.length,
  rawPermitCount: permits.length,
  fieldsUsed: ['USER_Project_Activity', 'USER_Contractor', 'USER_Permit_Number', 'USER_Location', 'USER_App_Status', 'USER_Application_Recv_d'],
};
writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(marketEvidence, null, 2)}\n`);

console.log(`Wrote ${builderSignals.length} Evansville/Vanderburgh permit-backed Indiana builder candidates from ${permits.length} qualifying permit records.`);
