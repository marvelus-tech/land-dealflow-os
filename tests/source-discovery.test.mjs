import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildDiscoveryQueries,
  discoverAreaSourceCandidates,
  discoverSourcesForMarkets,
} from '../scripts/adapters/source-discovery.mjs';
import { generateLeadEngineSnapshot, buildLeadQueues, writeLeadEngineOutputs } from '../scripts/lead-engine.mjs';

const market = { id: 'ocala', name: 'Ocala, FL', state: 'FL', county: 'Marion County', buyerType: 'custom-builder', priority: 6 };

async function fakeFetchJson(url) {
  const text = String(url);
  if (text.includes('arcgis.com')) {
    return {
      results: [{
        id: 'arc-1',
        name: 'Marion County Parcels',
        title: 'Marion County Parcels',
        description: 'Parcel ownership and situs address layer',
        url: 'https://example.com/arcgis/rest/services/Parcels/FeatureServer/0',
        type: 'Feature Service',
      }],
    };
  }
  if (text.includes('api.us.socrata.com')) {
    return {
      results: [{
        resource: {
          id: 'abcd-1234',
          name: 'Building Permits',
          description: 'Marion County issued building permit records with contractors',
          domain: 'data.example.gov',
          type: 'dataset',
        },
        metadata: { domain: 'data.example.gov' },
      }],
    };
  }
  throw new Error(`unexpected URL ${url}`);
}

function testBuildDiscoveryQueriesRelatesSourcesToTargetArea() {
  const queries = buildDiscoveryQueries(market);
  assert.ok(queries.some(query => query.includes('Ocala')));
  assert.ok(queries.some(query => query.includes('Marion County')));
  assert.ok(queries.some(query => query.includes('building permits')));
  assert.ok(queries.some(query => query.includes('parcels')));
}

async function testDiscoverAreaSourceCandidatesNormalizesArcgisAndSocrata() {
  const candidates = await discoverAreaSourceCandidates(market, { fetchJson: fakeFetchJson, limitPerQuery: 1 });
  assert.ok(candidates.some(item => item.platform === 'arcgis'));
  assert.ok(candidates.some(item => item.platform === 'socrata'));
  assert.ok(candidates.every(item => item.market === 'ocala'));
  assert.ok(candidates.some(item => item.sourceType === 'parcel'));
  assert.ok(candidates.some(item => item.sourceType === 'permit'));
  assert.ok(candidates.every(item => item.confidence > 0));
}

async function testDiscoverSourcesForMarketsDedupesAndRanks() {
  const sources = await discoverSourcesForMarkets([market], { fetchJson: fakeFetchJson, limitPerQuery: 1 });
  assert.ok(sources.length >= 2);
  assert.equal(sources[0].market, 'ocala');
  assert.ok(sources[0].confidence >= sources.at(-1).confidence);
}

async function testLeadEngineWritesSourceCandidateCsvsPerArea() {
  const snapshot = generateLeadEngineSnapshot({
    version: 1,
    targetMarkets: [market],
    buyerSources: [{ id: 'seed-buyers', market: 'ocala', records: [] }],
    parcelSources: [{ id: 'seed-parcels', market: 'ocala', records: [] }],
  }, { runId: 'source-test', now: '2026-06-16T10:00:00.000Z' });
  snapshot.sourceCandidates = await discoverSourcesForMarkets(snapshot.markets, { fetchJson: fakeFetchJson, limitPerQuery: 1 });
  const queues = buildLeadQueues(snapshot);
  const dir = mkdtempSync(join(tmpdir(), 'lead-engine-source-'));
  writeLeadEngineOutputs({ snapshot, queues, outputDir: dir });
  assert.ok(existsSync(join(dir, 'source_candidates.csv')));
  assert.ok(existsSync(join(dir, 'areas', 'ocala', 'source_candidates.csv')));
  const csv = readFileSync(join(dir, 'areas', 'ocala', 'source_candidates.csv'), 'utf8');
  assert.ok(csv.includes('Marion County Parcels'));
  assert.ok(csv.includes('Building Permits'));
}

await testBuildDiscoveryQueriesRelatesSourcesToTargetArea();
await testDiscoverAreaSourceCandidatesNormalizesArcgisAndSocrata();
await testDiscoverSourcesForMarketsDedupesAndRanks();
await testLeadEngineWritesSourceCandidateCsvsPerArea();

console.log('source discovery tests passed');
