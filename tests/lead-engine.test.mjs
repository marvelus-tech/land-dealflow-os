import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadLeadSources,
  generateLeadEngineSnapshot,
  buildLeadQueues,
  writeLeadEngineOutputs,
  buildOperatorBriefing,
  buildAreaQueueBundles,
  buildSitePublishPlan,
} from '../scripts/lead-engine.mjs';
import { normalizeCategoricalParcel, normalizePermitBuilder } from '../scripts/adapters/knoxville-kgis-public-leads.mjs';
import { buildDeltaBriefing, buildLeadEngineDelta, leadEngineFingerprint } from '../scripts/lead-engine-delta.mjs';
import { PERMIT_STATE_PRIORITY } from '../scripts/priority-permit-markets.mjs';

const sampleSources = {
  version: 1,
  targetMarkets: [
    { id: 'lehigh', name: 'Lehigh Acres, FL', state: 'FL', buyerType: 'spec-builder', thesis: 'Quarter-acre infill lots with builder demand.', priority: 10 },
    { id: 'ocala', name: 'Ocala, FL', state: 'FL', buyerType: 'custom-builder', thesis: 'Infill and rural-edge lots for small builders.', priority: 6 },
  ],
  buyerSources: [
    { id: 'lehigh-builders-public', market: 'lehigh', state: 'FL', type: 'public-record', cadence: 'weekly', sourceUrl: 'https://example.gov/permits', records: [
      { name: 'Precision Gulf Homes', website: 'https://precisiongulf.example', phone: '239-555-0100', contactName: 'Maya Chen', recentBuilds: 18, closeSpeedDays: 14, maxPrice: 42000, exactBuyBox: { targetMarkets: ['lehigh'], lotSizeMin: 0.23, lotSizeMax: 0.32, maxPrice: 42000, requiredRoadAccess: true, avoidWetlands: true } },
    ]},
  ],
  parcelSources: [
    { id: 'lehigh-parcels-public', market: 'lehigh', state: 'FL', type: 'public-record', cadence: 'daily', sourceUrl: 'https://example.gov/parcels', records: [
      { parcelId: 'LEH-001', address: '123 Grant Blvd, Lehigh Acres, FL', market: 'lehigh', lotSize: '0.25 ac', lotSizeAcres: 0.25, ownerName: 'Avery Santos', ownerPhone: '239-555-0131', ownerMailingAddress: '88 Pine St, Tampa FL', askingPrice: 28500, lowestActiveListing: 48000, buyerMaxPrice: 42000, roadAccess: true, utilities: true, wetlands: false, floodZone: 'X' },
      { parcelId: 'LEH-002', address: '711 Meadow Rd, Lehigh Acres, FL', market: 'lehigh', lotSize: '0.25 ac', lotSizeAcres: 0.25, ownerName: 'River Trust', askingPrice: 36000, lowestActiveListing: 47000, buyerMaxPrice: 42000, roadAccess: false, utilities: false, wetlands: true, floodZone: 'AE' },
    ]},
  ],
};

function testLoadSourcesValidatesWorkflowInputs() {
  const loaded = loadLeadSources(sampleSources);
  assert.equal(loaded.targetMarkets.length, 2);
  assert.equal(loaded.buyerSources[0].records.length, 1);
  assert.equal(loaded.parcelSources[0].records.length, 2);
}

function testSnapshotGeneratesMarketsBuyersParcelsAndMetadata() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  assert.equal(snapshot.runId, 'test-run');
  assert.equal(snapshot.markets.length, 2);
  assert.equal(snapshot.buyers[0].sourceId, 'lehigh-builders-public');
  assert.equal(snapshot.parcels.length, 2);
  assert.equal(snapshot.parcels[0].leadId, 'parcel:lehigh:LEH-001');
}

