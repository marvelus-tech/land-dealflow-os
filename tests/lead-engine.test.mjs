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
} from '../scripts/lead-engine.mjs';

const sampleSources = {
  version: 1,
  targetMarkets: [
    { id: 'lehigh', name: 'Lehigh Acres, FL', state: 'FL', buyerType: 'spec-builder', thesis: 'Quarter-acre infill lots with builder demand.', priority: 10 },
  ],
  buyerSources: [
    { id: 'lehigh-builders-seed', market: 'lehigh', type: 'seed', cadence: 'weekly', records: [
      { name: 'Precision Gulf Homes', website: 'https://precisiongulf.example', phone: '239-555-0100', contactName: 'Maya Chen', recentBuilds: 18, closeSpeedDays: 14, maxPrice: 42000, exactBuyBox: { targetMarkets: ['lehigh'], lotSizeMin: 0.23, lotSizeMax: 0.32, maxPrice: 42000, requiredRoadAccess: true, avoidWetlands: true } },
    ]},
  ],
  parcelSources: [
    { id: 'lehigh-parcels-seed', market: 'lehigh', type: 'seed', cadence: 'daily', records: [
      { parcelId: 'LEH-001', address: '123 Grant Blvd, Lehigh Acres, FL', market: 'lehigh', lotSize: '0.25 ac', lotSizeAcres: 0.25, ownerName: 'Avery Santos', ownerPhone: '239-555-0131', ownerMailingAddress: '88 Pine St, Tampa FL', askingPrice: 28500, lowestActiveListing: 48000, buyerMaxPrice: 42000, roadAccess: true, utilities: true, wetlands: false, floodZone: 'X' },
      { parcelId: 'LEH-002', address: '711 Meadow Rd, Lehigh Acres, FL', market: 'lehigh', lotSize: '0.25 ac', lotSizeAcres: 0.25, ownerName: 'River Trust', askingPrice: 36000, lowestActiveListing: 47000, buyerMaxPrice: 42000, roadAccess: false, utilities: false, wetlands: true, floodZone: 'AE' },
    ]},
  ],
};

function testLoadSourcesValidatesWorkflowInputs() {
  const loaded = loadLeadSources(sampleSources);
  assert.equal(loaded.targetMarkets.length, 1);
  assert.equal(loaded.buyerSources[0].records.length, 1);
  assert.equal(loaded.parcelSources[0].records.length, 2);
}

function testSnapshotGeneratesMarketsBuyersParcelsAndMetadata() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  assert.equal(snapshot.runId, 'test-run');
  assert.equal(snapshot.markets.length, 1);
  assert.equal(snapshot.buyers[0].sourceId, 'lehigh-builders-seed');
  assert.equal(snapshot.parcels.length, 2);
  assert.equal(snapshot.parcels[0].leadId, 'parcel:lehigh:LEH-001');
}

function testQueuesPromoteContactableBuyerFitDealsAndBlockRiskyDeals() {
  const snapshot = generateLeadEngineSnapshot(sampleSources, { runId: 'test-run', now: '2026-06-16T09:00:00.000Z' });
  const queues = buildLeadQueues(snapshot);
  assert.ok(queues.topSellerCalls.length >= 1);
  assert.equal(queues.topSellerCalls[0].parcelId, 'LEH-001');
  assert.ok(queues.buyerValidation.length >= 1);
  assert.ok(queues.riskBlocked.some(item => item.parcelId === 'LEH-002'));
  assert.ok(queues.offerReady.some(item => item.parcelId === 'LEH-001'));
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

testLoadSourcesValidatesWorkflowInputs();
testSnapshotGeneratesMarketsBuyersParcelsAndMetadata();
testQueuesPromoteContactableBuyerFitDealsAndBlockRiskyDeals();
testBriefingSummarizesConveyorBeltActions();
testWriteOutputsCreatesMachineReadableFilesAndCsvQueues();

console.log('lead engine tests passed');
