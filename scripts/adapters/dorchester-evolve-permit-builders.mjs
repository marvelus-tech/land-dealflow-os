import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(repoRoot, 'data', 'real', 'dorchester-sc');
const MINIMUM_UNIQUE_BUILDERS = 20;
const PORTAL_URL = 'https://evolvepublic.infovisionsoftware.com/Dorchester/';
const SOURCE_URL = 'https://evolvepublic.infovisionsoftware.com/Dorchester/';

function compact(value) { return String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function decodeEntities(value) {
  return compact(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}
function slug(value) { return compact(value).toLowerCase().replace(/dba|aka|t\/a/gi, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function cleanName(value) {
  return compact(value)
    .replace(/\\+/g, ' / ')
    .replace(/^\b(?:RD|ROAD|AVE|AVENUE|LN|LANE|WAY|TRL|TRAIL|CT|COURT|CIR|CIRCLE|BLVD|HWY|HIGHWAY|RUN|TER|PASS|LNDG|LANDING|COVE|LOOP|PL|PLACE|ROW|BND|BEND|PATH|PKWY|MEADOW|BRIDGE)\b\s+/i, '')
    .replace(/^\bDR\b\s+(?!HORTON\b)/i, '')
    .replace(/\s+dba:?\s+/ig, ' dba ')
    .replace(/\s+/g, ' ')
    .trim();
}
function csvEscape(value) { const text = value === undefined || value === null ? '' : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function writeCsv(path, rows, headers) { writeFileSync(path, [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n')); }
function htmlFields(page) {
  const values = {};
  for (const match of page.matchAll(/<input[^>]*>/gi)) {
    const tag = match[0];
    const name = tag.match(/name="([^"]+)"/i)?.[1];
    if (!name) continue;
    values[name] = decodeEntities(tag.match(/value="([^"]*)"/i)?.[1] || '');
  }
  return values;
}
function formBody(fields) { return new URLSearchParams(fields).toString(); }
async function postForm(fields, cookie = '') {
  const response = await fetch(PORTAL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'Mozilla/5.0 LandDealflowOS/1.0',
      ...(cookie ? { cookie } : {}),
    },
    body: formBody(fields),
  });
  if (!response.ok) throw new Error(`Dorchester Evolve POST failed ${response.status}: ${await response.text()}`);
  return { text: await response.text(), cookie: response.headers.get('set-cookie') || cookie };
}
async function getHome() {
  const response = await fetch(PORTAL_URL, { headers: { 'user-agent': 'Mozilla/5.0 LandDealflowOS/1.0' } });
  if (!response.ok) throw new Error(`Dorchester Evolve GET failed ${response.status}: ${await response.text()}`);
  return { text: await response.text(), cookie: response.headers.get('set-cookie') || '' };
}
function stripHtml(value) { return decodeEntities(String(value || '').replace(/<[^>]+>/g, ' ')); }
function splitAddressAndContractor(value) {
  const text = compact(value);
  const suffix = '(?:RD|ROAD|DR|DRIVE|ST|STREET|AVE|AVENUE|LN|LANE|WAY|TRL|TRAIL|CT|COURT|CIR|CIRCLE|BLVD|BOULEVARD|HWY|HIGHWAY|RUN|TER|TERRACE|PASS|LNDG|LANDING|COVE|LOOP|PL|PLACE|ROW|BND|BEND|PATH|PKWY|PARKWAY|MEADOW|THRUST|FOREST|ACRES|BRIDGE)';
  const match = text.match(new RegExp(`^(.+?\\b${suffix}\\b(?:,\\s*[A-Z0-9-]+|\\s+(?:APT|UNIT|LOT|BLDG|BUILDING|#)\\s*[A-Z0-9-]+){0,2})\\s+(.+)$`, 'i'));
  if (!match) return { address: '', contractor: text };
  return { address: compact(match[1]), contractor: cleanName(match[2]) };
}
function parseRows(page) {
  const rows = [];
  for (const row of page.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => stripHtml(match[1]));
    if (cells.length < 2) continue;
    const recordType = compact(cells[0]);
    const detail = compact(cells[1]);
    const match = detail.match(/^(\d+) \(([^)]+)\) (.*?) Permit ID (\d+)$/);
    if (!match) continue;
    const [, permitNumber, statusRaw, middle, permitId] = match;
    const issuedAt = statusRaw.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1] || '';
    const status = compact(statusRaw.replace(/\d{1,2}\/\d{1,2}\/\d{4}/, ''));
    const { address, contractor } = splitAddressAndContractor(middle);
    rows.push({ recordType, permitNumber, permitId, status, issuedAt, address, contractor, rawDetail: detail, sourceUrl: `${SOURCE_URL}?permitId=${encodeURIComponent(permitId)}` });
  }
  return rows;
}
function isBuilderName(name) {
  const clean = cleanName(name);
  if (!clean || /^owner|homeowner|home$/i.test(clean)) return false;
  if (/\b(roof|roofing|hvac|electric|electrical|plumb|plumbing|mechanical|pool|spa|solar|foundation|propane|septic|fence|garage|door|irrigation|restoration|maintenance|home depot|lowe'?s|preferred home services|west shore home|erie home|mister sparky|service experts|mobile home mover|transport)\b/i.test(clean)) return false;
  return /\b(home|homes|builder|builders|build|construction|communities|residential|properties|development|d\.r\.? horton|dr horton|lennar|ryan homes|nvr|true homes|eastwood|center park|kh carolinas|mungo|ashton|pulte|centex|beazer|meritage|toll|ragland|lowcountry|coastal|custom homes|america'?s home place)\b/i.test(clean);
}
function confidenceFor(rows) {
  const issued = rows.filter(row => /issued|completed/i.test(row.status)).length;
  return Math.min(100, 48 + rows.length * 4 + Math.min(12, issued));
}
function normalizeDate(usDate) {
  const match = String(usDate || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  const [, m, d, y] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
function normalizeBuilder(name, rows) {
  const sorted = [...rows].sort((a, b) => new Date(normalizeDate(b.issuedAt)) - new Date(normalizeDate(a.issuedAt)) || Number(b.permitId) - Number(a.permitId));
  const sample = sorted[0] || {};
  const clean = cleanName(name);
  return {
    id: `dorchester-sc-builder-${slug(clean).slice(0, 52)}`,
    name: clean,
    market: 'dorchester-sc',
    state: 'SC',
    website: '',
    phone: '',
    email: '',
    contactName: clean,
    recentBuilds: rows.length,
    closeSpeedDays: '',
    maxPrice: '',
    buyBox: 'Public Dorchester County permit signal only. Call builder to capture Berkeley/Dorchester/Charleston-edge lot buy box, flood-zone constraints, utility/access requirements, max dirt price, close speed, and assignment-title tolerance before seller sourcing.',
    validationStatus: 'needs-call-confirmation',
    confidence: confidenceFor(rows),
    sourceUrl: PORTAL_URL,
    publicSource: 'Dorchester County Evolve Public permit search. Filtered to 2025 residential permit rows with builder-like contractor names; trades, roofing, pools, restoration, mobile-home moving, and big-box service permits excluded.',
    evidenceType: 'permitVerified active-builder signal',
    recentPermits: sorted.slice(0, 8).map(row => ({
      permitNumber: row.permitNumber,
      permitId: row.permitId,
      address: row.address,
      issuedAt: normalizeDate(row.issuedAt),
      status: row.status,
      recordType: row.recordType,
      sourceUrl: row.sourceUrl,
    })),
    acquisitionNotes: `Appears on ${rows.length} Dorchester County public residential permit rows in 2025. Latest sample ${sample.permitNumber || ''} at ${sample.address || 'address unavailable'} issued ${normalizeDate(sample.issuedAt)}.`,
  };
}

export async function buildDorchesterPermitBuilders({ startDate = '01/01/2025', endDate = '12/31/2025', minimumUniqueBuilders = MINIMUM_UNIQUE_BUILDERS } = {}) {
  mkdirSync(OUT_DIR, { recursive: true });
  let { text: page, cookie } = await getHome();
  let fields = htmlFields(page);
  ({ text: page, cookie } = await postForm({ ...fields, __EVENTTARGET: 'BL_Menu', __EVENTARGUMENT: '8' }, cookie));
  fields = htmlFields(page);
  ({ text: page, cookie } = await postForm({ ...fields, __EVENTTARGET: 'DL_SearchType', __EVENTARGUMENT: '', DL_SearchType: 'Date Range' }, cookie));
  fields = htmlFields(page);
  ({ text: page } = await postForm({ ...fields, __EVENTTARGET: '', __EVENTARGUMENT: '', DL_SearchType: 'Date Range', TB_SearchText1: startDate, TB_SearchText2: endDate, BT_Search: 'Search' }, cookie));

  const allRows = parseRows(page);
  const residentialRows = allRows.filter(row => row.recordType === 'R' && row.contractor && row.address);
  const groups = new Map();
  for (const row of residentialRows) {
    const name = cleanName(row.contractor);
    if (!isBuilderName(name)) continue;
    const key = slug(name);
    if (!groups.has(key)) groups.set(key, { name, rows: [] });
    groups.get(key).rows.push(row);
  }
  const builderSignals = [...groups.values()]
    .filter(group => group.rows.length >= 1)
    .map(group => normalizeBuilder(group.name, group.rows))
    .sort((a, b) => b.recentBuilds - a.recentBuilds || b.confidence - a.confidence || a.name.localeCompare(b.name))
    .slice(0, 80);
  if (builderSignals.length < minimumUniqueBuilders) throw new Error(`Dorchester permit-builder pull requires at least ${minimumUniqueBuilders} unique builders; found ${builderSignals.length}.`);

  const evidence = {
    market: 'Dorchester County / Charleston edge, SC',
    marketId: 'dorchester-sc',
    state: 'SC',
    generatedAt: new Date().toISOString(),
    source: { name: 'Dorchester County Evolve Public — Permit Search', portalUrl: PORTAL_URL, sourceUrl: SOURCE_URL, query: `Date Range ${startDate} to ${endDate}`, filter: 'recordType R + builder-like contractor names' },
    summary: { permitRowsSampled: allRows.length, residentialRows: residentialRows.length, uniqueBuilders: builderSignals.length, minimumUniqueBuilders, totalRecentBuildSignals: builderSignals.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0), filter: '2025 Dorchester residential permit rows, excluding trades/repair/service categories by contractor-name filter.' },
    countyHeat: {
      tier: 'SC coastal secondary market',
      thesis: 'Charleston builder pressure is expanding into Dorchester/Berkeley; Dorchester exposes a workable public permit search with contractor names, making it the first SC queue candidate to promote into buyer validation.',
      buyerBoxHypothesis: '0.5–1 acre Charleston-edge/Dorchester-Berkeley lots, avoid flood-zone/marsh risk, confirm utilities/access and commute-to-Charleston/submarket constraints by call.',
    },
    operatingRules: [
      'Contractor data is a permit-backed builder signal, not validated buyer demand until buy-box outreach is complete.',
      'Do not source SC sellers until builder geography, max price, flood-zone tolerance, utility/access criteria, close speed, and title/assignment constraints are captured.',
      'Berkeley County remains a watchlist candidate because its public builder portal is Cloudflare-challenged from this environment; do not fabricate Berkeley rows.',
    ],
  };
  writeFileSync(join(OUT_DIR, 'market_evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'builder_signals.json'), `${JSON.stringify(builderSignals, null, 2)}\n`);
  writeCsv(join(OUT_DIR, 'builder_validation_queue.csv'), builderSignals, ['id','name','market','state','recentBuilds','contactName','phone','email','validationStatus','confidence','sourceUrl','acquisitionNotes']);
  return { evidence, builderSignals, outDir: OUT_DIR };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildDorchesterPermitBuilders({
    startDate: process.env.DORCHESTER_START_DATE || '01/01/2025',
    endDate: process.env.DORCHESTER_END_DATE || '12/31/2025',
    minimumUniqueBuilders: Number(process.env.MINIMUM_UNIQUE_BUILDERS || MINIMUM_UNIQUE_BUILDERS),
  });
  console.log(JSON.stringify({ outDir: result.outDir, builderSignals: result.builderSignals.length, summary: result.evidence.summary, topBuilders: result.builderSignals.slice(0, 12).map(row => ({ name: row.name, recentBuilds: row.recentBuilds, latest: row.recentPermits?.[0]?.issuedAt })) }, null, 2));
}