function testSnapshotBlocksSeedDemoRowsFromActiveLeads() {
  const seededOnly = {
    version: 1,
    targetMarkets: [{ id: 'knoxville-tn', name: 'Knoxville, TN', state: 'TN', buyerType: 'infill-builder', priority: 9 }],
    buyerSources: [{ id: 'fake-builder-seed', market: 'knoxville-tn', state: 'TN', type: 'seed', records: [{ name: 'Made Up Builder', phone: '555-0000' }] }],
    parcelSources: [{ id: 'fake-parcel-seed', market: 'knoxville-tn', state: 'TN', type: 'seed', records: [{ parcelId: 'FAKE-001', address: '123 Fiction Rd, Knoxville, TN', ownerName: 'Made Up Owner', ownerPhone: '555-0001' }] }],
  };
  const snapshot = generateLeadEngineSnapshot(seededOnly, { runId: 'seed-block-test', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  assert.equal(snapshot.buyers.length, 0);
  assert.equal(snapshot.parcels.length, 0);
  assert.equal(queues.topSellerCalls.length, 0);
  assert.equal(queues.skipTrace.length, 0);
  assert.equal(queues.offerReady.length, 0);
}

function testQueuesPromoteContactableBuyerFitDealsAndBlockRiskyDeals() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  assert.ok(queues.topSellerCalls.length >= 1);
  assert.equal(queues.topSellerCalls[0].parcelId, 'LEH-001');
  assert.ok(Array.isArray(queues.skipTrace));
  assert.ok(queues.buyerValidation.length >= 1);
  assert.ok(queues.riskBlocked.some(item => item.parcelId === 'LEH-002'));
  assert.ok(queues.offerReady.some(item => item.parcelId === 'LEH-001'));
}

function testPublicOwnerLeadsWithoutPhoneEnterSkipTraceQueue() {
  const publicSources = structuredClone(sampleSources);
  publicSources.parcelSources[0].records.push({
    parcelId: 'LEH-REAL-001',
    address: '1050 Bell Blvd S, Lehigh Acres, FL',
    market: 'lehigh',
    lotSize: '0.25 ac',
    lotSizeAcres: 0.25,
    ownerName: 'Real Absentee Owner',
    ownerMailingAddress: '37 Harwood Dr, Barrie Canada',
    askingPrice: 12062,
    assessedLandValue: 12062,
    buyerMaxPrice: 42000,
    roadAccess: true,
    utilities: 'unknown',
    wetlands: 'unknown',
    floodZone: 'unknown',
    confidence: 96,
  });
  const snapshot = generateLeadEngineSnapshot(publicSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  assert.ok(queues.skipTrace.some(item => item.parcelId === 'LEH-REAL-001'));
  assert.ok(queues.skipTrace[0].task.includes('skip trace'));
}

function testBriefingSummarizesConveyorBeltActions() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  const briefing = buildOperatorBriefing(snapshot, queues);
  assert.ok(briefing.markdown.includes('Lead Engine Briefing'));
  assert.ok(briefing.markdown.includes('Top seller calls'));
  assert.ok(briefing.markdown.includes('123 Grant Blvd'));
  assert.equal(briefing.counts.parcels, 2);
}

function testWriteOutputsCreatesMachineReadableFilesAndCsvQueues() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  const dir = mkdtempSync(join(tmpdir(), 'lead-engine-'));
  const manifest = writeLeadEngineOutputs({ snapshot, queues, outputDir: dir });
  assert.ok(existsSync(join(dir, 'latest.json')));
  assert.ok(existsSync(join(dir, 'briefing.md')));
  assert.ok(existsSync(join(dir, 'queues', 'top_seller_calls.csv')));
  const latest = JSON.parse(readFileSync(join(dir, 'latest.json'), 'utf8'));
  assert.equal(latest.snapshot.runId, 'test-run');
  assert.ok(manifest.files.some(file => file.endsWith('top_seller_calls.csv')));
}

function testTargetAreasCascadeIntoRelatedBuyerAndSellerDiscoveryTasks() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  const ocalaBuyerTasks = queues.buyerDiscovery.filter(item => item.market === 'ocala');
  const ocalaSellerTasks = queues.sellerDiscovery.filter(item => item.market === 'ocala');
  assert.equal(ocalaBuyerTasks[0].areaName, 'Ocala, FL');
  assert.equal(ocalaBuyerTasks[0].reason, 'new target area needs buyer discovery');
  assert.equal(ocalaSellerTasks[0].reason, 'new target area needs seller/parcel discovery');
}

function testAreaBundlesKeepBuyersSellersAndQueuesGeographicallyRelated() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  const bundles = buildAreaQueueBundles(snapshot, queues);
  assert.ok(bundles.lehigh.buyers.every(item => item.market === 'lehigh'));
  assert.ok(bundles.lehigh.parcels.every(item => item.market === 'lehigh'));
  assert.ok(bundles.lehigh.topSellerCalls.every(item => item.market === 'lehigh'));
  assert.ok(bundles.ocala.buyerDiscovery.length > 0);
  assert.ok(bundles.ocala.sellerDiscovery.length > 0);
}

