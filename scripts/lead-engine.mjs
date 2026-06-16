import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDealFitMatrix, buildTopCallList, exportParcelsCsv, reportMissingData, scoreParcelDeal } from '../src/core.mjs';
import { discoverSourcesForMarkets } from './adapters/source-discovery.mjs';

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
  const builtCalls = buildTopCallList({ parcels: scored, buyers, limit: 25 }).map(item => ({ queue: 'top_seller_calls', market: scored.find(parcel => (parcel.parcelId || parcel.id) === item.parcelId)?.market || item.market, ...item }));
  const fallbackCalls = scored
    .filter(parcel => parcel.ownerName && (parcel.ownerPhone || parcel.ownerEmail) && parcel.risk?.status !== 'Kill')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 25)
    .map((parcel, index) => ({ queue: 'top_seller_calls', market: parcel.market, callPriority: index + 1, parcelId: parcel.parcelId || parcel.id, address: parcel.address, ownerName: parcel.ownerName, ownerPhone: parcel.ownerPhone || '', ownerEmail: parcel.ownerEmail || '', score: parcel.score, action: parcel.action, askingPrice: parcel.askingPrice, buyerMaxPrice: parcel.buyerMaxPrice }));
  const topSellerCalls = builtCalls.length ? builtCalls : fallbackCalls;
  const missingData = reportMissingData(scored).rows.map(item => {
    const parcel = scored.find(candidate => (candidate.parcelId || candidate.id || candidate.address) === item.id || candidate.address === item.address) || {};
    return { queue: 'missing_data', ...item, market: parcel.market || '', parcelId: item.id, missing: item.missing.join('|') };
  });
  const fitMatrix = buildDealFitMatrix(scored, buyers);
  const buyerValidation = buyers
    .filter(buyer => !buyer.exactBuyBox || !buyer.phone || buyer.validationStatus !== 'validated')
    .map(buyer => ({ buyerId: buyer.id, name: buyer.name, market: buyer.market, phone: buyer.phone || '', website: buyer.website || '', task: buyer.exactBuyBox ? 'validate proof/close speed' : 'capture exact buy box', confidence: buyer.confidence || 0 }));
  const riskBlocked = scored.filter(parcel => parcel.risk?.status === 'Kill' || parcel.roadAccess === false || parcel.wetlands === true).map(parcel => ({ parcelId: parcel.parcelId || parcel.id, address: parcel.address, reason: parcel.risk?.reason || 'buildability risk', market: parcel.market }));
  const offerReady = scored.filter(parcel => parcel.ownerName && (parcel.ownerPhone || parcel.ownerEmail) && parcel.risk?.status !== 'Kill' && Number(parcel.buyerMaxPrice || 0) > Number(parcel.askingPrice || 0)).map(parcel => ({ parcelId: parcel.parcelId || parcel.id, market: parcel.market, address: parcel.address, ownerName: parcel.ownerName, ownerPhone: parcel.ownerPhone || '', askingPrice: parcel.askingPrice || '', buyerMaxPrice: parcel.buyerMaxPrice || '', score: parcel.score }));
  const buyerDiscovery = asArray(snapshot.markets)
    .filter(market => !buyers.some(buyer => buyer.market === market.id))
    .map(market => ({ market: market.id, areaName: market.name, buyerType: market.buyerType || 'builder', task: `Find active ${market.buyerType || 'land buyers'} in ${market.name}`, reason: 'new target area needs buyer discovery', priority: market.priority || 0 }));
  const sellerDiscovery = asArray(snapshot.markets)
    .filter(market => !parcels.some(parcel => parcel.market === market.id))
    .map(market => ({ market: market.id, areaName: market.name, task: `Find owner/seller parcel leads in ${market.name}`, reason: 'new target area needs seller/parcel discovery', priority: market.priority || 0 }));
  return { topSellerCalls, buyerValidation, buyerDiscovery, sellerDiscovery, missingData, riskBlocked, offerReady, fitMatrix: fitMatrix.slice(0, 50) };
}

