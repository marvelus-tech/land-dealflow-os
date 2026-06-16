import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDealFitMatrix, buildTopCallList, exportParcelsCsv, reportMissingData, scoreParcelDeal } from '../src/core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function asArray(value) { return Array.isArray(value) ? value : []; }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function todayStamp(now = new Date().toISOString()) { return String(now).slice(0, 10); }
function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function writeJson(path, data) { writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`); }

export function loadLeadSources(input = resolve(repoRoot, 'data', 'sources.json')) {
  const sources = typeof input === 'string' ? JSON.parse(readFileSync(input, 'utf8')) : input;
  const loaded = {
    version: sources.version || 1,
    targetMarkets: asArray(sources.targetMarkets),
    buyerSources: asArray(sources.buyerSources),
    parcelSources: asArray(sources.parcelSources),
  };
  if (!loaded.targetMarkets.length) throw new Error('Lead engine requires at least one target market');
  if (!loaded.buyerSources.length) throw new Error('Lead engine requires at least one buyer source');
  if (!loaded.parcelSources.length) throw new Error('Lead engine requires at least one parcel source');
  return loaded;
}

function collectSeedRecords(sources, sourceType, now) {
  return sources.flatMap(source => asArray(source.records).map((record, index) => ({
    ...record,
    market: record.market || source.market,
    sourceId: source.id,
    sourceType,
    sourceAdapter: source.type || 'seed',
    cadence: source.cadence || 'manual',
    collectedAt: now,
    sequence: index + 1,
  })));
}

export function generateLeadEngineSnapshot(inputSources, { runId = `lead-engine-${Date.now()}`, now = new Date().toISOString() } = {}) {
  const sources = loadLeadSources(inputSources);
  const markets = sources.targetMarkets.map((market, index) => ({
    leadId: `market:${market.id || slug(market.name)}`,
    score: Math.min(100, 50 + Number(market.priority || 0) * 5 + (market.thesis ? 8 : 0) + (market.buyerType ? 7 : 0)),
    ...market,
    rank: index + 1,
    collectedAt: now,
  }));
  const buyers = collectSeedRecords(sources.buyerSources, 'buyer', now).map((buyer, index) => ({
    leadId: `buyer:${buyer.market || 'any'}:${slug(buyer.name || index)}`,
    validationStatus: buyer.validationStatus || (buyer.exactBuyBox || buyer.buyBox ? 'needs-call-confirmation' : 'new'),
    confidence: Math.min(100, 35 + Number(buyer.recentBuilds || 0) + (buyer.phone ? 10 : 0) + (buyer.website ? 10 : 0) + (buyer.exactBuyBox ? 20 : 0)),
    ...buyer,
  }));
  const parcels = collectSeedRecords(sources.parcelSources, 'parcel', now).map((parcel, index) => ({
    leadId: `parcel:${parcel.market || 'any'}:${parcel.parcelId || slug(parcel.address || index)}`,
    crmStatus: parcel.crmStatus || 'Generated lead',
    nextFollowUp: parcel.nextFollowUp || todayStamp(now),
    sourceScore: Math.min(100, 40 + (parcel.ownerPhone || parcel.ownerEmail ? 15 : 0) + (parcel.roadAccess === true ? 10 : 0) + (parcel.wetlands === false ? 10 : 0) + (parcel.askingPrice ? 10 : 0) + (parcel.lowestActiveListing ? 10 : 0)),
    ...parcel,
  }));
  return { runId, generatedAt: now, markets, buyers, parcels, sourceSummary: { markets: markets.length, buyers: buyers.length, parcels: parcels.length } };
}

function toQueueRows(rows, headers) {
  return [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n');
}

export function buildLeadQueues(snapshot) {
  const buyers = asArray(snapshot.buyers).map(buyer => ({ id: buyer.id || slug(buyer.name), ...buyer }));
  const parcels = asArray(snapshot.parcels).map((parcel, index) => ({ id: parcel.id || parcel.parcelId || `generated-${index}`, buyerId: parcel.buyerId || buyers.find(b => b.market === parcel.market)?.id, ...parcel }));
  const scored = parcels.map(parcel => ({ ...parcel, ...scoreParcelDeal(parcel) }));
  const builtCalls = buildTopCallList({ parcels: scored, buyers, limit: 25 }).map(item => ({ queue: 'top_seller_calls', ...item }));
  const fallbackCalls = scored
    .filter(parcel => parcel.ownerName && (parcel.ownerPhone || parcel.ownerEmail) && parcel.risk?.status !== 'Kill')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 25)
    .map((parcel, index) => ({ queue: 'top_seller_calls', callPriority: index + 1, parcelId: parcel.parcelId || parcel.id, address: parcel.address, ownerName: parcel.ownerName, ownerPhone: parcel.ownerPhone || '', ownerEmail: parcel.ownerEmail || '', score: parcel.score, action: parcel.action, askingPrice: parcel.askingPrice, buyerMaxPrice: parcel.buyerMaxPrice }));
  const topSellerCalls = builtCalls.length ? builtCalls : fallbackCalls;
  const missingData = reportMissingData(scored).rows.map(item => ({ queue: 'missing_data', ...item, parcelId: item.id, missing: item.missing.join('|') }));
  const fitMatrix = buildDealFitMatrix(scored, buyers);
  const buyerValidation = buyers
    .filter(buyer => !buyer.exactBuyBox || !buyer.phone || buyer.validationStatus !== 'validated')
    .map(buyer => ({ buyerId: buyer.id, name: buyer.name, market: buyer.market, phone: buyer.phone || '', website: buyer.website || '', task: buyer.exactBuyBox ? 'validate proof/close speed' : 'capture exact buy box', confidence: buyer.confidence || 0 }));
  const riskBlocked = scored.filter(parcel => parcel.risk?.status === 'Kill' || parcel.roadAccess === false || parcel.wetlands === true).map(parcel => ({ parcelId: parcel.parcelId || parcel.id, address: parcel.address, reason: parcel.risk?.reason || 'buildability risk', market: parcel.market }));
  const offerReady = scored.filter(parcel => parcel.ownerName && (parcel.ownerPhone || parcel.ownerEmail) && parcel.risk?.status !== 'Kill' && Number(parcel.buyerMaxPrice || 0) > Number(parcel.askingPrice || 0)).map(parcel => ({ parcelId: parcel.parcelId || parcel.id, address: parcel.address, ownerName: parcel.ownerName, ownerPhone: parcel.ownerPhone || '', askingPrice: parcel.askingPrice || '', buyerMaxPrice: parcel.buyerMaxPrice || '', score: parcel.score }));
  return { topSellerCalls, buyerValidation, missingData, riskBlocked, offerReady, fitMatrix: fitMatrix.slice(0, 50) };
}

export function buildOperatorBriefing(snapshot, queues) {
  const lines = [
    `# Lead Engine Briefing — ${todayStamp(snapshot.generatedAt)}`,
    '',
    `Run: ${snapshot.runId}`,
    '',
    `- Markets watched: ${snapshot.markets.length}`,
    `- Buyer leads: ${snapshot.buyers.length}`,
    `- Parcel leads: ${snapshot.parcels.length}`,
    `- Top seller calls: ${queues.topSellerCalls.length}`,
    `- Buyer validation tasks: ${queues.buyerValidation.length}`,
    `- Offer-ready deals: ${queues.offerReady.length}`,
    `- Missing-data blockers: ${queues.missingData.length}`,
    '',
    '## Top seller calls',
    ...queues.topSellerCalls.slice(0, 10).map((item, index) => `${index + 1}. ${item.address} — ${item.ownerName || 'owner'} — ${item.ownerPhone || item.ownerEmail || 'needs contact'} — score ${item.score}`),
    '',
    '## Buyer validation tasks',
    ...queues.buyerValidation.slice(0, 10).map((item, index) => `${index + 1}. ${item.name} — ${item.task} — ${item.phone || item.website || 'find contact'}`),
    '',
    '## Offer-ready deals',
    ...queues.offerReady.slice(0, 10).map((item, index) => `${index + 1}. ${item.address} — ask ${item.askingPrice || 'unknown'} — max ${item.buyerMaxPrice || 'unknown'}`),
  ];
  return { markdown: `${lines.join('\n')}\n`, counts: { markets: snapshot.markets.length, buyers: snapshot.buyers.length, parcels: snapshot.parcels.length, topSellerCalls: queues.topSellerCalls.length, offerReady: queues.offerReady.length } };
}