function testWriteOutputsUploadsAreaCsvBundlesForTheStaticSite() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  const dir = mkdtempSync(join(tmpdir(), 'lead-engine-'));
  const manifest = writeLeadEngineOutputs({ snapshot, queues, outputDir: dir });
  assert.ok(existsSync(join(dir, 'areas', 'lehigh', 'buyers.csv')));
  assert.ok(existsSync(join(dir, 'areas', 'lehigh', 'seller_calls.csv')));
  assert.ok(existsSync(join(dir, 'areas', 'ocala', 'buyer_discovery.csv')));
  assert.ok(existsSync(join(dir, 'areas', 'ocala', 'seller_discovery.csv')));
  assert.ok(manifest.files.some(file => file.endsWith('areas/ocala/buyer_discovery.csv')));
}

function testSitePublishPlanCommitsGeneratedCsvsOnlyWhenOutputsChanged() {
  const clean = buildSitePublishPlan({ hasChanges: false, branch: 'main' });
  assert.equal(clean.shouldCommit, false);
  const dirty = buildSitePublishPlan({ hasChanges: true, branch: 'main' });
  assert.equal(dirty.shouldCommit, true);
  assert.ok(dirty.commands.some(command => command.includes('git add data/generated')));
  assert.ok(dirty.commands.some(command => command.includes('git push')));
}

function testLeadEngineDeltaIgnoresTimestampOnlyChurn() {
  const firstSnapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'run-one', now: '2026-06-16T09:00:00.000Z' });
  const secondSnapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'run-two', now: '2026-06-17T09:00:00.000Z' });
  const firstLatest = { snapshot: firstSnapshot, queues: buildLeadQueues(firstSnapshot), generatedAt: firstSnapshot.generatedAt };
  const secondLatest = { snapshot: secondSnapshot, queues: buildLeadQueues(secondSnapshot), generatedAt: secondSnapshot.generatedAt };
  assert.equal(leadEngineFingerprint(firstLatest), leadEngineFingerprint(secondLatest));
  const delta = buildLeadEngineDelta(firstLatest, secondLatest);
  assert.equal(delta.unchanged, true);
  assert.equal(buildDeltaBriefing(firstLatest, secondLatest), '');
}

function testLeadEngineDeltaReportsOnlyNewRows() {
  const firstSnapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'run-one', now: '2026-06-16T09:00:00.000Z' });
  const expandedSources = structuredClone(sampleSources);
  expandedSources.parcelSources[0].records.push({
    parcelId: 'LEH-NEW-003',
    address: '221 New Owner Rd, Lehigh Acres, FL',
    market: 'lehigh',
    lotSize: '0.25 ac',
    lotSizeAcres: 0.25,
    ownerName: 'New Public Owner',
    ownerMailingAddress: 'PO Box 221, Tampa FL',
    assessedLandValue: 11000,
    buyerMaxPrice: 42000,
    roadAccess: true,
    wetlands: false,
    confidence: 93,
  });
  const secondSnapshot = generateLeadEngineSnapshot(expandedSources, { runId: 'run-two', now: '2026-06-17T09:00:00.000Z' });
  const firstLatest = { snapshot: firstSnapshot, queues: buildLeadQueues(firstSnapshot), generatedAt: firstSnapshot.generatedAt };
  const secondLatest = { snapshot: secondSnapshot, queues: buildLeadQueues(secondSnapshot), generatedAt: secondSnapshot.generatedAt };
  const delta = buildLeadEngineDelta(firstLatest, secondLatest);
  assert.equal(delta.unchanged, false);
  assert.equal(delta.deltas.skipTrace.length, 1);
  const briefing = buildDeltaBriefing(firstLatest, secondLatest);
  assert.match(briefing, /Lead Engine Delta/);
  assert.match(briefing, /221 New Owner Rd/);
  assert.doesNotMatch(briefing, /711 Meadow Rd/);
}

