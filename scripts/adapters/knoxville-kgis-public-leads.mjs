import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(repoRoot, 'data', 'real', 'knoxville');
const SOURCE_PATH = resolve(repoRoot, 'data', 'sources.json');

export const KGIS_SOURCES = {
  buildingPermits: 'https://services8.arcgis.com/Ty9G85JMF2cDHlRt/arcgis/rest/services/BuildingPermits/FeatureServer/0',
  developmentProjects: 'https://services1.arcgis.com/QWaOgwdmpqI9HUzf/arcgis/rest/services/DevelopmentProjects/FeatureServer/0',
  categoricalParcels: 'https://services1.arcgis.com/QWaOgwdmpqI9HUzf/arcgis/rest/services/Categorical_Zoning_Changes/FeatureServer/0',
  zoning: 'https://services1.arcgis.com/QWaOgwdmpqI9HUzf/arcgis/rest/services/KnoxvilleKnoxCountyZoning/FeatureServer/2',
};

function qs(params) { return new URLSearchParams({ f: 'json', returnGeometry: 'false', ...params }).toString(); }
async function query(serviceUrl, params) {
  const response = await fetch(`${serviceUrl}/query?${qs(params)}`, { headers: { 'user-agent': 'Mozilla/5.0 LandDealflowOS/1.0' } });
  if (!response.ok) throw new Error(`KGIS ArcGIS query failed ${response.status} for ${serviceUrl}`);
  const data = await response.json();
  if (data.error) throw new Error(`${data.error.message}: ${(data.error.details || []).join('; ')}`);
  return data;
}
function attrs(data) { return (data.features || []).map(feature => feature.attributes || {}); }
function compact(value) { return String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function slug(value) { return compact(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function money(value) { return Number(value || 0); }
function dateIso(ms) { return Number(ms) ? new Date(Number(ms)).toISOString().slice(0, 10) : ''; }
function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function writeCsv(path, rows, headers) {
  writeFileSync(path, [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n'));
}
function upsertSource(sources, bucket, source) {
  sources[bucket] = Array.isArray(sources[bucket]) ? sources[bucket] : [];
  const index = sources[bucket].findIndex(item => item.id === source.id);
  if (index >= 0) sources[bucket][index] = source;
  else sources[bucket].push(source);
}
function isBuilderLike(name) {
  return /\b(CONSTRUCTION|HOMES?|BUILDERS?|DEVELOP(?:MENT|ER)?|PROPERTIES|GROUP|LLC|INC|CORP|REALTY|INVEST|RESTORATION|CONTRACT(?:OR|ING)?)\b/i.test(compact(name));
}
function isInstitutionalOwner(name) {
  return /\b(CITY OF|COUNTY|STATE OF|UNITED STATES|USA|UNIVERSITY|SCHOOL|BOARD OF EDUCATION|HOUSING AUTHORITY|KNOXVILLE UTILITIES|KUB|CHURCH|MINISTR(?:Y|IES)|BAPTIST|METHODIST|PRESBYTERIAN|CATHOLIC|EPISCOPAL|CEMETERY|RAILROAD|AIRPORT AUTHORITY)\b/i.test(compact(name));
}
function permitScore(rows) {
  const residentialNew = rows.filter(row => /new/i.test(compact(row.CLASSWORK)) && /single family|dwelling|residential|sfr/i.test(`${row.LANDUSE || ''} ${row.DESCRIPTION || ''} ${row.PERMITTYPE || ''}`)).length;
  const totalValue = rows.reduce((sum, row) => sum + money(row.PERMITVALUE), 0);
  return Math.min(100, 45 + rows.length * 8 + residentialNew * 4 + (totalValue >= 500000 ? 8 : 0));
}

export function normalizePermitBuilder(name, rows) {
  const cleanName = compact(name);
  const sorted = [...rows].sort((a, b) => Number(b.DATEISSUED || 0) - Number(a.DATEISSUED || 0));
  const sample = sorted[0] || {};
  const recentPermits = sorted.slice(0, 5).map(row => ({
    permitNumber: compact(row.PERMITNUMBER),
    parcelId: compact(row.PARCELID),
    address: compact(row.ADDRESS),
    issuedAt: dateIso(row.DATEISSUED),
    permitValue: money(row.PERMITVALUE),
    workClass: compact(row.CLASSWORK),
    landUse: compact(row.LANDUSE),
    sourceUrl: KGIS_SOURCES.buildingPermits,
  }));
  return {
    id: `knoxville-builder-${slug(cleanName).slice(0, 48)}`,
    name: cleanName,
    market: 'knoxville-tn',
    state: 'TN',
    website: '',
    phone: '',
    email: '',
    contactName: '',
    recentBuilds: rows.length,
    closeSpeedDays: '',
    maxPrice: '',
    buyBox: 'Public KGIS permit signal only. Call contractor/developer to capture exact lot buy box, max price, close speed, and kill criteria before treating as validated demand.',
    validationStatus: 'needs-call-confirmation',
    confidence: permitScore(rows),
    sourceUrl: KGIS_SOURCES.buildingPermits,
    publicSource: 'Knoxville/Knox County public building permits via ArcGIS BuildingPermits_postJan2021 layer.',
    evidenceType: 'permitVerified active-builder signal',
    recentPermits,
    acquisitionNotes: `Appears on ${rows.length} Knoxville/Knox public building permit rows. Latest sample ${compact(sample.PERMITNUMBER)} at ${compact(sample.ADDRESS)} issued ${dateIso(sample.DATEISSUED)}.`,
  };
}

export function normalizeCategoricalParcel(row) {
  const parcelId = compact(row.PARCELID || row.BASE_PARCELID || row.OBJECTID);
  const mailingStreet = compact(`${row.MAIL_HOUSE_NUMBER || ''} ${row.MAIL_STREET_NAME || ''} ${row.MAIL_STREET_EXTRA || ''}`);
  const ownerMailingAddress = compact(`${mailingStreet}, ${row.MAIL_CITY || ''} ${row.MAIL_STATE || ''} ${row.MAIL_ZIP_CODE || ''}`.replace(/^,\s*/, ''));
  const acres = Math.round(Number(row.PreUnionAcres || 0) * 1000) / 1000;
  const zoningChange = compact(`${row.Zone2019 || 'unknown'} → ${row.Zone2020 || 'unknown'}`);
  return {
    parcelId,
    address: parcelId ? `KGIS parcel ${parcelId}, Knoxville, TN` : 'KGIS parcel, Knoxville, TN',
    market: 'knoxville-tn',
    state: 'TN',
    lotSize: acres ? `${acres} ac` : '',
    lotSizeAcres: acres || '',
    ownerName: compact(row.OWNER),
    ownerPhone: '',
    ownerEmail: '',
    ownerMailingAddress,
    askingPrice: '',
    assessedLandValue: '',
    buyerMaxPrice: '',
    roadAccess: 'unknown',
    utilities: 'unknown',
    wetlands: 'unknown',
    floodZone: 'unknown',
    slope: 'unknown',
    wildlifeFlag: false,
    sourceUrl: KGIS_SOURCES.categoricalParcels,
    publicSource: 'KGIS Categorical Zoning Changes FeatureServer parcel-owner/zoning layer. Use for parcel research and skip trace only; no phone/email exposed.',
    confidence: Math.min(92, 50 + (parcelId ? 12 : 0) + (compact(row.OWNER) ? 12 : 0) + (ownerMailingAddress ? 8 : 0) + (acres ? 8 : 0)),
    crmStatus: 'Needs skip trace',
    zoningChange,
    notes: `REAL PUBLIC KGIS RECORD. Parcel has categorical zoning change ${zoningChange}; owner/mailing present but no phone/email. Verify situs/land use/buildability before seller outreach.`,
  };
}

export function normalizeDevelopmentProject(row) {
  return {
    id: `knoxville-project-${slug(row.PROJECT || row.OBJECTID).slice(0, 48)}`,
    project: compact(row.PROJECT),
    type: compact(row.TYPE),
    market: 'knoxville-tn',
    state: 'TN',
    address: compact(row.MPC_ADDRESS || row.LOCATION),
    parcelId: compact(row.TAX_ID),
    owner: compact(row.OWNER),
    developer: compact(row.DEVELOPER),
    contractor: compact(row.CONTRACTOR),
    contactName: compact(row.CONTACT_NAME),
    contactPhone: compact(row.CONTACT_PHONE),
    units: row.UNITS || '',
    parcelSize: row.PARCEL_SIZE || '',
    cost: row.COST || '',
    status: compact(row.STATUS),
    stage: compact(row.STAGE),
    sourceUrl: KGIS_SOURCES.developmentProjects,
    publicSource: 'KGIS Groundbreakers / DevelopmentProjects public layer. Buyer/developer demand evidence only; not a seller lead.',
  };
}

async function count(serviceUrl, where) {
  return (await query(serviceUrl, { where, returnCountOnly: 'true' })).count || 0;
}

export async function buildKnoxvilleKgisPublicLeads({ permitLimit = 1000, parcelLimit = 100, projectLimit = 100, updateSources = true } = {}) {
  mkdirSync(OUT_DIR, { recursive: true });
  const permitWhere = "RESNONRES='Res' AND CLASSWORK='New' AND (LANDUSE LIKE '%Single Family%' OR DESCRIPTION LIKE '%Dwelling%' OR PERMITTYPE='SFR')";
  const permitRows = attrs(await query(KGIS_SOURCES.buildingPermits, {
    where: permitWhere,
    outFields: 'PERMITNUMBER,PARCELID,PERMITVALUE,DESCRIPTION,PERMITTYPE,CLASSWORK,LANDUSE,ADDRESS,SECTOR,RESNONRES,DATEISSUED,OWNER,CONTRACTOR',
    orderByFields: 'DATEISSUED DESC',
    resultRecordCount: String(permitLimit),
  }));
  const groups = new Map();
  for (const row of permitRows) {
    const name = compact(row.CONTRACTOR || row.OWNER);
    if (!name || !isBuilderLike(name)) continue;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(row);
  }
  const builderSignals = [...groups.entries()]
    .filter(([, rows]) => rows.length >= 2)
    .map(([name, rows]) => normalizePermitBuilder(name, rows))
    .sort((a, b) => b.recentBuilds - a.recentBuilds || b.confidence - a.confidence || a.name.localeCompare(b.name))
    .slice(0, 30);

  const parcelWhere = "OWNER IS NOT NULL AND PARCELID IS NOT NULL AND PreUnionAcres BETWEEN 0.1 AND 5";
  const parcelRows = attrs(await query(KGIS_SOURCES.categoricalParcels, {
    where: parcelWhere,
    outFields: 'OBJECTID,BASE_PARCELID,PARCELID,PreUnionAcres,PreUnionSqFt,PercentInConflict,NumCategoricalChanges,Zone2019,Zone2020,DATE_PURCHASED,MAIL_HOUSE_NUMBER,MAIL_UNIT,MAIL_STREET_NAME,MAIL_STREET_EXTRA,MAIL_CITY,MAIL_STATE,MAIL_ZIP_CODE,MAIL_COUNTRY,OWNER',
    orderByFields: 'PreUnionAcres ASC',
    resultRecordCount: String(parcelLimit),
  }));
  const parcelResearch = parcelRows
    .map(normalizeCategoricalParcel)
    .filter(row => row.parcelId && row.ownerName && !isInstitutionalOwner(row.ownerName))
    .sort((a, b) => b.confidence - a.confidence || Number(a.lotSizeAcres || 999) - Number(b.lotSizeAcres || 999));

  const projects = attrs(await query(KGIS_SOURCES.developmentProjects, {
    where: "1=1",
    outFields: 'OBJECTID,PROJECT,TYPE,LOCATION,MPC_ADDRESS,TAX_ID,OWNER,DEVELOPER,CONTRACTOR,CONTACT_NAME,CONTACT_PHONE,UNITS,PARCEL_SIZE,COST,STATUS,STAGE',
    orderByFields: 'OBJECTID DESC',
    resultRecordCount: String(projectLimit),
  })).map(normalizeDevelopmentProject);

  const evidence = {
    market: 'Knoxville, TN',
    generatedAt: new Date().toISOString(),
    sources: KGIS_SOURCES,
    confidenceSurface: {
      singleFamilyNewPermitRowsSampled: permitRows.length,
      activeBuilderSignals: builderSignals.length,
      categoricalParcelRows: parcelResearch.length,
      developmentProjectRows: projects.length,
      publicPermitRowCount: await count(KGIS_SOURCES.buildingPermits, permitWhere),
      publicCategoricalParcelCount: await count(KGIS_SOURCES.categoricalParcels, parcelWhere),
    },
    operatingRules: [
      'Permit contractors are buyer-validation candidates, not validated buyers, until buy box/contact is confirmed.',
      'Categorical zoning parcel records are skip-trace/research candidates only; they do not enter seller calls without phone/email and buildability checks.',
      'No KGIS row is fabricated; all normalized rows carry sourceUrl/publicSource provenance.',
    ],
  };

  writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'builder_signals.json'), `${JSON.stringify(builderSignals, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'parcel_research.json'), `${JSON.stringify(parcelResearch, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'development_projects.json'), `${JSON.stringify(projects, null, 2)}\n`);
  writeCsv(join(OUT_DIR, 'builder_validation_queue.csv'), builderSignals, ['id', 'name', 'recentBuilds', 'phone', 'website', 'buyBox', 'validationStatus', 'confidence', 'acquisitionNotes']);
  writeCsv(join(OUT_DIR, 'parcel_skiptrace_research_queue.csv'), parcelResearch, ['parcelId', 'market', 'ownerName', 'ownerMailingAddress', 'lotSize', 'confidence', 'zoningChange', 'notes']);

  if (updateSources) {
    const sources = JSON.parse(readFileSync(SOURCE_PATH, 'utf8'));
    upsertSource(sources, 'buyerSources', {
      id: 'knoxville-kgis-permit-builder-signals-2026',
      market: 'knoxville-tn',
      state: 'TN',
      type: 'public-permit-builder-signal',
      cadence: 'weekly',
      sourceUrl: KGIS_SOURCES.buildingPermits,
      description: 'KGIS/Knoxville public building permit contractor signals. Buyer-validation only until buy box/contact confirmed.',
      records: builderSignals,
    });
    upsertSource(sources, 'parcelSources', {
      id: 'knoxville-kgis-categorical-parcel-research-2026',
      market: 'knoxville-tn',
      state: 'TN',
      type: 'public-parcel-research',
      cadence: 'weekly',
      sourceUrl: KGIS_SOURCES.categoricalParcels,
      description: 'KGIS categorical zoning parcel-owner records. Skip-trace/research queue only; no seller calls without enriched contact and buildability verification.',
      records: parcelResearch,
    });
    writeFileSync(SOURCE_PATH, `${JSON.stringify(sources, null, 2)}\n`);
  }
  return { evidence, builderSignals, parcelResearch, projects, outDir: OUT_DIR };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildKnoxvilleKgisPublicLeads({
    permitLimit: Number(process.env.PERMIT_LIMIT || 1000),
    parcelLimit: Number(process.env.PARCEL_LIMIT || 100),
    projectLimit: Number(process.env.PROJECT_LIMIT || 100),
    updateSources: !process.argv.includes('--no-update-sources'),
  });
  console.log(JSON.stringify({
    outDir: result.outDir,
    builderSignals: result.builderSignals.length,
    parcelResearch: result.parcelResearch.length,
    developmentProjects: result.projects.length,
    confidenceSurface: result.evidence.confidenceSurface,
  }, null, 2));
}
