import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

function asArray(value) { return Array.isArray(value) ? value : []; }
function todayStamp(now = new Date().toISOString()) { return String(now).slice(0, 10); }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }

const VOLATILE_KEYS = new Set(['runId', 'generatedAt', 'collectedAt', 'sequence', 'nextFollowUp']);
const QUEUE_LABELS = {
  topSellerCalls: 'New seller calls',
  offerReady: 'New offer-ready deals',
  skipTrace: 'New skip-trace owners',
  buyerValidation: 'New buyer-validation tasks',
  buyerDiscovery: 'New-area buyer discovery',
  sellerDiscovery: 'New-area seller discovery',
  sourceCandidates: 'New source candidates',
};
const PRIORITY_STATE_ORDER = ['TN', 'FL', 'AZ', 'NC', 'TX'];

function stableClone(value) {
  if (Array.isArray(value)) return value.map(stableClone);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (VOLATILE_KEYS.has(key)) continue;
      if (key === 'briefing') continue;
      out[key] = stableClone(value[key]);
    }
    return out;
  }
  return value;
}

function rowKey(row = {}) {
  return [
    row.queue,
    row.leadId,
    row.parcelId,
    row.buyerId,
    row.id,
    row.market,
    row.state,
    row.address,
    row.ownerName,
    row.name,
    row.platform,
    row.sourceType,
    row.url,
    row.title,
    row.task,
  ].filter(Boolean).map(value => String(value).trim().toLowerCase()).join('|') || slug(JSON.stringify(stableClone(row)));
}

function sortRows(rows) {
  return asArray(rows).map(stableClone).sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
}

function substantivePayload(latest = {}) {
  const snapshot = latest.snapshot || {};
  const queues = latest.queues || {};
  const normalizedQueues = {};
  for (const key of Object.keys(queues).sort()) normalizedQueues[key] = sortRows(queues[key]);
  return {
    markets: sortRows(snapshot.markets),
    buyers: sortRows(snapshot.buyers),
    parcels: sortRows(snapshot.parcels),
    sourceCandidates: sortRows(snapshot.sourceCandidates),
    queues: normalizedQueues,
  };
}

export function leadEngineFingerprint(latest = {}) {
  const canonical = JSON.stringify(substantivePayload(latest));
  return createHash('sha256').update(canonical).digest('hex');
}

function indexRows(rows) {
  return new Map(sortRows(rows).map(row => [rowKey(row), row]));
}

function newRows(previousRows, nextRows) {
  const previous = indexRows(previousRows);
  return sortRows(nextRows).filter(row => !previous.has(rowKey(row)));
}

function stateRank(row = {}) {
  const state = String(row.state || '').toUpperCase();
  const fromMarket = String(row.market || '').toLowerCase();
  const inferred = state || (fromMarket.includes('knox') || fromMarket.includes('-tn') ? 'TN' : fromMarket.includes('polk') ? 'FL' : fromMarket.includes('maricopa') ? 'AZ' : fromMarket.includes('raleigh') ? 'NC' : fromMarket.includes('austin') || fromMarket.includes('san-antonio') ? 'TX' : '');
  const index = PRIORITY_STATE_ORDER.indexOf(inferred);
  return index === -1 ? PRIORITY_STATE_ORDER.length : index;
}

function prioritySort(rows) {
  return [...asArray(rows)].sort((a, b) => stateRank(a) - stateRank(b) || rowKey(a).localeCompare(rowKey(b)));
}

function describeRow(row = {}) {
  if (row.address || row.ownerName) {
    return `${row.market || row.state || 'market'} — ${row.address || 'address unknown'} — ${row.ownerName || 'owner unknown'}${row.confidence ? ` — confidence ${row.confidence}` : ''}`;
  }
  if (row.name) {
    return `${row.market || row.state || 'market'} — ${row.name} — ${row.task || row.validationStatus || row.website || 'validate'}`;
  }
  if (row.title || row.platform) {
    return `${row.market || row.state || 'market'} — ${row.platform || 'source'}/${row.sourceType || 'unknown'} — ${row.title || row.url || 'untitled source'}${row.confidence ? ` — confidence ${row.confidence}` : ''}`;
  }
  return `${row.market || row.state || 'market'} — ${row.task || row.reason || rowKey(row)}`;
}