export function buildAreaQueueBundles(snapshot, queues) {
  const bundles = {};
  for (const market of asArray(snapshot.markets)) {
    bundles[market.id] = {
      market: market.id,
      areaName: market.name,
      buyers: asArray(snapshot.buyers).filter(item => item.market === market.id),
      parcels: asArray(snapshot.parcels).filter(item => item.market === market.id),
      topSellerCalls: asArray(queues.topSellerCalls).filter(item => item.market === market.id),
      buyerValidation: asArray(queues.buyerValidation).filter(item => item.market === market.id),
      buyerDiscovery: asArray(queues.buyerDiscovery).filter(item => item.market === market.id),
      sellerDiscovery: asArray(queues.sellerDiscovery).filter(item => item.market === market.id),
      offerReady: asArray(queues.offerReady).filter(item => item.market === market.id),
      missingData: asArray(queues.missingData).filter(item => item.market === market.id),
      riskBlocked: asArray(queues.riskBlocked).filter(item => item.market === market.id),
      sourceCandidates: asArray(snapshot.sourceCandidates).filter(item => item.market === market.id),
    };
  }
  return bundles;
}

export function buildSitePublishPlan({ hasChanges, branch = 'main' } = {}) {
  if (!hasChanges) return { shouldCommit: false, commands: [] };
  return {
    shouldCommit: true,
    commands: [
      'git add data/generated',
      'git commit -m "chore: publish generated lead outputs"',
      `env -u GITHUB_TOKEN -u GH_TOKEN git push origin ${branch}`,
    ],
  };
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
    `- New-area buyer discovery tasks: ${queues.buyerDiscovery.length}`,
    `- New-area seller discovery tasks: ${queues.sellerDiscovery.length}`,
    `- Source candidates found: ${asArray(snapshot.sourceCandidates).length}`,
    `- Missing-data blockers: ${queues.missingData.length}`,
    '',
    '## Top seller calls',
    ...queues.topSellerCalls.slice(0, 10).map((item, index) => `${index + 1}. ${item.address} — ${item.ownerName || 'owner'} — ${item.ownerPhone || item.ownerEmail || 'needs contact'} — score ${item.score}`),
    '',
    '## Buyer validation tasks',
    ...queues.buyerValidation.slice(0, 10).map((item, index) => `${index + 1}. ${item.name} — ${item.task} — ${item.phone || item.website || 'find contact'}`),
    '',
    '## New-area discovery tasks',
    ...[...queues.buyerDiscovery, ...queues.sellerDiscovery].slice(0, 10).map((item, index) => `${index + 1}. ${item.areaName || item.market} — ${item.reason} — ${item.task}`),
    '',
    '## Source candidates',
    ...asArray(snapshot.sourceCandidates).slice(0, 10).map((item, index) => `${index + 1}. ${item.areaName || item.market} — ${item.platform}/${item.sourceType} — ${item.title} — confidence ${item.confidence}`),
    '',
    '## Offer-ready deals',
    ...queues.offerReady.slice(0, 10).map((item, index) => `${index + 1}. ${item.address} — ask ${item.askingPrice || 'unknown'} — max ${item.buyerMaxPrice || 'unknown'}`),
  ];
  return { markdown: `${lines.join('\n')}\n`, counts: { markets: snapshot.markets.length, buyers: snapshot.buyers.length, parcels: snapshot.parcels.length, topSellerCalls: queues.topSellerCalls.length, offerReady: queues.offerReady.length, buyerDiscovery: queues.buyerDiscovery.length, sellerDiscovery: queues.sellerDiscovery.length, sourceCandidates: asArray(snapshot.sourceCandidates).length } };
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
  const areasPath = join(outputDir, 'areas.json');
  const areaBundles = buildAreaQueueBundles(snapshot, queues);
  writeJson(areasPath, areaBundles); files.push(areasPath);
  const sourceCandidatesCsv = join(outputDir, 'source_candidates.csv');
  writeFileSync(sourceCandidatesCsv, toQueueRows(asArray(snapshot.sourceCandidates), ['market', 'areaName', 'platform', 'sourceType', 'title', 'url', 'confidence', 'suggestedUse', 'query'])); files.push(sourceCandidatesCsv);
  const topCsv = join(outputDir, 'queues', 'top_seller_calls.csv');
  writeFileSync(topCsv, exportParcelsCsv(queues.topSellerCalls)); files.push(topCsv);
  const buyerCsv = join(outputDir, 'queues', 'buyer_validation.csv');
  writeFileSync(buyerCsv, toQueueRows(queues.buyerValidation, ['buyerId', 'name', 'market', 'phone', 'website', 'task', 'confidence'])); files.push(buyerCsv);
  const offerCsv = join(outputDir, 'queues', 'offer_ready.csv');
  writeFileSync(offerCsv, toQueueRows(queues.offerReady, ['parcelId', 'address', 'ownerName', 'ownerPhone', 'askingPrice', 'buyerMaxPrice', 'score'])); files.push(offerCsv);
  const missingCsv = join(outputDir, 'queues', 'missing_data.csv');
  writeFileSync(missingCsv, toQueueRows(queues.missingData, ['parcelId', 'market', 'address', 'severity', 'missing', 'reason'])); files.push(missingCsv);
  const buyerDiscoveryCsv = join(outputDir, 'queues', 'buyer_discovery.csv');
  writeFileSync(buyerDiscoveryCsv, toQueueRows(queues.buyerDiscovery, ['market', 'areaName', 'buyerType', 'task', 'reason', 'priority'])); files.push(buyerDiscoveryCsv);
  const sellerDiscoveryCsv = join(outputDir, 'queues', 'seller_discovery.csv');
  writeFileSync(sellerDiscoveryCsv, toQueueRows(queues.sellerDiscovery, ['market', 'areaName', 'task', 'reason', 'priority'])); files.push(sellerDiscoveryCsv);
  for (const [marketId, bundle] of Object.entries(areaBundles)) {
    const areaDir = join(outputDir, 'areas', marketId);
    mkdirSync(areaDir, { recursive: true });
    const paths = [
      ['buyers.csv', bundle.buyers, ['leadId', 'market', 'name', 'phone', 'email', 'website', 'contactName', 'buyBox', 'confidence']],
      ['sellers.csv', bundle.parcels, ['leadId', 'market', 'parcelId', 'address', 'ownerName', 'ownerPhone', 'ownerEmail', 'askingPrice', 'buyerMaxPrice', 'sourceId']],
      ['seller_calls.csv', bundle.topSellerCalls, ['parcelId', 'market', 'address', 'ownerName', 'ownerPhone', 'ownerEmail', 'score', 'askingPrice', 'buyerMaxPrice']],
      ['buyer_validation.csv', bundle.buyerValidation, ['buyerId', 'name', 'market', 'phone', 'website', 'task', 'confidence']],
      ['offer_ready.csv', bundle.offerReady, ['parcelId', 'market', 'address', 'ownerName', 'ownerPhone', 'askingPrice', 'buyerMaxPrice', 'score']],
      ['missing_data.csv', bundle.missingData, ['parcelId', 'market', 'address', 'severity', 'missing', 'reason']],
      ['buyer_discovery.csv', bundle.buyerDiscovery, ['market', 'areaName', 'buyerType', 'task', 'reason', 'priority']],
      ['seller_discovery.csv', bundle.sellerDiscovery, ['market', 'areaName', 'task', 'reason', 'priority']],
      ['source_candidates.csv', bundle.sourceCandidates, ['market', 'areaName', 'platform', 'sourceType', 'title', 'url', 'confidence', 'suggestedUse', 'query']],
    ];
    for (const [fileName, rows, headers] of paths) {
      const path = join(areaDir, fileName);
      writeFileSync(path, toQueueRows(rows, headers));
      files.push(path);
    }
  }
  return { outputDir, files, briefing };
}

export async function runLeadEngine({ sourcesPath = resolve(repoRoot, 'data', 'sources.json'), outputDir = resolve(repoRoot, 'data', 'generated'), now = new Date().toISOString(), runId, discoverSources = false } = {}) {
  const snapshot = generateLeadEngineSnapshot(loadLeadSources(sourcesPath), { now, runId: runId || `lead-engine-${now.replace(/[:.]/g, '-')}` });
  if (discoverSources) snapshot.sourceCandidates = await discoverSourcesForMarkets(snapshot.markets, { limitPerQuery: 2 });
  const queues = buildLeadQueues(snapshot);
  const manifest = writeLeadEngineOutputs({ snapshot, queues, outputDir });
  return { snapshot, queues, manifest };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDirArg = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : undefined;
  const discoverSources = process.argv.includes('--discover-sources');
  const result = await runLeadEngine({ outputDir: outputDirArg ? resolve(outputDirArg) : undefined, discoverSources });
  console.log(result.manifest.briefing.markdown);
}
