import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildWeeklyMarketScout,
  loadMarketScoutSource,
  scoreMarketCandidate,
  writeWeeklyMarketScoutOutputs,
} from '../scripts/weekly-market-scout.mjs';

const fixture = {
  version: 1,
  source: { title: 'Transcript fixture' },
  criteria: [
    { id: 'newBuildSignal', label: 'New builds', weight: 20, threshold: '>= 5' },
    { id: 'builderDiscoverability', label: 'Builders', weight: 20, threshold: '> 5' },
    { id: 'vacantLotSupply', label: 'Vacant lots', weight: 15, threshold: 'enough supply' },
    { id: 'lotStandardization', label: 'Cookie-cutter', weight: 15, threshold: 'repeatable' },
    { id: 'growthSignal', label: 'Growth', weight: 10, threshold: 'growth' },
    { id: 'metroEdgeFit', label: 'Metro edge', weight: 8, threshold: '30-45 minutes' },
    { id: 'buildabilitySimplicity', label: 'Simple buildability', weight: 7, threshold: 'manageable' },
    { id: 'complianceSimplicity', label: 'Compliance', weight: 5, threshold: 'manageable' },
  ],
  markets: [
    { id: 'active', name: 'Active Market, FL', state: 'FL', status: 'active', mentionedAs: 'active', thesis: 'Already active', scores: { newBuildSignal: 10, builderDiscoverability: 10, vacantLotSupply: 10, lotStandardization: 10, growthSignal: 10, metroEdgeFit: 10, buildabilitySimplicity: 10, complianceSimplicity: 10 } },
    { id: 'good', name: 'Good Market, GA', state: 'GA', status: 'candidate', mentionedAs: 'state', thesis: 'Good candidate', scores: { newBuildSignal: 8, builderDiscoverability: 8, vacantLotSupply: 8, lotStandardization: 7, growthSignal: 8, metroEdgeFit: 8, buildabilitySimplicity: 7, complianceSimplicity: 6 }, caveats: ['verify builder buy boxes'] },
    { id: 'thin', name: 'Thin Market, WA', state: 'WA', status: 'candidate', mentionedAs: 'state', thesis: 'Thin candidate', scores: { newBuildSignal: 4, builderDiscoverability: 8, vacantLotSupply: 8, lotStandardization: 8, growthSignal: 8, metroEdgeFit: 8, buildabilitySimplicity: 7, complianceSimplicity: 7 } },
  ],
};

function testScoreMarketCandidateUsesTranscriptCriteriaAndHardFlags() {
  const source = loadMarketScoutSource(fixture);
  const goodScore = scoreMarketCandidate(source.markets[1], source.criteria);
  assert.equal(goodScore.total, 77);
  assert.equal(goodScore.eligible, true);
  assert.ok(goodScore.reasons.includes('visible new-build activity'));
  const thinScore = scoreMarketCandidate(source.markets[2], source.criteria);
  assert.equal(thinScore.eligible, false);
  assert.ok(thinScore.flags.includes('fails new-build threshold'));
}

function testBuildWeeklyMarketScoutSkipsAlreadyActiveMarketsAndOutputsActions() {
  const scout = buildWeeklyMarketScout(fixture, { now: '2026-01-01T00:00:00.000Z' });
  assert.equal(scout.recommendedMarket.id, 'good');
  assert.equal(scout.recommendedMarket.nextStatus, 'buyer-validation-research');
  assert.ok(scout.recommendedMarket.firstActions[0].includes('2025–2026'));
  assert.ok(scout.eligibleMarkets.every(item => item.id !== 'active'));
}

function testWriteWeeklyMarketScoutOutputs() {
  const scout = buildWeeklyMarketScout(fixture, { now: '2026-01-01T00:00:00.000Z' });
  const dir = mkdtempSync(join(tmpdir(), 'weekly-market-'));
  const result = writeWeeklyMarketScoutOutputs({ scout, outputDir: dir });
  assert.equal(result.files.length, 3);
  assert.ok(existsSync(join(dir, 'latest.json')));
  assert.ok(existsSync(join(dir, 'history', '2026-01-01.json')));
  const latest = JSON.parse(readFileSync(join(dir, 'latest.json'), 'utf8'));
  assert.equal(latest.recommendedMarket.name, 'Good Market, GA');
}

testScoreMarketCandidateUsesTranscriptCriteriaAndHardFlags();
testBuildWeeklyMarketScoutSkipsAlreadyActiveMarketsAndOutputsActions();
testWriteWeeklyMarketScoutOutputs();

console.log('weekly market scout tests passed');