function testKnoxvilleKgisNormalizersKeepPermitSignalsOutOfCallableSellerQueues() {
  const builder = normalizePermitBuilder('Summit Homes LLC', [
    { PERMITNUMBER: 'IRC-NEW-24-0001', PARCELID: '058FA03001', PERMITVALUE: 125000, DESCRIPTION: 'Dwelling - Single Family', PERMITTYPE: 'SFR', CLASSWORK: 'New', LANDUSE: 'Single Family Residential', ADDRESS: '2544 BERNHURST DR', DATEISSUED: 1703030400000 },
    { PERMITNUMBER: 'IRC-NEW-24-0002', PARCELID: '058FA03002', PERMITVALUE: 150000, DESCRIPTION: 'Dwelling - Single Family', PERMITTYPE: 'SFR', CLASSWORK: 'New', LANDUSE: 'Single Family Residential', ADDRESS: '2550 BERNHURST DR', DATEISSUED: 1703116800000 },
  ]);
  const parcel = normalizeCategoricalParcel({
    PARCELID: '057  068',
    PreUnionAcres: 0.8003693731541254,
    Zone2019: 'OS-1',
    Zone2020: 'C-H-1',
    MAIL_HOUSE_NUMBER: '2917',
    MAIL_STREET_NAME: 'EDONIA DR',
    MAIL_CITY: 'KNOXVILLE',
    MAIL_STATE: 'TN',
    MAIL_ZIP_CODE: '37918',
    OWNER: 'REAGAN E B & CHRLOTEE RYALL',
  });
  const kgisSources = {
    version: 2,
    targetMarkets: [{ id: 'knoxville-tn', name: 'Knoxville, TN', state: 'TN', buyerType: 'infill-builder', priority: 9 }],
    buyerSources: [{ id: 'knoxville-kgis-permit-builder-signals-test', market: 'knoxville-tn', state: 'TN', type: 'public-permit-builder-signal', sourceUrl: builder.sourceUrl, records: [builder] }],
    parcelSources: [{ id: 'knoxville-kgis-categorical-parcel-research-test', market: 'knoxville-tn', state: 'TN', type: 'public-parcel-research', sourceUrl: parcel.sourceUrl, records: [parcel] }],
  };
  const snapshot = generateLeadEngineSnapshot(kgisSources, { runId: 'kgis-test', now: '2026-06-18T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  assert.equal(snapshot.buyers.length, 1);
  assert.equal(snapshot.parcels.length, 1);
  assert.equal(queues.buyerValidation.length, 1);
  assert.equal(queues.skipTrace.length, 1);
  assert.equal(queues.topSellerCalls.length, 0);
  assert.equal(queues.offerReady.length, 0);
  assert.equal(snapshot.buyers[0].validationStatus, 'needs-call-confirmation');
  assert.equal(snapshot.parcels[0].ownerPhone, '');
  assert.match(snapshot.parcels[0].publicSource, /KGIS/);
}

function testPriorityPermitModeExpandsAndJudgesLeadingMarketStack() {
  const repo = new URL('..', import.meta.url).pathname;
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'priority-stack-test', now: '2026-06-18T09:00:00.000Z', priorityPermitMarkets: true, repoRoot: repo });
  assert.deepEqual(snapshot.permitMarketJudgement.statePriority, PERMIT_STATE_PRIORITY);
  const markets = snapshot.permitMarketJudgement.markets;
  assert.ok(markets.length >= 15);
  assert.equal(markets[0].state, 'TN');
  assert.ok(markets.find(item => item.market === 'polk-fl'));
  assert.ok(markets.find(item => item.market === 'maricopa-az'));
  assert.ok(markets.find(item => item.market === 'raleigh-nc'));
  assert.ok(markets.find(item => item.market === 'austin-tx'));
  assert.ok(markets.every(item => item.state !== 'KY'));
}

testLoadSourcesValidatesWorkflowInputs();
testSnapshotGeneratesMarketsBuyersParcelsAndMetadata();
testSnapshotBlocksSeedDemoRowsFromActiveLeads();
testQueuesPromoteContactableBuyerFitDealsAndBlockRiskyDeals();
testPublicOwnerLeadsWithoutPhoneEnterSkipTraceQueue();
testBriefingSummarizesConveyorBeltActions();
testWriteOutputsCreatesMachineReadableFilesAndCsvQueues();
testTargetAreasCascadeIntoRelatedBuyerAndSellerDiscoveryTasks();
testAreaBundlesKeepBuyersSellersAndQueuesGeographicallyRelated();
testWriteOutputsUploadsAreaCsvBundlesForTheStaticSite();
testSitePublishPlanCommitsGeneratedCsvsOnlyWhenOutputsChanged();
testLeadEngineDeltaIgnoresTimestampOnlyChurn();
testLeadEngineDeltaReportsOnlyNewRows();
testKnoxvilleKgisNormalizersKeepPermitSignalsOutOfCallableSellerQueues();
testPriorityPermitModeExpandsAndJudgesLeadingMarketStack();

console.log('lead engine tests passed');