export function buildLeadEngineDelta(previousLatest, nextLatest, { now = nextLatest?.generatedAt || nextLatest?.snapshot?.generatedAt || new Date().toISOString() } = {}) {
  const previousFingerprint = previousLatest ? leadEngineFingerprint(previousLatest) : '';
  const nextFingerprint = leadEngineFingerprint(nextLatest || {});
  const unchanged = Boolean(previousLatest) && previousFingerprint === nextFingerprint;
  const previousQueues = previousLatest?.queues || {};
  const nextQueues = nextLatest?.queues || {};
  const previousSnapshot = previousLatest?.snapshot || {};
  const nextSnapshot = nextLatest?.snapshot || {};
  const deltas = {
    topSellerCalls: newRows(previousQueues.topSellerCalls, nextQueues.topSellerCalls),
    offerReady: newRows(previousQueues.offerReady, nextQueues.offerReady),
    skipTrace: newRows(previousQueues.skipTrace, nextQueues.skipTrace),
    buyerValidation: newRows(previousQueues.buyerValidation, nextQueues.buyerValidation),
    buyerDiscovery: newRows(previousQueues.buyerDiscovery, nextQueues.buyerDiscovery),
    sellerDiscovery: newRows(previousQueues.sellerDiscovery, nextQueues.sellerDiscovery),
    sourceCandidates: newRows(previousSnapshot.sourceCandidates, nextSnapshot.sourceCandidates),
  };
  const totalNew = Object.values(deltas).reduce((sum, rows) => sum + rows.length, 0);
  return { unchanged, previousFingerprint, nextFingerprint, totalNew, deltas };
}

export function buildDeltaBriefing(previousLatest, nextLatest, options = {}) {
  const delta = buildLeadEngineDelta(previousLatest, nextLatest, options);
  if (delta.unchanged || delta.totalNew === 0) return '';
  const nextSnapshot = nextLatest?.snapshot || {};
  const nextQueues = nextLatest?.queues || {};
  const lines = [
    `Lead Engine Delta — ${todayStamp(options.now || nextLatest?.generatedAt || nextSnapshot.generatedAt)}`,
    '',
    `New items found: ${delta.totalNew}`,
    `Markets watched: ${asArray(nextSnapshot.markets).map(m => `${m.name || m.id}${m.state ? ` (${m.state})` : ''}`).join(', ') || 'none'}`,
    `Backlog after update: ${asArray(nextQueues.skipTrace).length} skip-trace, ${asArray(nextQueues.buyerValidation).length} buyer-validation, ${asArray(nextQueues.topSellerCalls).length} seller-calls, ${asArray(nextQueues.offerReady).length} offer-ready`,
    '',
  ];
  for (const key of ['topSellerCalls', 'offerReady', 'skipTrace', 'buyerValidation', 'sourceCandidates', 'buyerDiscovery', 'sellerDiscovery']) {
    const rows = prioritySort(delta.deltas[key]);
    if (!rows.length) continue;
    lines.push(`${QUEUE_LABELS[key]} (${rows.length})`);
    lines.push(...rows.slice(0, 8).map((row, index) => `${index + 1}. ${describeRow(row)}`));
    if (rows.length > 8) lines.push(`…and ${rows.length - 8} more.`);
    lines.push('');
  }
  lines.push('Rule: this message is delta-only; unchanged backlog is suppressed.');
  return `${lines.join('\n').trim()}\n`;
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const previousPath = process.argv[2];
  const nextPath = process.argv[3];
  if (!nextPath) {
    console.error('Usage: node scripts/lead-engine-delta.mjs <previous-latest.json> <next-latest.json>');
    process.exit(2);
  }
  const previous = readJson(previousPath);
  const next = readJson(nextPath);
  process.stdout.write(buildDeltaBriefing(previous, next));
}
