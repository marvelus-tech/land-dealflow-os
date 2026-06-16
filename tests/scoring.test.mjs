import assert from 'node:assert/strict';
import { scoreMarket, computeOffer, classifyParcelRisk, rankBuyers } from '../src/core.mjs';

function testScoreMarketRewardsBuilderDemandAndStandardizedLots() {
  const market = {
    newBuilds90d: 42,
    activeBuilders: 12,
    vacantLotSales90d: 99,
    offMarketVacantLots: 2200,
    lotStandardization: 9,
    growthSignal: 8,
    complianceSimplicity: 7,
    buildabilityRisk: 3,
  };
  const score = scoreMarket(market);
  assert.equal(score.grade, 'A');
  assert.ok(score.total >= 80, `expected A market, got ${score.total}`);
  assert.ok(score.reasons.includes('strong builder base'));
}

function testScoreMarketKillsThinBuilderMarkets() {
  const market = {
    newBuilds90d: 4,
    activeBuilders: 2,
    vacantLotSales90d: 8,
    offMarketVacantLots: 30,
    lotStandardization: 2,
    growthSignal: 4,
    complianceSimplicity: 8,
    buildabilityRisk: 2,
  };
  const score = scoreMarket(market);
  assert.equal(score.grade, 'D');
  assert.ok(score.flags.includes('too few builders'));
  assert.ok(score.flags.includes('too little new construction'));
}

function testOfferEngineKeepsSpreadAndSellerNetLogic() {
  const offer = computeOffer({
    buyerMaxPrice: 50000,
    desiredSpreadPct: 0.16,
    closingCosts: 1800,
    riskDiscount: 1500,
    lowestActiveListing: 56000,
  });
  assert.equal(offer.buyerPrice, 50000);
  assert.equal(offer.targetSpread, 8000);
  assert.equal(offer.initialSellerOffer, 38700);
  assert.equal(offer.maxSellerOffer, 42000);
  assert.equal(offer.killPrice, 42500);
}

function testParcelRiskClassification() {
  const risky = classifyParcelRisk({
    wetlands: 'likely',
    floodZone: true,
    roadAccess: false,
    utilities: 'unknown',
    slope: 'steep',
    wildlifeFlag: true,
  });
  assert.equal(risky.status, 'Kill');
  assert.ok(risky.flags.length >= 4);

  const clean = classifyParcelRisk({
    wetlands: 'none',
    floodZone: false,
    roadAccess: true,
    utilities: 'water+sewer',
    slope: 'flat',
    wildlifeFlag: false,
  });
  assert.equal(clean.status, 'Pass');
}

function testRankBuyersPrioritizesRepeatScatteredLotBuilders() {
  const ranked = rankBuyers([
    { name: 'Investor Lowball LLC', recentBuilds: 0, scatteredLots: false, hasBuyBox: true, closeSpeedDays: 30, repeatDemand: 3 },
    { name: 'Precision Homes', recentBuilds: 18, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 14, repeatDemand: 9 },
  ]);
  assert.equal(ranked[0].name, 'Precision Homes');
  assert.ok(ranked[0].score > ranked[1].score);
}

testScoreMarketRewardsBuilderDemandAndStandardizedLots();
testScoreMarketKillsThinBuilderMarkets();
testOfferEngineKeepsSpreadAndSellerNetLogic();
testParcelRiskClassification();
testRankBuyersPrioritizesRepeatScatteredLotBuilders();
console.log('scoring tests passed');