export function writeLeadEngineOutputs({ snapshot, queues, outputDir = resolve(repoRoot, 'data', 'generated') }) {
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(join(outputDir, 'queues'), { recursive: true });
  const briefing = buildOperatorBriefing(snapshot, queues);
  const latest = { snapshot, queues, briefing, generatedAt: snapshot.generatedAt };
  const files = [];
  const jsonPath = join(outputDir, 'latest.json');
  writeJson(jsonPath, latest); files.push(jsonPath);
  const briefingPath = join(outputDir, 'briefing.md');
  writeFileSync(briefingPath, briefing.markdown); files.push(briefingPath);
  const queuesPath = join(outputDir, 'queues.json');
  writeJson(queuesPath, queues); files.push(queuesPath);
  const topCsv = join(outputDir, 'queues', 'top_seller_calls.csv');
  writeFileSync(topCsv, exportParcelsCsv(queues.topSellerCalls)); files.push(topCsv);
  const buyerCsv = join(outputDir, 'queues', 'buyer_validation.csv');
  writeFileSync(buyerCsv, toQueueRows(queues.buyerValidation, ['buyerId', 'name', 'market', 'phone', 'website', 'task', 'confidence'])); files.push(buyerCsv);
  const offerCsv = join(outputDir, 'queues', 'offer_ready.csv');
  writeFileSync(offerCsv, toQueueRows(queues.offerReady, ['parcelId', 'address', 'ownerName', 'ownerPhone', 'askingPrice', 'buyerMaxPrice', 'score'])); files.push(offerCsv);
  const missingCsv = join(outputDir, 'queues', 'missing_data.csv');
  writeFileSync(missingCsv, toQueueRows(queues.missingData, ['parcelId', 'address', 'severity', 'missing', 'reason'])); files.push(missingCsv);
  return { outputDir, files, briefing };
}

export function runLeadEngine({ sourcesPath = resolve(repoRoot, 'data', 'sources.json'), outputDir = resolve(repoRoot, 'data', 'generated'), now = new Date().toISOString(), runId } = {}) {
  const snapshot = generateLeadEngineSnapshot(loadLeadSources(sourcesPath), { now, runId: runId || `lead-engine-${now.replace(/[:.]/g, '-')}` });
  const queues = buildLeadQueues(snapshot);
  const manifest = writeLeadEngineOutputs({ snapshot, queues, outputDir });
  return { snapshot, queues, manifest };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDirArg = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : undefined;
  const result = runLeadEngine({ outputDir: outputDirArg ? resolve(outputDirArg) : undefined });
  console.log(result.manifest.briefing.markdown);
}
