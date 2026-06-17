import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(repoRoot, 'data', 'real', 'lehigh');
const SOURCE_PATH = resolve(repoRoot, 'data', 'sources.json');
const SERVICE = 'https://services1.arcgis.com/nRHtyn3uE1kyzoYc/arcgis/rest/services/FDORCadastral_SouthDistrict/FeatureServer/0/query';
const SOURCE_URL = 'https://services1.arcgis.com/nRHtyn3uE1kyzoYc/arcgis/rest/services/FDORCadastral_SouthDistrict/FeatureServer/0';

function qs(params) { return new URLSearchParams({ f: 'json', returnGeometry: 'false', ...params }).toString(); }
async function query(params) {
  const response = await fetch(`${SERVICE}?${qs(params)}`);
  if (!response.ok) throw new Error(`Lee County ArcGIS query failed ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`${data.error.message}: ${(data.error.details || []).join('; ')}`);
  return data;
}
function attrs(data) { return (data.features || []).map(feature => feature.attributes || {}); }
function money(value) { return Number(value || 0); }
function acres(sqft) { return Math.round((Number(sqft || 0) / 43560) * 1000) / 1000; }
function compact(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
function slug(value) { return compact(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
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
function sellerScore(row) {
  let score = 55;
  const lotAcres = acres(row.LND_SQFOOT);
  if (lotAcres >= 0.22 && lotAcres <= 0.32) score += 12;
  if (money(row.JV) >= 12000 && money(row.JV) <= 30000) score += 10;
  if (compact(row.OWN_STATE) && compact(row.OWN_STATE) !== 'FL') score += 9;
  if (compact(row.OWN_CITY).toUpperCase() !== 'LEHIGH ACRES') score += 6;
  if (money(row.SALE_YR1) === 0 || money(row.SALE_YR1) < 2018) score += 4;
  return Math.min(100, score);
}
function normalizeSeller(row) {
  const lotAcres = acres(row.LND_SQFOOT);
  const siteAddress = compact(`${row.PHY_ADDR1 || ''} ${row.PHY_CITY || 'LEHIGH ACRES'}, FL`);
  const ownerMailingAddress = compact(`${row.OWN_ADDR1 || ''} ${row.OWN_ADDR2 || ''}, ${row.OWN_CITY || ''} ${row.OWN_STATE || ''} ${row.OWN_ZIPCD || ''}`.replace(' ,', ','));
  return {
    parcelId: row.PARCEL_ID,
    address: siteAddress,
    market: 'lehigh',
    lotSize: `${lotAcres} ac`,
    lotSizeAcres: lotAcres,
    ownerName: compact(row.OWN_NAME),
    ownerPhone: '',
    ownerEmail: '',
    ownerMailingAddress,
    askingPrice: money(row.JV),
    assessedLandValue: money(row.LND_VAL || row.JV),
    lowestActiveListing: 42000,
    buyerMaxPrice: 42000,
    heldYears: money(row.SALE_YR1) ? Math.max(0, new Date().getFullYear() - money(row.SALE_YR1)) : 20,
    paid: money(row.SALE_PRC1),
    roadAccess: true,
    utilities: 'unknown',
    wetlands: 'unknown',
    floodZone: 'unknown',
    slope: 'flat',
    wildlifeFlag: false,
    sourceUrl: SOURCE_URL,
    publicSource: 'Florida Department of Revenue statewide cadastral via ArcGIS; Lee County parcels filtered to Lehigh Acres vacant residential lots.',
    confidence: sellerScore(row),
    crmStatus: 'Needs skip trace',
    nextFollowUp: new Date().toISOString().slice(0, 10),
    notes: `REAL PUBLIC LEAD. No phone from public parcel source. Lot ${lotAcres} ac; DOR use ${row.DOR_UC}; assessed JV ${money(row.JV)}; absentee mailing city ${compact(row.OWN_CITY)} ${compact(row.OWN_STATE)}. Skip trace before calling.`,
  };
}
function builderScore(count) { return Math.min(100, 40 + count * 7); }
function normalizeBuilder(name, rows) {
  const sample = rows[0] || {};
  return {
    id: `lehigh-builder-${slug(name).slice(0, 40)}`,
    name: compact(name),
    website: '',
    phone: '',
    email: '',
    contactName: '',
    recentBuilds: rows.length,
    closeSpeedDays: '',
    repeatDemand: Math.min(10, Math.max(1, Math.round(rows.length / 2))),
    maxPrice: 42000,
    buyBox: 'Public builder signal from Lehigh Acres parcels with 2023+ actual year built; call to confirm exact buy box before relying on this buyer.',
    validationStatus: 'needs-call-confirmation',
    confidence: builderScore(rows.length),
    market: 'lehigh',
    sourceUrl: SOURCE_URL,
    acquisitionNotes: `Appears on ${rows.length} Lehigh Acres 2023+ built parcels in FDOR cadastral data. Sample parcel ${sample.PARCEL_ID || ''} at ${sample.PHY_ADDR1 || ''}. Find phone/site and validate buy box.`,
  };
}
async function count(where) { return (await query({ where, returnCountOnly: 'true' })).count || 0; }
async function stats(where) {
  const outStatistics = JSON.stringify([
    { statisticType: 'count', onStatisticField: 'PARCEL_ID', outStatisticFieldName: 'n' },
    { statisticType: 'avg', onStatisticField: 'JV', outStatisticFieldName: 'avg_jv' },
    { statisticType: 'avg', onStatisticField: 'LND_SQFOOT', outStatisticFieldName: 'avg_sqft' },
  ]);
  return attrs(await query({ where, outStatistics }))[0] || {};
}
export async function buildLehighRealLeads({ sellerLimit = 50, builderSample = 2000, updateSources = true } = {}) {
  mkdirSync(OUT_DIR, { recursive: true });
  const lehigh = "CO_NO=46 AND UPPER(PHY_CITY)='LEHIGH ACRES'";
  const vacant = `${lehigh} AND DOR_UC='000' AND NO_BULDNG=0`;
  const standardVacant = `${vacant} AND LND_SQFOOT BETWEEN 9000 AND 16000 AND JV BETWEEN 12000 AND 45000`;
  const sellerWhere = `${standardVacant} AND OWN_NAME IS NOT NULL AND PHY_ADDR1 IS NOT NULL AND UPPER(OWN_CITY)<>'LEHIGH ACRES'`;
  const evidence = {
    market: 'Lehigh Acres, FL',
    source: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    confidenceSurface: {
      totalLehighParcels: await count(lehigh),
      vacantResidentialParcels: await count(vacant),
      standardVacantInfillLots: await count(standardVacant),
      newBuildParcels2023Plus: await count(`${lehigh} AND ACT_YR_BLT>=2023 AND NO_BULDNG>=1`),
      absenteeStandardVacantLots: await count(sellerWhere),
      vacantStats: await stats(vacant),
      standardVacantStats: await stats(standardVacant),
    },
    whyChosen: [
      'Large public inventory of vacant residential Lehigh Acres parcels.',
      'Highly standardized quarter-acre infill-lot pattern suitable for repeatable filtering.',
      'Visible 2023+ new-build activity in the same public cadastral source.',
      'Many absentee owners with public mailing addresses, which creates a practical skip-trace/call workflow.',
    ],
  };
  const sellerRows = attrs(await query({
    where: sellerWhere,
    outFields: 'PARCEL_ID,PHY_ADDR1,PHY_ADDR2,PHY_CITY,OWN_NAME,OWN_ADDR1,OWN_ADDR2,OWN_CITY,OWN_STATE,OWN_ZIPCD,DOR_UC,JV,LND_VAL,SALE_PRC1,SALE_YR1,LND_SQFOOT,NO_BULDNG,ACT_YR_BLT',
    orderByFields: 'JV ASC',
    resultRecordCount: String(sellerLimit),
  })).map(normalizeSeller).sort((a, b) => b.confidence - a.confidence || a.askingPrice - b.askingPrice);
  const builderRows = attrs(await query({
    where: `${lehigh} AND ACT_YR_BLT>=2023 AND NO_BULDNG>=1`,
    outFields: 'OWN_NAME,OWN_ADDR1,OWN_CITY,OWN_STATE,PARCEL_ID,PHY_ADDR1,ACT_YR_BLT,JV,LND_VAL,TOT_LVG_AR',
    orderByFields: 'ACT_YR_BLT DESC',
    resultRecordCount: String(builderSample),
  }));
  const groups = new Map();
  for (const row of builderRows) {
    const name = compact(row.OWN_NAME);
    if (!name) continue;
    if (!/LLC|INC|HOMES|BUILD|CONSTRUCTION|PROPERTIES|INVEST|GROUP|DEVELOP|REALTY|CORP|LAND|HOLDING/i.test(name)) continue;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(row);
  }
  const builderSignals = [...groups.entries()].map(([name, rows]) => normalizeBuilder(name, rows)).sort((a, b) => b.recentBuilds - a.recentBuilds || a.name.localeCompare(b.name)).slice(0, 25);
  writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'seller_leads.json'), `${JSON.stringify(sellerRows, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'builder_signals.json'), `${JSON.stringify(builderSignals, null, 2)}\n`);
  writeCsv(join(OUT_DIR, 'seller_skiptrace_queue.csv'), sellerRows, ['parcelId', 'address', 'ownerName', 'ownerMailingAddress', 'lotSize', 'askingPrice', 'assessedLandValue', 'buyerMaxPrice', 'confidence', 'crmStatus', 'notes']);
  writeCsv(join(OUT_DIR, 'builder_validation_queue.csv'), builderSignals, ['id', 'name', 'recentBuilds', 'phone', 'website', 'maxPrice', 'buyBox', 'validationStatus', 'confidence', 'acquisitionNotes']);
  if (updateSources) {
    const sources = JSON.parse(readFileSync(SOURCE_PATH, 'utf8'));
    upsertSource(sources, 'buyerSources', { id: 'lehigh-builder-signals-fdor-2025', market: 'lehigh', type: 'public-cadastral-builder-signal', cadence: 'weekly', sourceUrl: SOURCE_URL, records: builderSignals });
    upsertSource(sources, 'parcelSources', { id: 'lehigh-public-vacant-parcels-fdor-2025', market: 'lehigh', type: 'public-cadastral', cadence: 'weekly', sourceUrl: SOURCE_URL, records: sellerRows });
    writeFileSync(SOURCE_PATH, `${JSON.stringify(sources, null, 2)}\n`);
  }
  return { evidence, sellerRows, builderSignals, outDir: OUT_DIR };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildLehighRealLeads({
    sellerLimit: Number(process.env.SELLER_LIMIT || 50),
    builderSample: Number(process.env.BUILDER_SAMPLE || 2000),
    updateSources: !process.argv.includes('--no-update-sources'),
  });
  console.log(JSON.stringify({
    outDir: result.outDir,
    sellers: result.sellerRows.length,
    builderSignals: result.builderSignals.length,
    confidenceSurface: result.evidence.confidenceSurface,
  }, null, 2));
}
